const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/apiResponse");

const { createBudgetSchema } = require("./budget.validator");
const {
  createBudget,
  getBudgets,
} = require("./budget.service");

const create = asyncHandler(async (req, res) => {
  const validatedData = createBudgetSchema.parse(req.body);

  const budget = await createBudget(
    validatedData,
    req.user.id
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      "Budget created successfully",
      budget
    )
  );
});

const getAll = asyncHandler(async (req, res) => {
  const budgets = await getBudgets(req.user.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      "Budgets fetched successfully",
      budgets
    )
  );
});

module.exports = {
  create,
  getAll,
};