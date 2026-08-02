const prisma = require("../../lib/prisma");
const AppError = require("../../errors/AppError");

const createAccount = async ({ name, bankName }, userId) => {
  const account = await prisma.account.create({
    data: { name, bankName, userId },
  });
  return account;
};

const getAccounts = async (userId) => {
  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return accounts;
};

const updateAccount = async (id, data, userId) => {
  const account = await prisma.account.findFirst({
    where: { id, userId },
  });

  if (!account) {
    throw new AppError("Account not found", 404);
  }

  const updated = await prisma.account.update({
    where: { id },
    data,
  });

  return updated;
};

const deleteAccount = async (id, userId) => {
  const account = await prisma.account.findFirst({
    where: { id, userId },
  });

  if (!account) {
    throw new AppError("Account not found", 404);
  }

  await prisma.account.delete({ where: { id } });
};

module.exports = {
  createAccount,
  getAccounts,
  updateAccount,
  deleteAccount,
};