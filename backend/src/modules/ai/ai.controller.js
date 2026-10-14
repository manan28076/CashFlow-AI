const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/apiResponse");
const { parseCSV } = require("./parsers/statement.parser");
const { testAI, askQuestion, chatWithAgent, getAIMetrics, handleAgentQuery, handleConfirmAgentAction } = require("./ai.service");
const {
  testAISchema,
  uploadStatementSchema,
  askSchema,
  chatSchema,
  metricsQuerySchema,
  agentQuerySchema,
  confirmAgentActionSchema,
} = require("./ai.validator");
const { resolveCategoryId } = require("./utils/categoryMap");
const {
  createManyFromStatement,
} = require("../transaction/transaction.service");

const test = asyncHandler(async (req, res) => {
  const validatedData = testAISchema.parse(req.body);
  const response = await testAI(validatedData.transactions, req.user?.id);

  return res.status(200).json(
    new ApiResponse(200, "AI response generated successfully", response)
  );
});

const uploadStatement = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json(new ApiResponse(400, "CSV file is required"));
  }

  const { accountId } = uploadStatementSchema.parse(req.body);
  const transactions = await parseCSV(req.file.buffer);
  const result = await testAI(transactions, req.user?.id);

  const { indexed, categories, fraud, nameToId } = result;

  const flaggedIds = new Set(fraud?.flaggedIds || []);
  const categoryById = new Map(
    (categories || []).map((c) => [c.id, c.category])
  );

  const rows = indexed.map((t) => ({
    ...t,
    categoryId: resolveCategoryId(categoryById.get(t.id), nameToId),
    isAnomaly: flaggedIds.has(t.id),
  }));

   const savedResult = await createManyFromStatement(
    rows,
    accountId,
    req.user.id
  );

  return res.status(200).json(
    new ApiResponse(200, "Statement analyzed and saved successfully", {
      transactions: savedResult.transactions,
      insights: result.insights,
      budget: result.budget,
      fraud: result.fraud,
      health: result.health,
      categorizedFromMemory: result.categorizedFromMemory ?? 0,
      categorizedByLlm: result.categorizedByLlm ?? 0,
    })
  );
});

const ask = asyncHandler(async (req, res) => {
  const { question } = askSchema.parse(req.body);
  const result = await askQuestion(question, req.user.id);

  return res.status(200).json(
    new ApiResponse(200, "Query answered successfully", result)
  );
});

const chat = asyncHandler(async (req, res) => {
  const { message } = chatSchema.parse(req.body);
  const result = await chatWithAgent(message, req.user.id);

  return res.status(200).json(
    new ApiResponse(200, "Chat response generated successfully", result)
  );
});

const { parseQuickAddPrompt } = require("./agents/quickadd.agent");
const prisma = require("../../lib/prisma");

const parseQuickAdd = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json(new ApiResponse(400, "Text input is required"));
  }

  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  const categoryNames = categories.map((c) => c.name);

  const parsed = await parseQuickAddPrompt(text.trim(), categoryNames, req.user?.id);
  if (!parsed || !parsed.amount) {
    return res.status(400).json(new ApiResponse(400, "Could not understand the transaction details. Try typing e.g. 'zomato 350'"));
  }

  const catObj = categories.find((c) => c.name.toLowerCase() === (parsed.category || "").toLowerCase()) || categories[0];

  return res.status(200).json(
    new ApiResponse(200, "Transaction parsed successfully", {
      ...parsed,
      categoryId: catObj ? catObj.id : null,
      categoryName: catObj ? catObj.name : "Other",
    })
  );
});

const liveAudit = asyncHandler(async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    where: {
      account: {
        userId: req.user.id,
      },
    },
    include: {
      category: true,
      account: true,
    },
    orderBy: {
      date: "desc",
    },
    take: 50,
  });

  if (!transactions || transactions.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, "No transactions found to audit", null)
    );
  }

  const mappedTransactions = transactions.map((t, idx) => ({
    id: idx,
    merchant: t.merchant || t.description,
    amount: t.amount,
    date: t.date ? t.date.toISOString().split("T")[0] : undefined,
    category: t.category?.name || "Other",
    type: t.type,
  }));

  const result = await testAI(mappedTransactions, req.user?.id);

  return res.status(200).json(
    new ApiResponse(200, "Live audit generated successfully", {
      transactionCount: transactions.length,
      insights: result.insights,
      budget: result.budget,
      fraud: result.fraud,
      health: result.health,
    })
  );
});

const getMetrics = asyncHandler(async (req, res) => {
  const { days } = metricsQuerySchema.parse(req.query);
  const metrics = await getAIMetrics(req.user.id, { days });

  return res.status(200).json(
    new ApiResponse(200, "AI call metrics retrieved successfully", metrics)
  );
});

const agent = asyncHandler(async (req, res) => {
  const { message, conversationHistory } = agentQuerySchema.parse(req.body);
  const result = await handleAgentQuery({
    message,
    conversationHistory,
    userId: req.user.id,
  });

  return res.status(200).json(
    new ApiResponse(200, "Agent query executed successfully", result)
  );
});

const confirmAction = asyncHandler(async (req, res) => {
  const { actionId, cancel } = confirmAgentActionSchema.parse(req.body);
  const result = await handleConfirmAgentAction({
    actionId,
    cancel,
    userId: req.user.id,
  });

  return res.status(200).json(
    new ApiResponse(200, "Agent action processed successfully", result)
  );
});

module.exports = {
  test,
  uploadStatement,
  ask,
  chat,
  parseQuickAdd,
  liveAudit,
  getMetrics,
  agent,
  confirmAction,
};