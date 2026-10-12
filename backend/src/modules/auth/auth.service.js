const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const prisma = require("../../lib/prisma");
const AppError = require("../../errors/AppError");
const { JWT_SECRET } = require("../../config/env");

const registerUser = async ({ email, password }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError("User already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  const token = jwt.sign(
    { id: user.id },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
};

const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = jwt.sign(
    { id: user.id },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
};

const { OAuth2Client } = require("google-auth-library");
const { GOOGLE_CLIENT_ID } = require("../../config/env");

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const authenticateWithGoogle = async (idToken) => {
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (error) {
    throw new AppError("Invalid or expired Google token", 401);
  }

  if (!payload || !payload.email) {
    throw new AppError("Unable to retrieve email from Google", 400);
  }

  if (!payload.email_verified) {
    throw new AppError("Google email is not verified", 400);
  }

  const { email, sub: googleId, name, picture: avatarUrl } = payload;

  // Check if user exists by googleId or email
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { googleId },
        { email },
      ],
    },
  });

  if (user) {
    // If user exists by email but googleId not yet linked, link it now
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          name: user.name || name,
          avatarUrl: user.avatarUrl || avatarUrl,
        },
      });
    }
  } else {
    // New user signing up with Google
    user = await prisma.user.create({
      data: {
        email,
        googleId,
        name,
        avatarUrl,
      },
    });
  }

  const token = jwt.sign(
    { id: user.id },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
    token,
  };
};

const loginDemoUser = async () => {
  const demoEmail = "demo.user@cashflow.ai";

  let user = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: demoEmail,
        name: "Demo Account",
      },
    });
  }

  // Ensure demo has an Account
  let account = await prisma.account.findFirst({
    where: { userId: user.id },
  });

  if (!account) {
    account = await prisma.account.create({
      data: {
        name: "HDFC Salary Account",
        bankName: "HDFC Bank",
        userId: user.id,
      },
    });
  }

  // Check if transactions already exist
  const count = await prisma.transaction.count({
    where: { accountId: account.id },
  });

  if (count === 0) {
    // Seed ~3 months of realistic Indian transactions
    const categories = await prisma.category.findMany();
    const catMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
    const getCat = (name) => catMap.get(name.toLowerCase()) || categories[0]?.id;

    const demoTransactions = [
      // Month 1
      { date: new Date("2026-08-01"), amount: 75000, type: "INCOME", merchant: "TCS Global Tech", description: "Monthly Salary Credit", categoryId: getCat("Salary") },
      { date: new Date("2026-08-03"), amount: 18000, type: "EXPENSE", merchant: "NoBroker Rent", description: "House Rent transfer", categoryId: getCat("Bills") },
      { date: new Date("2026-08-05"), amount: 480, type: "EXPENSE", merchant: "Swiggy", description: "UPI/Swiggy/Biryani", categoryId: getCat("Food") },
      { date: new Date("2026-08-08"), amount: 1450, type: "EXPENSE", merchant: "Zepto", description: "Weekly Groceries Instant Delivery", categoryId: getCat("Food") },
      { date: new Date("2026-08-11"), amount: 249, type: "EXPENSE", merchant: "Uber", description: "Uber Cab to Office", categoryId: getCat("Travel") },
      { date: new Date("2026-08-15"), amount: 2800, type: "EXPENSE", merchant: "Amazon", description: "Office Ergonomic Mouse", categoryId: getCat("Shopping") },
      { date: new Date("2026-08-18"), amount: 15000, type: "EXPENSE", merchant: "Zerodha", description: "SIP Nifty 50 Index Fund", categoryId: getCat("Investment") },
      { date: new Date("2026-08-20"), amount: 649, type: "EXPENSE", merchant: "Netflix", description: "Monthly Netflix Premium", categoryId: getCat("Entertainment") },
      { date: new Date("2026-08-25"), amount: 1200, type: "EXPENSE", merchant: "Tata Power", description: "Electricity Bill Payment", categoryId: getCat("Bills") },
      { date: new Date("2026-08-28"), amount: 399, type: "EXPENSE", merchant: "Airtel", description: "Broadband recharge", categoryId: getCat("Bills") },

      // Month 2
      { date: new Date("2026-09-01"), amount: 75000, type: "INCOME", merchant: "TCS Global Tech", description: "Monthly Salary Credit", categoryId: getCat("Salary") },
      { date: new Date("2026-09-02"), amount: 18000, type: "EXPENSE", merchant: "NoBroker Rent", description: "House Rent transfer", categoryId: getCat("Bills") },
      { date: new Date("2026-09-04"), amount: 350, type: "EXPENSE", merchant: "Zomato", description: "Dinner order Pizza", categoryId: getCat("Food") },
      { date: new Date("2026-09-07"), amount: 2100, type: "EXPENSE", merchant: "Blinkit", description: "Groceries and Dairy", categoryId: getCat("Food") },
      { date: new Date("2026-09-12"), amount: 48500, type: "EXPENSE", merchant: "Apple Store India", description: "New iPad Purchase (Unusual high spend)", categoryId: getCat("Shopping"), isAnomaly: true },
      { date: new Date("2026-09-15"), amount: 15000, type: "EXPENSE", merchant: "Zerodha", description: "SIP Mutual Fund", categoryId: getCat("Investment") },
      { date: new Date("2026-09-19"), amount: 890, type: "EXPENSE", merchant: "Apollo Pharmacy", description: "Medicines & Vitamins", categoryId: getCat("Healthcare") },
      { date: new Date("2026-09-24"), amount: 649, type: "EXPENSE", merchant: "Netflix", description: "Monthly Netflix Premium", categoryId: getCat("Entertainment") },
      { date: new Date("2026-09-27"), amount: 1450, type: "EXPENSE", merchant: "Tata Power", description: "Electricity Bill", categoryId: getCat("Bills") },

      // Month 3
      { date: new Date("2026-10-01"), amount: 75000, type: "INCOME", merchant: "TCS Global Tech", description: "Monthly Salary Credit", categoryId: getCat("Salary") },
      { date: new Date("2026-10-02"), amount: 18000, type: "EXPENSE", merchant: "NoBroker Rent", description: "House Rent transfer", categoryId: getCat("Bills") },
      { date: new Date("2026-10-04"), amount: 620, type: "EXPENSE", merchant: "Swiggy", description: "Lunch delivery", categoryId: getCat("Food") },
      { date: new Date("2026-10-06"), amount: 1950, type: "EXPENSE", merchant: "BigBasket", description: "Monthly Staples & Groceries", categoryId: getCat("Food") },
      { date: new Date("2026-10-08"), amount: 3500, type: "INCOME", merchant: "Friend UPI", description: "Dinner split payment from Rahul", categoryId: getCat("Other") },
      { date: new Date("2026-10-09"), amount: 45000, type: "EXPENSE", merchant: "Crypto / Foreign Exchange", description: "Sudden international wire transfer", categoryId: getCat("Other"), isAnomaly: true },
      { date: new Date("2026-10-10"), amount: 15000, type: "EXPENSE", merchant: "Zerodha", description: "SIP Investment", categoryId: getCat("Investment") },
    ];

    await prisma.transaction.createMany({
      data: demoTransactions.map((t) => ({
        accountId: account.id,
        categoryId: t.categoryId,
        amount: t.amount,
        type: t.type,
        merchant: t.merchant,
        description: t.description,
        date: t.date,
        isAnomaly: !!t.isAnomaly,
      })),
    });
  }

  const token = jwt.sign(
    { id: user.id },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
    token,
  };
};

module.exports = {
  registerUser,
  loginUser,
  authenticateWithGoogle,
  loginDemoUser,
};