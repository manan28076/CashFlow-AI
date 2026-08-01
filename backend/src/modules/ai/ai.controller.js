const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/apiResponse");
const { parseCSV } = require("./parsers/statement.parser");
const { testAI } = require("./ai.service");
const { testAISchema } = require("./ai.validator");
const test = asyncHandler(async (req, res) => {
const validatedData = testAISchema.parse(req.body);

const response = await testAI(validatedData.transactions);

  return res.status(200).json(
    new ApiResponse(
      200,
      "AI response generated successfully",
      response
    )
  );
});
const uploadStatement = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json(
      new ApiResponse(400, "CSV file is required")
    );
  }

  const transactions = await parseCSV(req.file.buffer);

  const response = await testAI(transactions);

  return res.status(200).json(
    new ApiResponse(
      200,
      "Statement analyzed successfully",
      response
    )
  );
});

module.exports = {
  test,
  uploadStatement,
};