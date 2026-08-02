const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/apiResponse");

const { createBudgetSchema, updateBudgetSchema } = require("./budget.validator");
const {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
} = require("./budget.service");

const create = asyncHandler(async (req, res) => {
  const validatedData = createBudgetSchema.parse(req.body);
  const budget = await createBudget(validatedData, req.user.id);

  return res.status(201).json(
    new ApiResponse(201, "Budget created successfully", budget)
  );
});

const getAll = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const budgets = await getBudgets(req.user.id, month, year);

  return res.status(200).json(
    new ApiResponse(200, "Budgets fetched successfully", budgets)
  );
});

const update = asyncHandler(async (req, res) => {
  const validatedData = updateBudgetSchema.parse(req.body);
  const budget = await updateBudget(req.params.id, validatedData, req.user.id);

  return res.status(200).json(
    new ApiResponse(200, "Budget updated successfully", budget)
  );
});

const remove = asyncHandler(async (req, res) => {
  await deleteBudget(req.params.id, req.user.id);

  return res.status(200).json(
    new ApiResponse(200, "Budget deleted successfully", null)
  );
});

module.exports = {
  create,
  getAll,
  update,
  remove,
};