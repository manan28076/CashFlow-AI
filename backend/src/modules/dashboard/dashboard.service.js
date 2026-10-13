const prisma = require("../../lib/prisma");

const getSummary = async (userId) => {
  const accountIds = await prisma.account.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  const ids = accountIds.map((account) => account.id);

  const totalIncome = await prisma.transaction.aggregate({
    where: {
      accountId: {
        in: ids,
      },
      type: "INCOME",
    },
    _sum: {
      amount: true,
    },
  });

  const totalExpense = await prisma.transaction.aggregate({
    where: {
      accountId: {
        in: ids,
      },
      type: "EXPENSE",
    },
    _sum: {
      amount: true,
    },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const currentMonthExpense = await prisma.transaction.aggregate({
    where: {
      accountId: {
        in: ids,
      },
      type: "EXPENSE",
      date: {
        gte: monthStart,
        lt: monthEnd,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const income = totalIncome._sum.amount || 0;
  const expense = totalExpense._sum.amount || 0;
  const currentMonthSpending = currentMonthExpense._sum.amount || 0;

  return {
    totalBalance: income - expense,
    totalIncome: income,
    totalExpense: expense,
    currentMonthSpending,
  };
};
const getCategoryBreakdown = async (userId, month, year) => {
  const accounts = await prisma.account.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  const accountIds = accounts.map((account) => account.id);

  // Discover all months with expense transactions for this user
  const allExpenseTxs = await prisma.transaction.findMany({
    where: {
      accountId: { in: accountIds },
      type: "EXPENSE",
    },
    select: { date: true },
    orderBy: { date: "desc" },
  });

  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();

  const monthMap = new Map();
  // Always include current month
  monthMap.set(`${curYear}-${curMonth}`, {
    year: curYear,
    month: curMonth,
  });

  allExpenseTxs.forEach((t) => {
    const y = t.date.getFullYear();
    const m = t.date.getMonth() + 1;
    monthMap.set(`${y}-${m}`, { year: y, month: m });
  });

  const availableMonths = Array.from(monthMap.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  const where = {
    accountId: {
      in: accountIds,
    },
    type: "EXPENSE",
  };

  let selectedMonth = null;
  let selectedYear = null;

  if (month === "all") {
    selectedMonth = null;
    selectedYear = null;
  } else if (month && year) {
    selectedMonth = Number(month);
    selectedYear = Number(year);
  } else {
    // Default to current month
    selectedMonth = curMonth;
    selectedYear = curYear;
  }

  if (selectedMonth && selectedYear) {
    const start = new Date(selectedYear, selectedMonth - 1, 1);
    const end = new Date(selectedYear, selectedMonth, 1);
    where.date = { gte: start, lt: end };
  }

  const breakdown = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where,
    _sum: {
      amount: true,
    },
  });

  const categories = await prisma.category.findMany();

  const items = breakdown
    .map((item) => {
      const category = categories.find(
        (category) => category.id === item.categoryId
      );

      return {
        category: category ? category.name : "Unknown",
        amount: item._sum.amount,
      };
    })
    .sort((a, b) => (b.amount || 0) - (a.amount || 0));

  const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  return {
    items,
    total,
    selectedMonth,
    selectedYear,
    availableMonths,
  };
};
const getRecentTransactions = async (userId) => {
  const accounts = await prisma.account.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  const accountIds = accounts.map((account) => account.id);

  const transactions = await prisma.transaction.findMany({
    where: {
      accountId: {
        in: accountIds,
      },
    },
    include: {
      category: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
    take: 5,
  });

  return transactions.map((transaction) => ({
    id: transaction.id,
    merchant: transaction.merchant,
    description: transaction.description,
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category.name,
    date: transaction.date,
  }));
};
const getMonthlyTrend = async (userId) => {
  const accounts = await prisma.account.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  const accountIds = accounts.map((account) => account.id);

  const transactions = await prisma.transaction.findMany({
    where: {
      accountId: {
        in: accountIds,
      },
    },
    select: {
      amount: true,
      type: true,
      date: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  const monthlyData = {};

  transactions.forEach((transaction) => {
    const month = transaction.date.toLocaleString("default", {
      month: "short",
    });

    if (!monthlyData[month]) {
      monthlyData[month] = {
        month,
        income: 0,
        expense: 0,
      };
    }

    if (transaction.type === "INCOME") {
      monthlyData[month].income += transaction.amount;
    } else {
      monthlyData[month].expense += transaction.amount;
    }
  });

  return Object.values(monthlyData);
};
module.exports = {
  getSummary,
  getCategoryBreakdown,
  getRecentTransactions,
  getMonthlyTrend,
};