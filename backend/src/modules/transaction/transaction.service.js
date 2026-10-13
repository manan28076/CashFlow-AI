const prisma = require("../../lib/prisma");
const AppError = require("../../errors/AppError");
const { computeTransactionHash } = require("./utils/hash");

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
    allowDuplicate,
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

  const normDateStr = new Date(date).toISOString().split("T")[0];
  const normAmt = Number(amount);
  const normDesc = (description || merchant || "Transaction").trim();

  // Strict Duplicate Guard: Check if an identical transaction already exists in this account on the same day
  const existingMatches = await prisma.transaction.findMany({
    where: {
      accountId,
      amount: normAmt,
      type,
      date: {
        gte: new Date(`${normDateStr}T00:00:00.000Z`),
        lte: new Date(`${normDateStr}T23:59:59.999Z`),
      },
      OR: [
        { description: { equals: normDesc, mode: "insensitive" } },
        ...(merchant ? [{ merchant: { equals: merchant.trim(), mode: "insensitive" } }] : []),
      ],
    },
    select: {
      id: true,
      amount: true,
      date: true,
      description: true,
      merchant: true,
      type: true,
      createdAt: true,
    },
  });

  if (existingMatches.length > 0 && !allowDuplicate) {
    const existing = existingMatches[0];
    const err = new AppError(
      `Duplicate transaction detected: A transaction for ₹${normAmt} on ${normDateStr} with description '${existing.description}' already exists in this account. To prevent accidental duplicates, this was not added. If this was a separate transaction, please confirm to add anyway.`,
      409
    );
    err.isDuplicate = true;
    err.duplicateDetails = {
      existingId: existing.id,
      amount: existing.amount,
      date: normDateStr,
      description: existing.description,
      merchant: existing.merchant,
      count: existingMatches.length,
    };
    throw err;
  }

  const occurrence = existingMatches.length + 1;
  const hash = computeTransactionHash(date, normAmt, type, normDesc, occurrence);

  const transaction = await prisma.transaction.create({
    data: {
      accountId,
      categoryId,
      amount: normAmt,
      type,
      merchant,
      note,
      description: normDesc,
      date: new Date(date),
      hash,
    },
    include: { account: true, category: true },
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

  const existing = await prisma.transaction.findMany({
    where: { accountId },
    select: { date: true, amount: true, merchant: true },
  });

  const existingKeys = new Set(
    existing.map(
      (t) => `${t.date.toISOString()}|${t.amount}|${t.merchant || ""}`
    )
  );

  const newRows = data.filter((r) => {
    const key = `${r.date.toISOString()}|${r.amount}|${r.merchant || ""}`;
    return !existingKeys.has(key);
  });

  const skippedCount = data.length - newRows.length;

  if (newRows.length > 0) {
    await prisma.transaction.createMany({ data: newRows });
  }

  const result = await getTransactions(userId, {});

  return { ...result, skippedDuplicates: skippedCount };
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

/**
 * Detect all duplicate transaction groups for this user.
 * Groups by accountId + calendar date + amount + type + normalized description.
 */
const getDuplicateTransactions = async (userId) => {
  const transactions = await prisma.transaction.findMany({
    where: { account: { userId } },
    include: { account: true, category: true },
    orderBy: { createdAt: "asc" },
  });

  const groupMap = new Map();

  for (const t of transactions) {
    const dStr = t.date.toISOString().split("T")[0];
    const descKey = (t.description || t.merchant || "transaction").toLowerCase().trim();
    const groupKey = `${t.accountId}|${dStr}|${t.amount}|${t.type}|${descKey}`;

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        groupKey,
        date: dStr,
        amount: t.amount,
        type: t.type,
        description: t.description,
        merchant: t.merchant,
        categoryName: t.category?.name || "Other",
        accountName: t.account?.name || "Account",
        transactions: [],
      });
    }

    groupMap.get(groupKey).transactions.push(t);
  }

  // Filter only groups with multiple entries
  const duplicateGroups = Array.from(groupMap.values()).filter(
    (g) => g.transactions.length > 1
  );

  const totalDuplicates = duplicateGroups.reduce(
    (acc, g) => acc + (g.transactions.length - 1),
    0
  );

  return {
    totalDuplicateGroups: duplicateGroups.length,
    totalRedundantTransactions: totalDuplicates,
    groups: duplicateGroups,
  };
};

/**
 * Resolve duplicates:
 * action: "clean_all" -> Keeps the first (earliest created) in each duplicate group and deletes the rest.
 * action: "delete_ids" -> Deletes specific transaction IDs that belong to the user.
 */
const resolveDuplicateTransactions = async (userId, { action = "clean_all", idsToDelete = [] }) => {
  if (action === "clean_all") {
    const { groups } = await getDuplicateTransactions(userId);
    const toDelete = [];

    for (const g of groups) {
      // Keep the first, delete index 1..end
      for (let i = 1; i < g.transactions.length; i++) {
        toDelete.push(g.transactions[i].id);
      }
    }

    if (toDelete.length > 0) {
      await prisma.transaction.deleteMany({
        where: {
          id: { in: toDelete },
          account: { userId },
        },
      });
    }

    return {
      deletedCount: toDelete.length,
      message: `Cleaned ${toDelete.length} duplicate transactions successfully.`,
    };
  }

  if (action === "delete_ids" && Array.isArray(idsToDelete) && idsToDelete.length > 0) {
    const res = await prisma.transaction.deleteMany({
      where: {
        id: { in: idsToDelete },
        account: { userId },
      },
    });

    return {
      deletedCount: res.count,
      message: `Deleted ${res.count} duplicate transactions.`,
    };
  }

  return { deletedCount: 0, message: "No action taken." };
};

module.exports = {
  createTransaction,
  createManyFromStatement,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getDuplicateTransactions,
  resolveDuplicateTransactions,
};