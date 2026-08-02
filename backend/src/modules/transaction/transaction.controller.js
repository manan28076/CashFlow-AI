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
  update,
  remove,
};