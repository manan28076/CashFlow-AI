const { PrismaClient } = require("@prisma/client");

const EVAL_USER_ID = "eval_user_fixed_id_2026";
const EVAL_ACCOUNT_ID = "eval_acc_hdfc_2026";

const CATEGORIES = [
  { name: "Salary", type: "INCOME" },
  { name: "Freelance", type: "INCOME" },
  { name: "Food", type: "EXPENSE" },
  { name: "Shopping", type: "EXPENSE" },
  { name: "Travel", type: "EXPENSE" },
  { name: "Entertainment", type: "EXPENSE" },
  { name: "Bills", type: "EXPENSE" },
  { name: "Healthcare", type: "EXPENSE" },
  { name: "Education", type: "EXPENSE" },
  { name: "Investment", type: "EXPENSE" },
  { name: "Transfer", type: "EXPENSE" },
  { name: "Other", type: "EXPENSE" },
];

const FIXTURE_TRANSACTIONS = [
  // Income
  {
    id: "tx_eval_01",
    date: new Date("2026-03-01T10:00:00Z"),
    description: "SALARY CREDITED INFOSYS TECH LTD",
    merchant: "Infosys",
    amount: 120000,
    type: "INCOME",
    categoryName: "Salary",
  },
  {
    id: "tx_eval_02",
    date: new Date("2026-03-15T14:30:00Z"),
    description: "UPWORK ESCROW FREELANCE PAYOUT",
    merchant: "Upwork",
    amount: 35000,
    type: "INCOME",
    categoryName: "Freelance",
  },

  // Food Expenses (March 2026)
  {
    id: "tx_eval_03",
    date: new Date("2026-03-02T13:15:00Z"),
    description: "SWIGGY BANGALORE ORDER #9812",
    merchant: "Swiggy",
    amount: 450,
    type: "EXPENSE",
    categoryName: "Food",
  },
  {
    id: "tx_eval_04",
    date: new Date("2026-03-05T20:45:00Z"),
    description: "ZOMATO RESTAURANT DINING",
    merchant: "Zomato",
    amount: 1850,
    type: "EXPENSE",
    categoryName: "Food",
  },
  {
    id: "tx_eval_05",
    date: new Date("2026-03-10T12:30:00Z"),
    description: "STARBUCKS COFFEE KORAMANGALA",
    merchant: "Starbucks",
    amount: 650,
    type: "EXPENSE",
    categoryName: "Food",
  },
  {
    id: "tx_eval_06",
    date: new Date("2026-03-18T19:20:00Z"),
    description: "SWIGGY INSTAMART GROCERIES",
    merchant: "Swiggy",
    amount: 1240,
    type: "EXPENSE",
    categoryName: "Food",
  },
  {
    id: "tx_eval_07",
    date: new Date("2026-03-24T21:00:00Z"),
    description: "BARBEQUE NATION DINNER OUTING",
    merchant: "Barbeque Nation",
    amount: 3200,
    type: "EXPENSE",
    categoryName: "Food",
  },

  // Shopping Expenses (March 2026)
  {
    id: "tx_eval_08",
    date: new Date("2026-03-03T11:00:00Z"),
    description: "AMAZON INDIA ELECTRONICS CABLE",
    merchant: "Amazon",
    amount: 899,
    type: "EXPENSE",
    categoryName: "Shopping",
  },
  {
    id: "tx_eval_09",
    date: new Date("2026-03-12T16:40:00Z"),
    description: "FLIPKART CLOTHING APPAREL",
    merchant: "Flipkart",
    amount: 2499,
    type: "EXPENSE",
    categoryName: "Shopping",
  },
  {
    id: "tx_eval_10",
    date: new Date("2026-03-20T17:15:00Z"),
    description: "ZARA RETAIL FORUM MALL",
    merchant: "Zara",
    amount: 4590,
    type: "EXPENSE",
    categoryName: "Shopping",
  },

  // Travel Expenses
  {
    id: "tx_eval_11",
    date: new Date("2026-03-04T09:10:00Z"),
    description: "UBER INDIA RIDES TRIP #5521",
    merchant: "Uber",
    amount: 320,
    type: "EXPENSE",
    categoryName: "Travel",
  },
  {
    id: "tx_eval_12",
    date: new Date("2026-03-08T18:00:00Z"),
    description: "OLA CABS COMMUTE TO AIRPORT",
    merchant: "Ola",
    amount: 850,
    type: "EXPENSE",
    categoryName: "Travel",
  },
  {
    id: "tx_eval_13",
    date: new Date("2026-03-16T10:00:00Z"),
    description: "INDIGO FLIGHT TICKET BANGALORE TO DELHI",
    merchant: "IndiGo",
    amount: 4200,
    type: "EXPENSE",
    categoryName: "Travel",
  },

  // Bills & Utilities
  {
    id: "tx_eval_14",
    date: new Date("2026-03-06T10:30:00Z"),
    description: "BESCOM ELECTRICITY MONTHLY BILL",
    merchant: "BESCOM",
    amount: 2150,
    type: "EXPENSE",
    categoryName: "Bills",
  },
  {
    id: "tx_eval_15",
    date: new Date("2026-03-07T11:00:00Z"),
    description: "ACT FIBERNET BROADBAND INTERNET",
    merchant: "ACT Fibernet",
    amount: 1180,
    type: "EXPENSE",
    categoryName: "Bills",
  },
  {
    id: "tx_eval_16",
    date: new Date("2026-03-10T08:15:00Z"),
    description: "AIRTEL POSTPAID MOBILE BILL",
    merchant: "Airtel",
    amount: 799,
    type: "EXPENSE",
    categoryName: "Bills",
  },

  // Healthcare
  {
    id: "tx_eval_17",
    date: new Date("2026-03-11T15:20:00Z"),
    description: "APOLLO PHARMACY HEALTH MEDICINES",
    merchant: "Apollo Pharmacy",
    amount: 1450,
    type: "EXPENSE",
    categoryName: "Healthcare",
  },

  // Entertainment
  {
    id: "tx_eval_18",
    date: new Date("2026-03-01T00:05:00Z"),
    description: "NETFLIX ENTERTAINMENT SUBSCRIPTION",
    merchant: "Netflix",
    amount: 649,
    type: "EXPENSE",
    categoryName: "Entertainment",
  },
  {
    id: "tx_eval_19",
    date: new Date("2026-03-02T00:10:00Z"),
    description: "SPOTIFY PREMIUM INDIVIDUAL",
    merchant: "Spotify",
    amount: 119,
    type: "EXPENSE",
    categoryName: "Entertainment",
  },
  {
    id: "tx_eval_20",
    date: new Date("2026-03-21T19:30:00Z"),
    description: "PVR CINEMAS IMAX MOVIE TICKETS",
    merchant: "PVR Cinemas",
    amount: 980,
    type: "EXPENSE",
    categoryName: "Entertainment",
  },

  // Investment
  {
    id: "tx_eval_21",
    date: new Date("2026-03-05T09:00:00Z"),
    description: "ZERODHA BROKING MUTUAL FUND SIP NIFTY 50",
    merchant: "Zerodha",
    amount: 15000,
    type: "EXPENSE",
    categoryName: "Investment",
  },

  // February 2026 historical transactions
  {
    id: "tx_eval_22",
    date: new Date("2026-02-01T10:00:00Z"),
    description: "SALARY CREDITED INFOSYS TECH LTD",
    merchant: "Infosys",
    amount: 120000,
    type: "INCOME",
    categoryName: "Salary",
  },
  {
    id: "tx_eval_23",
    date: new Date("2026-02-05T13:00:00Z"),
    description: "SWIGGY BANGALORE RESTAURANT",
    merchant: "Swiggy",
    amount: 620,
    type: "EXPENSE",
    categoryName: "Food",
  },
  {
    id: "tx_eval_24",
    date: new Date("2026-02-14T20:00:00Z"),
    description: "AMAZON INDIA VALENTINE GIFT",
    merchant: "Amazon",
    amount: 3200,
    type: "EXPENSE",
    categoryName: "Shopping",
  },
  {
    id: "tx_eval_25",
    date: new Date("2026-02-20T11:00:00Z"),
    description: "UBER RIDES COMMUTE",
    merchant: "Uber",
    amount: 450,
    type: "EXPENSE",
    categoryName: "Travel",
  },
  {
    id: "tx_eval_26",
    date: new Date("2026-02-06T10:00:00Z"),
    description: "BESCOM ELECTRICITY BILL",
    merchant: "BESCOM",
    amount: 1980,
    type: "EXPENSE",
    categoryName: "Bills",
  },
];

const FIXTURE_BUDGETS = [
  { categoryName: "Food", amount: 15000, month: 3, year: 2026 },
  { categoryName: "Shopping", amount: 10000, month: 3, year: 2026 },
  { categoryName: "Travel", amount: 6000, month: 3, year: 2026 },
  { categoryName: "Bills", amount: 5000, month: 3, year: 2026 },
  { categoryName: "Entertainment", amount: 2500, month: 3, year: 2026 },
];

function validateEvalEnvironment() {
  const evalUrl = process.env.DATABASE_URL_EVAL;
  const prodUrl = process.env.DATABASE_URL;

  if (!evalUrl) {
    throw new Error("DATABASE_URL_EVAL is not defined in environment variables. Refusing to run eval seed.");
  }

  if (evalUrl === prodUrl) {
    throw new Error("DATABASE_URL_EVAL matches production DATABASE_URL. Refusing to run eval seed on primary database!");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NODE_ENV is set to 'production'. Refusing to run eval seed in production environment!");
  }

  return evalUrl;
}

async function seedEvalDb(options = {}) {
  const evalUrl = options.databaseUrl || validateEvalEnvironment();
  const prisma = new PrismaClient({
    datasources: {
      db: { url: evalUrl },
    },
  });

  try {
    // 1. Upsert Categories
    const categoryMap = new Map();
    for (const cat of CATEGORIES) {
      const created = await prisma.category.upsert({
        where: { name: cat.name },
        update: { type: cat.type },
        create: { name: cat.name, type: cat.type },
      });
      categoryMap.set(cat.name, created.id);
    }

    // 2. Upsert Eval User
    const user = await prisma.user.upsert({
      where: { id: EVAL_USER_ID },
      update: {
        email: "eval_test_user@cashflow.ai",
        name: "Eval Test User",
        plan: "PRO",
      },
      create: {
        id: EVAL_USER_ID,
        email: "eval_test_user@cashflow.ai",
        name: "Eval Test User",
        plan: "PRO",
      },
    });

    // 3. Upsert Eval Account
    await prisma.account.upsert({
      where: { id: EVAL_ACCOUNT_ID },
      update: {
        name: "HDFC Primary Checking",
        bankName: "HDFC Bank",
        userId: user.id,
      },
      create: {
        id: EVAL_ACCOUNT_ID,
        name: "HDFC Primary Checking",
        bankName: "HDFC Bank",
        userId: user.id,
      },
    });

    // 4. Seed Budgets
    for (const b of FIXTURE_BUDGETS) {
      const categoryId = categoryMap.get(b.categoryName);
      if (!categoryId) continue;

      await prisma.budget.upsert({
        where: {
          userId_categoryId_month_year: {
            userId: user.id,
            categoryId,
            month: b.month,
            year: b.year,
          },
        },
        update: { amount: b.amount },
        create: {
          userId: user.id,
          categoryId,
          month: b.month,
          year: b.year,
          amount: b.amount,
        },
      });
    }

    // 5. Seed Transactions
    for (const t of FIXTURE_TRANSACTIONS) {
      const categoryId = categoryMap.get(t.categoryName) || categoryMap.get("Other");
      await prisma.transaction.upsert({
        where: { id: t.id },
        update: {
          date: t.date,
          description: t.description,
          merchant: t.merchant,
          amount: t.amount,
          type: t.type,
          accountId: EVAL_ACCOUNT_ID,
          categoryId,
        },
        create: {
          id: t.id,
          date: t.date,
          description: t.description,
          merchant: t.merchant,
          amount: t.amount,
          type: t.type,
          accountId: EVAL_ACCOUNT_ID,
          categoryId,
        },
      });
    }

    return {
      success: true,
      userId: user.id,
      accountId: EVAL_ACCOUNT_ID,
      transactionCount: FIXTURE_TRANSACTIONS.length,
      budgetCount: FIXTURE_BUDGETS.length,
    };
  } finally {
    await prisma.$disconnect();
  }
}

function getDeterministicFixtures() {
  return {
    userId: EVAL_USER_ID,
    accountId: EVAL_ACCOUNT_ID,
    categories: CATEGORIES,
    transactions: FIXTURE_TRANSACTIONS,
    budgets: FIXTURE_BUDGETS,
  };
}

if (require.main === module) {
  seedEvalDb()
    .then((res) => console.log("✅ Eval database seeded successfully:", res))
    .catch((err) => {
      console.error("❌ Failed to seed eval database:", err.message);
      process.exit(1);
    });
}

module.exports = {
  EVAL_USER_ID,
  EVAL_ACCOUNT_ID,
  CATEGORIES,
  FIXTURE_TRANSACTIONS,
  FIXTURE_BUDGETS,
  validateEvalEnvironment,
  seedEvalDb,
  getDeterministicFixtures,
};
