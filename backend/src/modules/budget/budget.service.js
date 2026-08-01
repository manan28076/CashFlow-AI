const prisma = require("../../lib/prisma");
const AppError = require("../../errors/AppError");

const createBudget = async (data, userId) => {
  const { categoryId, amount, month, year } = data;

  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const existingBudget = await prisma.budget.findUnique({
    where: {
      userId_categoryId_month_year: {
        userId,
        categoryId,
        month,
        year,
      },
    },
  });

  if (existingBudget) {
    throw new AppError("Budget already exists for this month", 409);
  }

  const budget = await prisma.budget.create({
    data: {
      userId,
      categoryId,
      amount,
      month,
      year,
    },
  });

  return budget;
};

const getBudgets = async (userId) => {
  return await prisma.budget.findMany({
    where: {
      userId,
    },
    include: {
      category: true,
    },
    orderBy: [
      {
        year: "desc",
      },
      {
        month: "desc",
      },
    ],
  });
};

module.exports = {
  createBudget,
  getBudgets,
};