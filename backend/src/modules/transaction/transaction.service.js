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

  const foundAccount = await prisma.account.findFirst({
    where: { id: accountId, userId },
  });

  if (!foundAccount) {
    throw new AppError("Account not found", 404);
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
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

const createManyFromStatement = async (rows, accountId, userId) => {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
  });

  if (!account) {
    throw new AppError("Account not found", 404);
  }

  const data = rows.map((r) => ({
    accountId,
    categoryId: r.categoryId,
    amount: Number(r.amount),
    type: r.type,
    merchant: r.merchant || null,
    note: r.note || null,
    description: r.description || r.merchant || "Transaction",
    date: new Date(r.date),
    isAnomaly: !!r.isAnomaly,
  }));

  await prisma.transaction.createMany({ data });

  return getTransactions(userId, {});
};

const getTransactions = async (userId, query) => {
  const {
    search,
    categoryId,
    accountId,
    type,
    sortBy = "date",
    sortOrder = "desc",
    page = 1,
    limit = 10,
  } = query;

  const where = {
    account: { userId },
    ...(categoryId && { categoryId }),
    ...(accountId && { accountId }),
    ...(type && { type }),
    ...(search && {
      OR: [
        { merchant: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { account: true, category: true },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit) || 1,
  };
};

const updateTransaction = async (id, data, userId) => {
  const transaction = await prisma.transaction.findFirst({
    where: { id, account: { userId } },
  });

  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      ...data,
      ...(data.date && { date: new Date(data.date) }),
    },
    include: { account: true, category: true },
  });

  return updated;
};

const deleteTransaction = async (id, userId) => {
  const transaction = await prisma.transaction.findFirst({
    where: { id, account: { userId } },
  });

  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }

  await prisma.transaction.delete({ where: { id } });
};

module.exports = {
  createTransaction,
  createManyFromStatement,
  getTransactions,
  updateTransaction,
  deleteTransaction,
};