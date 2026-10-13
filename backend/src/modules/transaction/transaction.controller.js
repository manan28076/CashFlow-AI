const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/apiResponse");

const {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
} = require("./transaction.validator");
const {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getDuplicateTransactions,
  resolveDuplicateTransactions,
} = require("./transaction.service");

const create = asyncHandler(async (req, res) => {
  const validatedData = createTransactionSchema.parse(req.body);
  const transaction = await createTransaction(validatedData, req.user.id);

  return res.status(201).json(
    new ApiResponse(201, "Transaction created successfully", transaction)
  );
});

const getAll = asyncHandler(async (req, res) => {
  const validatedQuery = transactionQuerySchema.parse(req.query);
  const result = await getTransactions(req.user.id, validatedQuery);

  return res.status(200).json(
    new ApiResponse(200, "Transactions fetched successfully", result)
  );
});

const getDuplicates = asyncHandler(async (req, res) => {
  const duplicates = await getDuplicateTransactions(req.user.id);

  return res.status(200).json(
    new ApiResponse(200, "Duplicate transactions scanned successfully", duplicates)
  );
});

const resolveDuplicates = asyncHandler(async (req, res) => {
  const { action = "clean_all", idsToDelete } = req.body || {};
  const result = await resolveDuplicateTransactions(req.user.id, {
    action,
    idsToDelete,
  });

  return res.status(200).json(
    new ApiResponse(200, result.message, result)
  );
});

const update = asyncHandler(async (req, res) => {
  const validatedData = updateTransactionSchema.parse(req.body);
  const transaction = await updateTransaction(
    req.params.id,
    validatedData,
    req.user.id
  );

  return res.status(200).json(
    new ApiResponse(200, "Transaction updated successfully", transaction)
  );
});

const remove = asyncHandler(async (req, res) => {
  await deleteTransaction(req.params.id, req.user.id);

  return res.status(200).json(
    new ApiResponse(200, "Transaction deleted successfully", null)
  );
});

module.exports = {
  create,
  getAll,
  getDuplicates,
  resolveDuplicates,
  update,
  remove,
};