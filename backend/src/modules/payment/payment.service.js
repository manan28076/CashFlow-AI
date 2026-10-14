const crypto = require("crypto");
const Razorpay = require("razorpay");
const prisma = require("../../lib/prisma");
const AppError = require("../../errors/AppError");
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = require("../../config/env");

// Pricing table (in INR & Paise)
const PLAN_PRICING = {
  pro: {
    monthly: { amount: 249, paise: 24900, durationDays: 30, planName: "PRO" },
    annual: { amount: 2388, paise: 238800, durationDays: 365, planName: "PRO" },
  },
  family: {
    monthly: { amount: 599, paise: 59900, durationDays: 30, planName: "FAMILY" },
    annual: { amount: 5988, paise: 598800, durationDays: 365, planName: "FAMILY" },
  },
};

const getRazorpayInstance = () => {
  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
    return new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }
  return null;
};

/**
 * 1. Create a Razorpay Order
 */
const createOrder = async ({ userId, plan, billingCycle }) => {
  const normalizedPlan = (plan || "").toLowerCase();
  const normalizedCycle = (billingCycle || "").toLowerCase();

  const planConfig = PLAN_PRICING[normalizedPlan]?.[normalizedCycle];
  if (!planConfig) {
    throw new AppError("Invalid plan or billing cycle selected", 400);
  }

  const razorpay = getRazorpayInstance();
  let razorpayOrderId;

  if (razorpay) {
    try {
      const order = await razorpay.orders.create({
        amount: planConfig.paise,
        currency: "INR",
        receipt: `rcpt_${userId.slice(-6)}_${Date.now().toString().slice(-6)}`,
        notes: {
          userId,
          plan: planConfig.planName,
          billingCycle: normalizedCycle,
        },
      });
      razorpayOrderId = order.id;
    } catch (err) {
      console.error("Razorpay order creation error:", err);
      throw new AppError(err?.error?.description || "Failed to initiate Razorpay order", 500);
    }
  } else {
    // Development/Test fallback when API keys are not supplied in .env
    razorpayOrderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  const expiresAt = new Date(Date.now() + planConfig.durationDays * 24 * 60 * 60 * 1000);

  // Record pending subscription payment in database
  const paymentRecord = await prisma.subscriptionPayment.create({
    data: {
      userId,
      plan: planConfig.planName,
      billingCycle: normalizedCycle,
      amount: planConfig.amount,
      currency: "INR",
      razorpayOrderId,
      status: "PENDING",
      expiresAt,
    },
  });

  return {
    orderId: razorpayOrderId,
    amount: planConfig.amount,
    paise: planConfig.paise,
    currency: "INR",
    keyId: RAZORPAY_KEY_ID || "rzp_test_fallback",
    plan: planConfig.planName,
    billingCycle: normalizedCycle,
    paymentRecordId: paymentRecord.id,
    isTestMode: !razorpay,
  };
};

/**
 * 2. Cryptographically Verify Payment & Activate Subscription
 */
const verifyPayment = async ({
  userId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  if (!razorpayOrderId || !razorpayPaymentId) {
    throw new AppError("Missing Razorpay order or payment details", 400);
  }

  const paymentRecord = await prisma.subscriptionPayment.findUnique({
    where: { razorpayOrderId },
  });

  if (!paymentRecord || paymentRecord.userId !== userId) {
    throw new AppError("Payment record not found for this user", 404);
  }

  if (paymentRecord.status === "SUCCESS") {
    // Already verified, return user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        plan: true,
        planBillingCycle: true,
        subscriptionStatus: true,
        subscriptionStartedAt: true,
        subscriptionExpiresAt: true,
        createdAt: true,
      },
    });
    return { user, payment: paymentRecord };
  }

  const razorpay = getRazorpayInstance();

  // Validate signature if real secret is configured
  if (razorpay && RAZORPAY_KEY_SECRET) {
    const generatedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      await prisma.subscriptionPayment.update({
        where: { id: paymentRecord.id },
        data: {
          razorpayPaymentId,
          razorpaySignature,
          status: "FAILED",
        },
      });
      throw new AppError("Razorpay signature verification failed. Fraudulent attempt blocked.", 400);
    }
  }

  // Calculate accurate duration
  const now = new Date();
  const isAnnual = paymentRecord.billingCycle === "annual";
  const durationDays = isAnnual ? 365 : 30;
  const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  // Update payment record to SUCCESS
  const updatedPayment = await prisma.subscriptionPayment.update({
    where: { id: paymentRecord.id },
    data: {
      razorpayPaymentId,
      razorpaySignature: razorpaySignature || "verified_test_sig",
      status: "SUCCESS",
      startedAt: now,
      expiresAt,
    },
  });

  // Permanently grant user the PRO / FAMILY plan in DB with expiration timestamp
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      plan: paymentRecord.plan,
      planBillingCycle: paymentRecord.billingCycle,
      subscriptionStatus: "ACTIVE",
      subscriptionStartedAt: now,
      subscriptionExpiresAt: expiresAt,
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      plan: true,
      planBillingCycle: true,
      subscriptionStatus: true,
      subscriptionStartedAt: true,
      subscriptionExpiresAt: true,
      createdAt: true,
    },
  });

  return {
    user: updatedUser,
    payment: updatedPayment,
  };
};

/**
 * 3. Fetch Subscription Details & Invoice History
 */
const getSubscriptionDetails = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      plan: true,
      planBillingCycle: true,
      subscriptionStatus: true,
      subscriptionStartedAt: true,
      subscriptionExpiresAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Fetch past payments
  const payments = await prisma.subscriptionPayment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  let daysRemaining = 0;
  if (user.subscriptionExpiresAt) {
    const diffTime = new Date(user.subscriptionExpiresAt).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  return {
    user,
    daysRemaining,
    payments,
  };
};

/**
 * 4. Cancel Subscription / Downgrade to Starter
 */
const cancelSubscription = async (userId) => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      plan: "STARTER",
      subscriptionStatus: "CANCELLED",
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      plan: true,
      planBillingCycle: true,
      subscriptionStatus: true,
      subscriptionStartedAt: true,
      subscriptionExpiresAt: true,
      createdAt: true,
    },
  });

  return updatedUser;
};

module.exports = {
  createOrder,
  verifyPayment,
  getSubscriptionDetails,
  cancelSubscription,
};
