const cron = require("node-cron");
const prisma = require("../lib/prisma");
const { AI_PROACTIVE_ENABLED, AI_WEEKLY_CRON } = require("../config/env");
const { generateUserWeeklyDigest } = require("../modules/ai/agents/proactive.agent");

/**
 * Runs a weekly proactive sweep across all users with a concurrency cap.
 * One user failure will never abort the sweep for other users.
 */
async function runProactiveWeeklySweep() {
  console.log(`[Proactive Weekly Agent] Starting weekly sweep at ${new Date().toISOString()}...`);
  const startTime = Date.now();

  const users = await prisma.user.findMany({
    select: { id: true, email: true },
  });

  let processedCount = 0;
  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const errors = [];

  // Batch process users with concurrency cap of 5
  const concurrency = 5;
  for (let i = 0; i < users.length; i += concurrency) {
    const batch = users.slice(i, i + concurrency);
    const promises = batch.map(async (u) => {
      try {
        const res = await generateUserWeeklyDigest(u.id);
        processedCount++;
        if (res.skipped) {
          skippedCount++;
        } else if (res.created) {
          createdCount++;
        }
      } catch (err) {
        errorCount++;
        errors.push({ userId: u.id, error: err.message });
        console.error(`[Proactive Weekly Agent] Error processing user ${u.id}:`, err.message);
      }
    });

    await Promise.all(promises);
  }

  const durationMs = Date.now() - startTime;
  console.log(
    `[Proactive Weekly Agent] Sweep completed in ${durationMs}ms: ` +
    `Processed: ${processedCount}, Created: ${createdCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`
  );

  return {
    totalUsers: users.length,
    processedCount,
    createdCount,
    skippedCount,
    errorCount,
    errors,
    durationMs,
  };
}

/**
 * Initialize proactive weekly cron job.
 */
function initProactiveCron() {
  if (!AI_PROACTIVE_ENABLED) {
    console.log("ℹ️ Proactive Weekly AI Agent is disabled (AI_PROACTIVE_ENABLED is false).");
    return null;
  }

  const task = cron.schedule(AI_WEEKLY_CRON, () => {
    runProactiveWeeklySweep().catch((err) => {
      console.error("[Proactive Weekly Agent] Unhandled error in scheduled job:", err);
    });
  });

  console.log(`⏰ Proactive Weekly AI Agent initialized with schedule: "${AI_WEEKLY_CRON}".`);
  return task;
}

module.exports = {
  runProactiveWeeklySweep,
  initProactiveCron,
};
