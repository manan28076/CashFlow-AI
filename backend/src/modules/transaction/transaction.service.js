const prisma = require("../../lib/prisma");
const AppError = require("../../errors/AppError");

const createTransaction = async (data, userId) => {
  const {
    accountId,
    categoryId,
    amount,
    type,
    merchant,
    note,
    description,
    date,
  } = data;

  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      userId,
    },
  });

  if (!account) {
    throw new AppError("Account not found", 404);
  }

  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const transaction = await prisma.transaction.create({
    data: {
      accountId,
      categoryId,
      amount,
      type,
      merchant,
      note,
      description,
      date: new Date(date),
    },
  });

  return transaction;
};

const getTransactions = async (userId) => {
  const transactions = await prisma.transaction.findMany({
    where: {
      account: {
        userId,
      },
    },
    include: {
      account: true,
      category: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  return transactions;
};

module.exports = {
  createTransaction,
  getTransactions,
};