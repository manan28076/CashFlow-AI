const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/apiResponse");

const { createAccountSchema } = require("./account.validator");
const {
  createAccount,
  getAccounts,
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

module.exports = {
  create,
  getAll,
};