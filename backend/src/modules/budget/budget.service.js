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
  const explicitBudgets = await prisma.budget.findMany({
    where: { userId },
    include: { category: true },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  if (explicitBudgets.length === 0) {
    return [];
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Group configured categories and their budgets
  const catMap = new Map();
  for (const b of explicitBudgets) {
    if (!catMap.has(b.categoryId)) {
      catMap.set(b.categoryId, {
        latestAmount: b.amount,
        category: b.category,
        months: new Map(),
      });
    }
    catMap.get(b.categoryId).months.set(`${b.year}-${b.month}`, b);
  }

  const allBudgets = [];

  for (const [catId, { latestAmount, category, months }] of catMap.entries()) {
    // Find all months with expense transactions for this category
    const txs = await prisma.transaction.findMany({
      where: {
        categoryId: catId,
        type: "EXPENSE",
        account: { userId },
      },
      select: { date: true },
    });

    const monthKeys = new Set([
      ...months.keys(),
      `${currentYear}-${currentMonth}`,
    ]);

    for (const t of txs) {
      const tY = t.date.getFullYear();
      const tM = t.date.getMonth() + 1;
      monthKeys.add(`${tY}-${tM}`);
    }

    for (const key of monthKeys) {
      const [kYear, kMonth] = key.split("-").map(Number);

      if (month && Number(month) !== kMonth) continue;
      if (year && Number(year) !== kYear) continue;

      if (months.has(key)) {
        allBudgets.push(months.get(key));
      } else {
        // Carry forward the latest limit configured for this category
        allBudgets.push({
          id: `rec_${catId}_${kYear}_${kMonth}`,
          amount: latestAmount,
          month: kMonth,
          year: kYear,
          userId,
          categoryId: catId,
          category,
          isRecurring: true,
        });
      }
    }
  }

  const withProgress = await Promise.all(allBudgets.map(attachProgress));

  return withProgress.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
};

const updateBudget = async (id, data, userId) => {
  if (id.startsWith("rec_")) {
    const { categoryId, amount, month, year } = data;
    const upserted = await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId,
          month: Number(month),
          year: Number(year),
        },
      },
      update: { amount },
      create: {
        userId,
        categoryId,
        amount,
        month: Number(month),
        year: Number(year),
      },
      include: { category: true },
    });
    return attachProgress(upserted);
  }

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
  if (id.startsWith("rec_")) {
    return;
  }

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