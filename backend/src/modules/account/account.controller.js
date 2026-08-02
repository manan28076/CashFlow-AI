const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/apiResponse");

const { createAccountSchema, updateAccountSchema } = require("./account.validator");
const {
  createAccount,
  getAccounts,
  updateAccount,
  deleteAccount,
} = require("./account.service");

const create = asyncHandler(async (req, res) => {
  const validatedData = createAccountSchema.parse(req.body);
  const account = await createAccount(validatedData, req.user.id);

  return res.status(201).json(
    new ApiResponse(201, "Account created successfully", account)
  );
});

const getAll = asyncHandler(async (req, res) => {
  const accounts = await getAccounts(req.user.id);

  return res.status(200).json(
    new ApiResponse(200, "Accounts fetched successfully", accounts)
  );
});

const update = asyncHandler(async (req, res) => {
  const validatedData = updateAccountSchema.parse(req.body);
  const account = await updateAccount(req.params.id, validatedData, req.user.id);

  return res.status(200).json(
    new ApiResponse(200, "Account updated successfully", account)
  );
});

const remove = asyncHandler(async (req, res) => {
  await deleteAccount(req.params.id, req.user.id);

  return res.status(200).json(
    new ApiResponse(200, "Account deleted successfully", null)
  );
});

module.exports = {
  create,
  getAll,
  update,
  remove,
};