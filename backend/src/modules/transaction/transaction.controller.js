const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/apiResponse");

const { createTransactionSchema } = require("./transaction.validator");
const {
  createTransaction,
  getTransactions,
} = require("./transaction.service");

const create = asyncHandler(async (req, res) => {
  const validatedData = createTransactionSchema.parse(req.body);

  const transaction = await createTransaction(
    validatedData,
    req.user.id
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      "Transaction created successfully",
      transaction
    )
  );
});

const getAll = asyncHandler(async (req, res) => {
  const transactions = await getTransactions(req.user.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      "Transactions fetched successfully",
      transactions
    )
  );
});

module.exports = {
  create,
  getAll,
};