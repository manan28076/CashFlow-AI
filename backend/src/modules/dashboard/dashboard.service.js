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
const getCategoryBreakdown = async (userId) => {
  const accounts = await prisma.account.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  const accountIds = accounts.map((account) => account.id);

  const breakdown = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      accountId: {
        in: accountIds,
      },
      type: "EXPENSE",
    },
    _sum: {
      amount: true,
    },
  });

  const categories = await prisma.category.findMany();

  const result = breakdown.map((item) => {
    const category = categories.find(
      (category) => category.id === item.categoryId
    );

    return {
      category: category ? category.name : "Unknown",
      amount: item._sum.amount,
    };
  });

  return result;
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