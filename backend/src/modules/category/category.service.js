const prisma = require("../../lib/prisma");
const AppError = require("../../errors/AppError");

const createCategory = async ({ name, type = "EXPENSE" }) => {
  const existing = await prisma.category.findUnique({
    where: { name },
  });

  if (existing) {
    throw new AppError("Category already exists", 409);
  }

  const category = await prisma.category.create({
    data: { name, type },
  });

  return category;
};

const getCategories = async () => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return categories;
};

const deleteCategory = async (id) => {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  await prisma.category.delete({ where: { id } });
};

module.exports = {
  createCategory,
  getCategories,
  deleteCategory,
};