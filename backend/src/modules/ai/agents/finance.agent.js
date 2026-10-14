/**
 * Finance Agent: Autonomous Tool-Calling Agent Loop
 *
 * Implements:
 * 1. Native Gemini function calling loop with strict schema validation
 * 2. Hardened read-only SQL execution (with CTE user-scoping)
 * 3. Deterministic analytics (spending summary, forecasting)
 * 4. Human-in-the-loop pending actions for WRITE operations (add_transaction, create_budget)
 * 5. Loop guardrails: max 6 iterations, loop detection, overall timeout, step tracing
 */

const { z } = require("zod");
const prisma = require("../../../lib/prisma");
const { callGemini } = require("../services/gemini.service");
const { executeHardenedSql } = require("../utils/sqlGuard");
const { getBudgets } = require("../../budget/budget.service");
const { getCategoryMap, resolveCategoryId } = require("../utils/categoryMap");

// ==========================================
// CONSTANTS & TOOL DECLARATIONS
// ==========================================

const MAX_ITERATIONS = 6;
const AGENT_TIMEOUT_MS = 25000;

const ToolArgSchemas = {
  run_sql: z.object({
    query: z.string().min(5).describe("The read-only PostgreSQL SELECT query"),
  }),
  get_budgets: z.object({
    month: z.number().int().min(1).max(12).optional(),
    year: z.number().int().min(2000).max(2100).optional(),
  }),
  get_spending_summary: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    groupBy: z.enum(["category", "merchant", "month"]).default("category"),
  }),
  forecast_spending: z.object({
    category: z.string().optional(),
    horizonDays: z.number().int().min(1).max(365).default(30),
  }),
  search_tax_knowledge: z.object({
    query: z.string().min(2),
  }),
  add_transaction: z.object({
    amount: z.number().positive(),
    type: z.enum(["INCOME", "EXPENSE"]).default("EXPENSE"),
    category: z.string().min(1),
    description: z.string().min(1),
    merchant: z.string().optional(),
    date: z.string().optional(),
  }),
  create_budget: z.object({
    category: z.string().min(1),
    amount: z.number().positive(),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2000).max(2100),
  }),
};

const FUNCTION_DECLARATIONS = [
  {
    name: "run_sql",
    description: "Run a read-only SELECT SQL query to fetch raw transaction or budget data.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The read-only SELECT SQL statement" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_budgets",
    description: "Retrieve configured budgets, spending progress, and remaining balances.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        month: { type: "integer", description: "Month 1-12" },
        year: { type: "integer", description: "Year e.g. 2026" },
      },
    },
  },
  {
    name: "get_spending_summary",
    description: "Calculate deterministic spending breakdown grouped by category, merchant, or month.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        from: { type: "string", description: "Start date YYYY-MM-DD" },
        to: { type: "string", description: "End date YYYY-MM-DD" },
        groupBy: { type: "string", enum: ["category", "merchant", "month"], description: "Group dimension" },
      },
    },
  },
  {
    name: "forecast_spending",
    description: "Project future expenses using deterministic historical daily run rate. No LLM math.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Category name or empty for all" },
        horizonDays: { type: "integer", description: "Forecast days (default 30)" },
      },
    },
  },
  {
    name: "search_tax_knowledge",
    description: "Search India tax knowledge base for official tax rules, deductions, and exemptions.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Tax query to search" },
      },
      required: ["query"],
    },
  },
  {
    name: "add_transaction",
    description: "Create a new transaction. (WRITE TOOL: Produces a pending action requiring user confirmation).",
    parametersJsonSchema: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Amount in INR" },
        type: { type: "string", enum: ["INCOME", "EXPENSE"], description: "Type" },
        category: { type: "string", description: "Category name" },
        description: { type: "string", description: "Description or note" },
        merchant: { type: "string", description: "Merchant name" },
        date: { type: "string", description: "Date YYYY-MM-DD" },
      },
      required: ["amount", "category", "description"],
    },
  },
  {
    name: "create_budget",
    description: "Create or update a budget. (WRITE TOOL: Produces a pending action requiring user confirmation).",
    parametersJsonSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Category name" },
        amount: { type: "number", description: "Budget amount in INR" },
        month: { type: "integer", description: "Month 1-12" },
        year: { type: "integer", description: "Year e.g. 2026" },
      },
      required: ["category", "amount", "month", "year"],
    },
  },
];

// ==========================================
// DETERMINISTIC TOOL HANDLERS
// ==========================================

const executeSpendingSummary = async (args, userId) => {
  const { from, to, groupBy } = args;
  const where = {
    account: { userId },
    type: "EXPENSE",
    ...(from || to
      ? {
          date: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }
      : {}),
  };

  const txs = await prisma.transaction.findMany({
    where,
    include: { category: true },
  });

  const totals = new Map();
  for (const t of txs) {
    let key = "Other";
    if (groupBy === "merchant") {
      key = t.merchant || t.description || "Unknown";
    } else if (groupBy === "month") {
      const d = new Date(t.date);
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    } else {
      key = t.category?.name || "Uncategorized";
    }

    const current = totals.get(key) || { group: key, total: 0, count: 0 };
    current.total += t.amount;
    current.count += 1;
    totals.set(key, current);
  }

  const results = Array.from(totals.values()).sort((a, b) => b.total - a.total);
  const grandTotal = results.reduce((acc, r) => acc + r.total, 0);

  return {
    groupBy,
    period: { from: from || "all", to: to || "all" },
    totalSpending: grandTotal,
    transactionCount: txs.length,
    groups: results.slice(0, 20),
  };
};

const executeSpendingForecast = async (args, userId) => {
  const { category, horizonDays = 30 } = args;
  const now = new Date();
  const past30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const where = {
    account: { userId },
    type: "EXPENSE",
    date: { gte: past30Days, lte: now },
    ...(category ? { category: { name: { equals: category, mode: "insensitive" } } } : {}),
  };

  const agg = await prisma.transaction.aggregate({
    where,
    _sum: { amount: true },
    _count: { id: true },
  });

  const totalSpent = agg._sum.amount || 0;
  const dailyAverage = totalSpent / 30;
  const projectedSpending = Math.round(dailyAverage * horizonDays);

  return {
    method: "historical_daily_average_run_rate",
    inputs: {
      category: category || "all_categories",
      horizonDays,
      historicalSampleDays: 30,
      historicalTotalSpent: Math.round(totalSpent),
      historicalCount: agg._count.id,
    },
    dailyAverage: Number(dailyAverage.toFixed(2)),
    projectedSpending,
    explanation: `Based on your recent 30-day spending of ₹${Math.round(totalSpent).toLocaleString("en-IN")}, your projected expense for the next ${horizonDays} days is ₹${projectedSpending.toLocaleString("en-IN")}.`,
  };
};

const executeSearchTaxKnowledge = async (args) => {
  // Plugged into Phase 8 RAG engine if present; otherwise graceful notice
  try {
    const taxRag = require("../services/taxRag.service");
    if (taxRag && typeof taxRag.searchTaxKnowledge === "function") {
      return await taxRag.searchTaxKnowledge(args.query);
    }
  } catch (err) {
    // Phase 8 not yet created
  }
  return {
    status: "empty",
    query: args.query,
    message: "India tax knowledge base is currently empty. Please refer to ingested documents.",
    chunks: [],
  };
};

// ==========================================
// MAIN TOOL-CALLING AGENT LOOP
// ==========================================

const SYSTEM_INSTRUCTION = `
You are CashFlow AI's Financial Copilot with real-time verified access to the user's financial database.

Critical Operating Guidelines:
1. Grounding: Answer ONLY from verified tool results. NEVER invent numbers, account balances, transaction records, or tax rules.
2. Incomplete Data: If data is missing or not returned by tools, clearly say "Data not found" or describe what is missing.
3. Write Safety: When the user asks to add a transaction or budget, call the appropriate write tool (add_transaction or create_budget). Note to the user that write operations require their manual confirmation before execution.
4. Professional Style: Keep responses concise, well-structured with bullet points and bold financial figures in INR (₹).
5. Tax Queries (RAG): When answering questions regarding Indian income tax, deductions, slabs, or compliance, call search_tax_knowledge. Answer strictly from retrieved chunk text. You MUST cite the title, sourceUrl, and financialYear of the chunks used. If sources are absent or the knowledge base is empty, say "Information not found in official tax sources". Always append: "Note: This information is for general educational purposes only and does not constitute professional tax advice."
`.trim();

/**
 * Runs the tool-calling agent loop.
 *
 * @param {object} params
 * @param {string} params.message - Current user prompt
 * @param {Array<object>} [params.conversationHistory] - Previous conversation turns
 * @param {string} params.userId - Authenticated user ID (injected server-side)
 * @returns {Promise<{ answer: string, steps: Array<object>, pendingActions: Array<object> }>}
 */
const runFinanceAgent = async ({ message, conversationHistory = [], userId }) => {
  if (!userId) {
    throw new Error("Authentication required: userId must be provided server-side.");
  }

  const startTime = Date.now();
  const steps = [];
  const pendingActions = [];
  let lastCallSignature = "";
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  // Build initial contents array
  const contents = [];
  if (Array.isArray(conversationHistory)) {
    for (const turn of conversationHistory.slice(-8)) {
      if (turn.role && turn.text) {
        contents.push({
          role: turn.role === "assistant" || turn.role === "model" ? "model" : "user",
          parts: [{ text: turn.text }],
        });
      }
    }
  }
  contents.push({
    role: "user",
    parts: [{ text: message }],
  });

  let finalAnswer = "";
  let iteration = 0;

  while (iteration < MAX_ITERATIONS) {
    iteration++;

    // Check overall timeout
    if (Date.now() - startTime > AGENT_TIMEOUT_MS) {
      finalAnswer = finalAnswer || "I reached the maximum allowable processing time for this financial inquiry. Here is the partial information retrieved above.";
      break;
    }

    // Call Gemini with tools configured via central wrapper (writes AiCallLog for each iteration)
    let geminiRes;
    try {
      geminiRes = await callGemini({
        agentName: "finance_agent",
        contents,
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
        userId,
      });
    } catch (err) {
      console.error(`[FinanceAgent] Gemini API error at iteration ${iteration}:`, err.message);
      finalAnswer = finalAnswer || `An error occurred while communicating with the AI service: ${err.message}`;
      break;
    }

    const response = geminiRes.raw;
    if (geminiRes.totalTokens) {
      totalPromptTokens += geminiRes.promptTokens || 0;
      totalCompletionTokens += geminiRes.completionTokens || 0;
    }

    const functionCalls = response?.functionCalls || [];

    // If no function calls returned, model produced final answer text
    if (!functionCalls || functionCalls.length === 0) {
      finalAnswer = response?.text || "I have analyzed your request based on available records.";
      break;
    }

    // Process function calls
    for (const call of functionCalls) {
      const toolName = call.name;
      const rawArgs = call.args || {};

      // Stop on repeated identical calls to avoid infinite loops
      const callSignature = `${toolName}:${JSON.stringify(rawArgs)}`;
      if (callSignature === lastCallSignature) {
        finalAnswer = response?.text || "Identified loop in tool queries. Returning verified data collected so far.";
        break;
      }
      lastCallSignature = callSignature;

      let toolResult;
      let summary = "";
      const toolStart = Date.now();

      try {
        // Validate arguments with Zod
        const schema = ToolArgSchemas[toolName];
        const validatedArgs = schema ? schema.parse(rawArgs) : rawArgs;

        switch (toolName) {
          case "run_sql": {
            toolResult = await executeHardenedSql(validatedArgs.query, userId);
            summary = `Executed SQL: retrieved ${Array.isArray(toolResult) ? toolResult.length : 0} rows`;
            break;
          }
          case "get_budgets": {
            const now = new Date();
            const month = validatedArgs.month || now.getMonth() + 1;
            const year = validatedArgs.year || now.getFullYear();
            const budgets = await getBudgets(userId, month, year);
            toolResult = budgets.slice(0, 15);
            summary = `Retrieved ${budgets.length} budgets for ${year}-${month}`;
            break;
          }
          case "get_spending_summary": {
            toolResult = await executeSpendingSummary(validatedArgs, userId);
            summary = `Spending summary: total ₹${toolResult.totalSpending.toLocaleString("en-IN")} across ${toolResult.groups.length} groups`;
            break;
          }
          case "forecast_spending": {
            toolResult = await executeSpendingForecast(validatedArgs, userId);
            summary = `Forecast: projected ₹${toolResult.projectedSpending.toLocaleString("en-IN")} for ${validatedArgs.horizonDays || 30} days`;
            break;
          }
          case "search_tax_knowledge": {
            toolResult = await executeSearchTaxKnowledge(validatedArgs);
            summary = `Tax search: ${toolResult.message || "Query processed"}`;
            break;
          }
          case "add_transaction": {
            // WRITE tool: Store PendingAiAction (10 min expiry)
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            const actionSummary = `Add ${validatedArgs.type} transaction of ₹${validatedArgs.amount} in ${validatedArgs.category} ("${validatedArgs.description}")`;

            const pending = await prisma.pendingAiAction.create({
              data: {
                userId,
                tool: "add_transaction",
                argsJson: JSON.stringify(validatedArgs),
                status: "PENDING",
                expiresAt,
              },
            });

            pendingActions.push({
              actionId: pending.id,
              tool: "add_transaction",
              summary: actionSummary,
              expiresAt: pending.expiresAt,
            });

            toolResult = {
              actionId: pending.id,
              status: "PENDING",
              summary: actionSummary,
              expiresAt: pending.expiresAt,
              message: "Action staged. Requires explicit user confirmation via POST /api/ai/agent/confirm before execution.",
            };
            summary = actionSummary;
            break;
          }
          case "create_budget": {
            // WRITE tool: Store PendingAiAction (10 min expiry)
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            const actionSummary = `Set ${validatedArgs.category} budget to ₹${validatedArgs.amount} for ${validatedArgs.year}-${validatedArgs.month}`;

            const pending = await prisma.pendingAiAction.create({
              data: {
                userId,
                tool: "create_budget",
                argsJson: JSON.stringify(validatedArgs),
                status: "PENDING",
                expiresAt,
              },
            });

            pendingActions.push({
              actionId: pending.id,
              tool: "create_budget",
              summary: actionSummary,
              expiresAt: pending.expiresAt,
            });

            toolResult = {
              actionId: pending.id,
              status: "PENDING",
              summary: actionSummary,
              expiresAt: pending.expiresAt,
              message: "Budget action staged. Requires explicit user confirmation via POST /api/ai/agent/confirm before execution.",
            };
            summary = actionSummary;
            break;
          }
          default: {
            toolResult = { error: `Unknown tool: ${toolName}` };
            summary = `Unknown tool ${toolName}`;
          }
        }
      } catch (err) {
        console.error(`[FinanceAgent] Tool execution error (${toolName}):`, err.message);
        toolResult = { error: err.message };
        summary = `Error: ${err.message}`;
      }

      const toolLatency = Date.now() - toolStart;
      steps.push({
        tool: toolName,
        args: rawArgs,
        summary,
        latencyMs: toolLatency,
      });

      // Append model call and tool response to conversation turns
      contents.push({
        role: "model",
        parts: [{ functionCall: { name: toolName, args: rawArgs } }],
      });
      contents.push({
        role: "user",
        parts: [{ functionResponse: { name: toolName, response: { output: toolResult } } }],
      });
    }
  }

  const overallLatency = Date.now() - startTime;

  return {
    answer: finalAnswer || "Completed processing your financial request.",
    steps,
    pendingActions,
  };
};

// ==========================================
// CONFIRMATION HANDLER (POST /api/ai/agent/confirm)
// ==========================================

const confirmPendingAction = async ({ actionId, cancel = false, userId }) => {
  if (!actionId || !userId) {
    throw new Error("actionId and userId are required");
  }

  const action = await prisma.pendingAiAction.findFirst({
    where: { id: actionId, userId },
  });

  if (!action) {
    const error = new Error("Pending action not found or belongs to another user.");
    error.statusCode = 404;
    throw error;
  }

  if (action.status !== "PENDING") {
    const error = new Error(`Action has already been processed with status: ${action.status}`);
    error.statusCode = 400;
    throw error;
  }

  if (new Date() > action.expiresAt) {
    await prisma.pendingAiAction.update({
      where: { id: actionId },
      data: { status: "EXPIRED" },
    });
    const error = new Error("Action has expired (10-minute limit exceeded). Please re-request through the agent.");
    error.statusCode = 400;
    throw error;
  }

  if (cancel) {
    const updated = await prisma.pendingAiAction.update({
      where: { id: actionId },
      data: { status: "CANCELLED" },
    });
    return {
      success: true,
      status: "CANCELLED",
      message: "Action was cancelled by user.",
    };
  }

  // Execute confirmed action idempotently
  const args = JSON.parse(action.argsJson);
  let result;

  if (action.tool === "add_transaction") {
    const { createTransaction } = require("../../transaction/transaction.service");
    const { nameToId } = await getCategoryMap();
    const categoryId = resolveCategoryId(args.category, nameToId);

    // Find default account for user
    const account = await prisma.account.findFirst({
      where: { userId },
    });
    if (!account) {
      throw new Error("No active bank account found to record transaction against.");
    }

    result = await createTransaction(
      {
        accountId: account.id,
        categoryId,
        amount: args.amount,
        type: args.type || "EXPENSE",
        description: args.description,
        merchant: args.merchant || args.description,
        date: args.date || new Date().toISOString(),
      },
      userId
    );
  } else if (action.tool === "create_budget") {
    const { createBudget } = require("../../budget/budget.service");
    const { nameToId } = await getCategoryMap();
    const categoryId = resolveCategoryId(args.category, nameToId);

    result = await createBudget(
      {
        categoryId,
        amount: args.amount,
        month: args.month,
        year: args.year,
      },
      userId
    );
  } else {
    throw new Error(`Unsupported pending action tool: ${action.tool}`);
  }

  // Update status to CONFIRMED
  await prisma.pendingAiAction.update({
    where: { id: actionId },
    data: { status: "CONFIRMED" },
  });

  return {
    success: true,
    status: "CONFIRMED",
    message: "Action confirmed and executed successfully.",
    result,
  };
};

module.exports = {
  runFinanceAgent,
  confirmPendingAction,
  FUNCTION_DECLARATIONS,
  ToolArgSchemas,
};
