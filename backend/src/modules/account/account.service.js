const prisma = require("../../lib/prisma");

const createAccount = async ({ name, bankName }, userId) => {
  const account = await prisma.account.create({
    data: {
      name,
      bankName,
      userId,
    },
  });

  return account;
};

const getAccounts = async (userId) => {
  const accounts = await prisma.account.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return accounts;
};

module.exports = {
  createAccount,
  getAccounts,
};