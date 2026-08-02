const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/apiResponse");

const { createCategorySchema } = require("./category.validator");
const {
  createCategory,
  getCategories,
  deleteCategory,
} = require("./category.service");

const create = asyncHandler(async (req, res) => {
  const validatedData = createCategorySchema.parse(req.body);
  const category = await createCategory(validatedData);

  return res.status(201).json(
    new ApiResponse(201, "Category created successfully", category)
  );
});

const getAll = asyncHandler(async (req, res) => {
  const categories = await getCategories();

  return res.status(200).json(
    new ApiResponse(200, "Categories fetched successfully", categories)
  );
});

const remove = asyncHandler(async (req, res) => {
  await deleteCategory(req.params.id);

  return res.status(200).json(
    new ApiResponse(200, "Category deleted successfully", null)
  );
});

module.exports = {
  create,
  getAll,
  remove,
};