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

  const where = {
    type: "EXPENSE",
    account: { userId: budget.userId },
    date: { gte: start, lt: end },
    categoryId: budget.categoryId,
  };

  const result = await prisma.transaction.aggregate({
    where,
    _sum: { amount: true },
  });

  const spent = result._sum.amount || 0;
  const percentUsed =
    budget.amount > 0
      ? (spent / budget.amount) * 100
      : spent > 0
      ? 100
      : 0;

  return {
    ...budget,
    spent,
    remaining: budget.amount - spent,
    percentUsed,
    isUnset: budget.amount === 0,
  };
};

const getBudgets = async (userId, month, year) => {
  const explicitBudgets = await prisma.budget.findMany({
    where: { userId },
    include: { category: true },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  const categories = await prisma.category.findMany({
    where: { name: { notIn: ["Salary", "Freelance", "Overall"] } },
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Group configured categories and their budgets
  const catConfigMap = new Map();
  for (const b of explicitBudgets) {
    if (!catConfigMap.has(b.categoryId)) {
      catConfigMap.set(b.categoryId, {
        latestAmount: b.amount,
        category: b.category,
        months: new Map(),
      });
    }
    catConfigMap.get(b.categoryId).months.set(`${b.year}-${b.month}`, b);
  }

  // Find all distinct months where expense transactions exist for this user
  const allTxs = await prisma.transaction.findMany({
    where: {
      account: { userId },
      type: "EXPENSE",
    },
    select: { date: true },
  });

  const monthKeys = new Set([`${currentYear}-${currentMonth}`]);
  for (const b of explicitBudgets) {
    monthKeys.add(`${b.year}-${b.month}`);
  }
  for (const t of allTxs) {
    monthKeys.add(`${t.date.getFullYear()}-${t.date.getMonth() + 1}`);
  }

  const allBudgets = [];

  // Process category budgets (Food, Shopping, Travel, Bills, etc.)
  for (const cat of categories) {
    const config = catConfigMap.get(cat.id);

    for (const key of monthKeys) {
      const [kYear, kMonth] = key.split("-").map(Number);

      if (month && Number(month) !== kMonth) continue;
      if (year && Number(year) !== kYear) continue;

      if (config && config.months.has(key)) {
        allBudgets.push(config.months.get(key));
      } else if (config) {
        // Carry forward the latest limit configured for this category
        allBudgets.push({
          id: `rec_${cat.id}_${kYear}_${kMonth}`,
          amount: config.latestAmount,
          month: kMonth,
          year: kYear,
          userId,
          categoryId: cat.id,
          category: cat,
          isRecurring: true,
        });
      } else {
        // Category with no limit set yet (amount 0)
        allBudgets.push({
          id: `unset_${cat.id}_${kYear}_${kMonth}`,
          amount: 0,
          month: kMonth,
          year: kYear,
          userId,
          categoryId: cat.id,
          category: cat,
          isUnset: true,
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
  if (id.startsWith("rec_") || id.startsWith("unset_")) {
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
      update: { amount: Number(amount) },
      create: {
        userId,
        categoryId,
        amount: Number(amount),
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
  if (id.startsWith("rec_") || id.startsWith("unset_")) {
    const parts = id.split("_");
    if (parts.length >= 4) {
      const categoryId = parts[1];
      const year = Number(parts[2]);
      const month = Number(parts[3]);
      await prisma.budget.deleteMany({
        where: { userId, categoryId, month, year },
      });
    }
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

// -------------------------------------------------------------
// Dedicated Month Overall Budget Service
// -------------------------------------------------------------

const getMonthlyBudgets = async (userId, month, year) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Fetch all explicit MonthlyBudget records for this user
  const explicitMonthlyBudgets = await prisma.monthlyBudget.findMany({
    where: { userId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  const mbMap = new Map();
  for (const mb of explicitMonthlyBudgets) {
    mbMap.set(`${mb.year}-${mb.month}`, mb);
  }

  // Find all distinct months where expenses exist
  const allTxs = await prisma.transaction.findMany({
    where: {
      account: { userId },
      type: "EXPENSE",
    },
    select: { date: true },
  });

  const monthKeys = new Set([`${currentYear}-${currentMonth}`]);
  for (const mb of explicitMonthlyBudgets) {
    monthKeys.add(`${mb.year}-${mb.month}`);
  }
  for (const t of allTxs) {
    monthKeys.add(`${t.date.getFullYear()}-${t.date.getMonth() + 1}`);
  }

  const results = [];

  for (const key of monthKeys) {
    const [kYear, kMonth] = key.split("-").map(Number);

    if (month && Number(month) !== kMonth) continue;
    if (year && Number(year) !== kYear) continue;

    const start = new Date(kYear, kMonth - 1, 1);
    const end = new Date(kYear, kMonth, 1);

    const txSum = await prisma.transaction.aggregate({
      where: {
        type: "EXPENSE",
        account: { userId },
        date: { gte: start, lt: end },
      },
      _sum: { amount: true },
    });

    const spent = txSum._sum.amount || 0;
    const mb = mbMap.get(key);
    const amount = mb ? mb.amount : 0;
    const isSet = Boolean(mb && mb.amount > 0);
    const remaining = amount - spent;
    const percentUsed = amount > 0 ? (spent / amount) * 100 : spent > 0 ? 100 : 0;

    results.push({
      id: mb ? mb.id : `mb_${kYear}_${kMonth}`,
      month: kMonth,
      year: kYear,
      amount,
      spent,
      remaining,
      percentUsed,
      isSet,
    });
  }

  return results.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
};

const setMonthlyBudget = async (userId, data) => {
  const { amount, month, year, repeatMonths = 1 } = data;
  const numAmount = Number(amount);
  const startM = Number(month);
  const startY = Number(year);

  if (isNaN(numAmount) || numAmount < 0) {
    throw new AppError("Amount must be a valid positive number", 400);
  }
  if (!startM || startM < 1 || startM > 12) {
    throw new AppError("Invalid month", 400);
  }
  if (!startY || startY < 2000) {
    throw new AppError("Invalid year", 400);
  }

  const count = Math.max(1, Number(repeatMonths) || 1);
  let lastSaved = null;

  for (let i = 0; i < count; i++) {
    let curM = startM + i;
    let curY = startY;
    while (curM > 12) {
      curM -= 12;
      curY += 1;
    }

    lastSaved = await prisma.monthlyBudget.upsert({
      where: {
        userId_month_year: { userId, month: curM, year: curY },
      },
      update: { amount: numAmount },
      create: { userId, amount: numAmount, month: curM, year: curY },
    });
  }

  const [refreshed] = await getMonthlyBudgets(userId, startM, startY);
  return refreshed || lastSaved;
};

const deleteMonthlyBudget = async (userId, data) => {
  const { month, year } = data;
  if (!month || !year) {
    throw new AppError("Month and year are required", 400);
  }

  await prisma.monthlyBudget.deleteMany({
    where: {
      userId,
      month: Number(month),
      year: Number(year),
    },
  });
};

module.exports = {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
  getMonthlyBudgets,
  setMonthlyBudget,
  deleteMonthlyBudget,
};