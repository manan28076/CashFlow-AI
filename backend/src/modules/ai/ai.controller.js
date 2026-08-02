const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/apiResponse");
const { parseCSV } = require("./parsers/statement.parser");
const { testAI, askQuestion, chatWithAgent } = require("./ai.service");
const {
  testAISchema,
  uploadStatementSchema,
  askSchema,
  chatSchema,
} = require("./ai.validator");
const { resolveCategoryId } = require("./utils/categoryMap");
const {
  createManyFromStatement,
} = require("../transaction/transaction.service");

const test = asyncHandler(async (req, res) => {
  const validatedData = testAISchema.parse(req.body);
  const response = await testAI(validatedData.transactions);

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
  const result = await testAI(transactions);

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

module.exports = {
  test,
  uploadStatement,
  ask,
  chat,
};