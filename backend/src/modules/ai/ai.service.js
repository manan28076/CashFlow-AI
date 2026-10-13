const { runAI } = require("./orchestrator");
const { sqlAgent } = require("./agents/sql.agent");
const { routerAgent } = require("./agents/router.agent");
const { answerAgent } = require("./agents/answer.agent");
const { unifiedAgent } = require("./agents/unified.agent");
const { askGemini } = require("./services/gemini.service");
const prisma = require("../../lib/prisma");

const testAI = async (transactions) => {
  return runAI(transactions);
};

const askQuestion = async (question, userId) => {
  const sql = await sqlAgent(question, userId);
  const rows = await prisma.$queryRawUnsafe(sql);

  return { question, sql, rows };
};

const GREETINGS_REGEX = /^(hi|hello|hey|namaste|hola|good\s*(morning|afternoon|evening)|howdy|sup|yo)[.!?\s]*$/i;
const HELP_REGEX = /^(who\s+are\s+you|what\s+can\s+you\s+do|help|what\s+is\s+this|how\s+to\s+use)[.!?\s]*$/i;

const chatWithAgent = async (message, userId) => {
  const cleanMsg = (message || "").trim();

  // Fast path 1: Instant local greeting response (0 ms, 0 API latency)
  if (GREETINGS_REGEX.test(cleanMsg)) {
    return {
      intent: "GENERAL_ADVICE",
      answer: "Hello! I am your CashFlow AI Financial Copilot.\n\nI have real-time verified access to your database to analyze spending, verify budgets, and flag trends. Try asking:\n• \"How much did I spend this month?\"\n• \"What is my biggest expense category?\"\n• \"Do I have any unusual or high expenses?\"\n• \"Give me 3 practical ways to save more money\"",
    };
  }

  // Fast path 2: Instant help / capabilities response (0 ms, 0 API latency)
  if (HELP_REGEX.test(cleanMsg)) {
    return {
      intent: "GENERAL_ADVICE",
      answer: "I am your personal AI Financial Copilot connected directly to your transactions, accounts, and budgets.\n\nYou can ask me:\n1. **Spending & Totals**: \"What did I spend in the last 30 days?\"\n2. **Category Breakdowns**: \"Which category has the highest expense?\"\n3. **Specific Merchants**: \"How much have I spent on Swiggy or Zomato?\"\n4. **Financial Tips**: \"How should I plan my monthly budget?\"\n\nAsk me anything about your finances!",
    };
  }

  // Fast path 3: Single-pass Unified Agent (merges Intent Routing + SQL Generation into 1 call)
  const unified = await unifiedAgent(message, userId);

  if (unified.intent === "DATA_QUERY" && unified.sql) {
    try {
      const rows = await prisma.$queryRawUnsafe(unified.sql);

      // If query returned 0 rows, return immediate zero-wait explanation
      if (!rows || rows.length === 0) {
        return {
          intent: "DATA_QUERY",
          sql: unified.sql,
          rows: [],
          answer: "I searched your transaction records for this query and found no matching records in your account.",
        };
      }

      // Synthesize concise answer from verified rows
      const answer = await answerAgent(message, rows);
      return {
        intent: "DATA_QUERY",
        sql: unified.sql,
        rows,
        answer: answer || "Based on your records, here are the results above.",
      };
    } catch (sqlErr) {
      console.warn("SQL execution error in chatWithAgent:", sqlErr.message);
      // Fallback to advice if raw query fails
      return {
        intent: "GENERAL_ADVICE",
        answer: "I attempted to query your database for that specific metric, but could not compile the exact figure. Please try asking e.g. 'What is my total expense this month?'",
      };
    }
  }

  return {
    intent: "GENERAL_ADVICE",
    answer: unified.answer || "Here is practical advice for managing your cash flow effectively: track every expense regularly, automate savings first, and review high spending categories each month.",
  };
};

module.exports = {
  testAI,
  askQuestion,
  chatWithAgent,
};