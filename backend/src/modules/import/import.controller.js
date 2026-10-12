const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/apiResponse");
const AppError = require("../../errors/AppError");
const { parseStatementFile, confirmImport } = require("./import.service");

const uploadStatement = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("No file uploaded. Please upload a PDF, CSV, or Excel file.", 400);
  }

  const { accountId } = req.body;
  const result = await parseStatementFile(req.file, req.user.id, accountId);

  return res.status(200).json(
    new ApiResponse(200, "Statement parsed successfully", result)
  );
});

const confirmStatementImport = asyncHandler(async (req, res) => {
  const { transactions, accountId } = req.body;
  if (!accountId) {
    throw new AppError("accountId is required to import transactions.", 400);
  }
  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    throw new AppError("No transactions provided for confirmation.", 400);
  }

  const result = await confirmImport(transactions, accountId, req.user.id);

  return res.status(200).json(
    new ApiResponse(200, `Successfully imported ${result.importedCount} transactions`, result)
  );
});

module.exports = {
  uploadStatement,
  confirmStatementImport,
};
