const cron = require("node-cron");
const prisma = require("../lib/prisma");

/**
 * Sweeps the database for expired subscriptions and marks abandoned pending payments as failed.
 */
const checkAndExpireSubscriptions = async () => {
  try {
    const now = new Date();
    console.log(`[Subscription Worker] Running scheduled sweep at ${now.toISOString()}...`);

    // 1. Downgrade any expired subscriptions back to STARTER
    const expiredUsers = await prisma.user.updateMany({
      where: {
        plan: { not: "STARTER" },
        subscriptionExpiresAt: {
          lt: now,
        },
        subscriptionStatus: {
          in: ["ACTIVE", "CANCELLED"],
        },
      },
      data: {
        plan: "STARTER",
        subscriptionStatus: "EXPIRED",
      },
    });

    if (expiredUsers.count > 0) {
      console.log(
        `[Subscription Worker] Auto-downgraded ${expiredUsers.count} expired user subscription(s) to STARTER.`
      );
    } else {
      console.log("[Subscription Worker] All active user subscriptions are valid.");
    }

    // 2. Mark abandoned PENDING payments older than 24 hours as FAILED
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stalePayments = await prisma.subscriptionPayment.updateMany({
      where: {
        status: "PENDING",
        createdAt: {
          lt: oneDayAgo,
        },
      },
      data: {
        status: "FAILED",
      },
    });

    if (stalePayments.count > 0) {
      console.log(
        `[Subscription Worker] Cleaned up ${stalePayments.count} stale abandoned payment attempts.`
      );
    }

    return {
      expiredCount: expiredUsers.count,
      stalePaymentsCount: stalePayments.count,
    };
  } catch (error) {
    console.error("[Subscription Worker] Error running subscription check:", error);
    return { error: error.message };
  }
};

/**
 * Initializes the automated cron schedule.
 */
const initSubscriptionCron = () => {
  // Run once immediately on startup
  checkAndExpireSubscriptions();

  // Schedule to run every hour at minute 0 (0 * * * *)
  // This guarantees subscriptions expire within 60 minutes of their end timestamp
  const task = cron.schedule("0 * * * *", () => {
    checkAndExpireSubscriptions();
  });

  console.log("⏰ Automated Subscription Expiration Worker initialized (Hourly schedule).");
  return task;
};

module.exports = {
  checkAndExpireSubscriptions,
  initSubscriptionCron,
};
