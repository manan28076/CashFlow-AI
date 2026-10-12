const prisma = require("../../lib/prisma");
const AppError = require("../../errors/AppError");

const createBudget = async (data, userId) => {
  const { categoryId, amount, month, year } = data;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const existingBudget = await prisma.budget.findUnique({
    where: {
      userId_categoryId_month_year: { userId, categoryId, month, year },
    },
  });

  if (existingBudget) {
    const updated = await prisma.budget.update({
      where: { id: existingBudget.id },
      data: { amount },
      include: { category: true },
    });
    return attachProgress(updated);
  }

  const budget = await prisma.budget.create({
    data: { userId, categoryId, amount, month, year },
    include: { category: true },
  });

  return attachProgress(budget);
};

const attachProgress = async (budget) => {
  const start = new Date(budget.year, budget.month - 1, 1);
  const end = new Date(budget.year, budget.month, 1);

  const result = await prisma.transaction.aggregate({
    where: {
      categoryId: budget.categoryId,
      type: "EXPENSE",
      account: { userId: budget.userId },
      date: { gte: start, lt: end },
    },
    _sum: { amount: true },
  });

  const spent = result._sum.amount || 0;
  const percentUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

  return {
    ...budget,
    spent,
    remaining: budget.amount - spent,
    percentUsed,
  };
};

const getBudgets = async (userId, month, year) => {
  const budgets = await prisma.budget.findMany({
    where: {
      userId,
      ...(month && { month: Number(month) }),
      ...(year && { year: Number(year) }),
    },
    include: { category: true },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return Promise.all(budgets.map(attachProgress));
};

const updateBudget = async (id, data, userId) => {
  const budget = await prisma.budget.findFirst({
    where: { id, userId },
  });

  if (!budget) {
    throw new AppError("Budget not found", 404);
  }

  const updated = await prisma.budget.update({
    where: { id },
    data,
    include: { category: true },
  });

  return attachProgress(updated);
};

const deleteBudget = async (id, userId) => {
  const budget = await prisma.budget.findFirst({
    where: { id, userId },
  });

  if (!budget) {
    throw new AppError("Budget not found", 404);
  }

  await prisma.budget.delete({ where: { id } });
};

module.exports = {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
};