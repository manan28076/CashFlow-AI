/**
 * Proactive Weekly Financial Agent
 * 
 * Computes deterministic financial metrics:
 * 1. Budget burn-rate vs days left in month
 * 2. Week-over-week category spending changes
 * 3. Statistical anomalies in recent debits
 * 
 * Invokes LLM strictly to synthesize a concise, encouraging human summary
 * without computing numbers. Stores results idempotently in Notification model.
 */

const { z } = require("zod");
const prisma = require("../../../lib/prisma");
const { callGemini } = require("../services/gemini.service");
const { detectAnomalies } = require("../utils/anomaly");

/**
 * Compute ISO 8601 week string e.g. "2026-W11"
 */
function getIsoWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/**
 * Compute budget burn-rate vs time elapsed in the current month.
 * Pure deterministic calculation.
 * 
 * @param {Array<{ categoryId: string, categoryName: string, amount: number }>} budgets
 * @param {Record<string, number>} categoryExpenses - Map of categoryId -> total spent so far
 * @param {number} daysPassed
 * @param {number} totalDaysInMonth
 */
function computeBudgetBurnRate(budgets = [], categoryExpenses = {}, daysPassed = 15, totalDaysInMonth = 30) {
  const timeElapsedPct = Math.round((daysPassed / totalDaysInMonth) * 100);

  return budgets.map((b) => {
    const spent = categoryExpenses[b.categoryId] || 0;
    const remaining = Math.max(0, b.amount - spent);
    const burnRatePct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;

    let status = "ON_TRACK";
    if (spent > b.amount) {
      status = "OVER_BUDGET";
    } else if (burnRatePct > timeElapsedPct + 15) {
      status = "AT_RISK";
    }

    return {
      categoryId: b.categoryId,
      categoryName: b.categoryName || "Unknown",
      budget: b.amount,
      spent,
      remaining,
      burnRatePct,
      timeElapsedPct,
      status,
    };
  });
}

/**
 * Compute Week-Over-Week spending changes grouped by category.
 * Pure deterministic calculation.
 */
function computeWeekOverWeek(currentWeekTxs = [], previousWeekTxs = []) {
  const sumByCategory = (txs) => {
    const map = {};
    for (const t of txs) {
      if (t.type === "EXPENSE") {
        const cat = t.category?.name || "Other";
        map[cat] = (map[cat] || 0) + (Number(t.amount) || 0);
      }
    }
    return map;
  };

  const currentMap = sumByCategory(currentWeekTxs);
  const previousMap = sumByCategory(previousWeekTxs);

  let totalCurrent = 0;
  let totalPrevious = 0;
  const categories = [];

  const allCats = Array.from(new Set([...Object.keys(currentMap), ...Object.keys(previousMap)]));
  for (const cat of allCats) {
    const cur = currentMap[cat] || 0;
    const prev = previousMap[cat] || 0;
    totalCurrent += cur;
    totalPrevious += prev;

    let changePct = 0;
    if (prev === 0) {
      changePct = cur > 0 ? 100 : 0;
    } else {
      changePct = Math.round(((cur - prev) / prev) * 100);
    }

    categories.push({
      category: cat,
      currentWeek: cur,
      previousWeek: prev,
      changeAmount: cur - prev,
      changePct,
    });
  }

  // Sort by highest change in absolute magnitude
  categories.sort((a, b) => Math.abs(b.changeAmount) - Math.abs(a.changeAmount));

  const overallChangePct =
    totalPrevious === 0
      ? totalCurrent > 0 ? 100 : 0
      : Math.round(((totalCurrent - totalPrevious) / totalPrevious) * 100);

  return {
    categories: categories.slice(0, 5), // top 5 dynamic categories
    totalCurrentWeek: totalCurrent,
    totalPreviousWeek: totalPrevious,
    overallChangePct,
  };
}

const proactiveDigestSchema = z.object({
  title: z.string(),
  summary: z.string(),
  keyHighlight: z.string(),
});

/**
 * Generate weekly digest for a single user.
 * Skips users with no activity. Safe against failures.
 */
async function generateUserWeeklyDigest(userId, options = {}) {
  const now = options.referenceDate ? new Date(options.referenceDate) : new Date();
  const weekKey = getIsoWeekKey(now);

  // Check idempotency first: if notification already exists for this week, skip processing!
  const existing = await prisma.notification.findUnique({
    where: {
      userId_type_weekKey: {
        userId,
        type: "WEEKLY_DIGEST",
        weekKey,
      },
    },
  });

  if (existing) {
    return {
      skipped: true,
      reason: "Notification already exists for this week",
      notification: existing,
    };
  }

  // Calculate date boundaries
  const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const daysInMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0)).getDate();
  const daysPassed = now.getDate();

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Fetch user accounts
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { id: true },
  });
  const accountIds = accounts.map((a) => a.id);

  if (accountIds.length === 0) {
    return { skipped: true, reason: "User has no bank accounts registered." };
  }

  // Fetch month transactions
  const monthTransactions = await prisma.transaction.findMany({
    where: {
      accountId: { in: accountIds },
      date: { gte: startOfMonth, lte: now },
    },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  // Skip inactive users (0 transactions in current month)
  if (monthTransactions.length === 0) {
    return { skipped: true, reason: "User has no transactions this month." };
  }

  // Current week transactions (last 7 days) vs previous week (7-14 days ago)
  const currentWeekTxs = monthTransactions.filter((t) => new Date(t.date) >= sevenDaysAgo);
  const previousWeekTxs = await prisma.transaction.findMany({
    where: {
      accountId: { in: accountIds },
      date: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
    },
    include: { category: true },
  });

  // Fetch current month's budgets
  const budgets = await prisma.budget.findMany({
    where: {
      userId,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    },
    include: { category: true },
  });

  // Deterministic 1: Budget burn rate
  const monthlyExpensesByCategory = {};
  for (const t of monthTransactions) {
    if (t.type === "EXPENSE") {
      monthlyExpensesByCategory[t.categoryId] =
        (monthlyExpensesByCategory[t.categoryId] || 0) + (Number(t.amount) || 0);
    }
  }

  const budgetAnalysis = computeBudgetBurnRate(
    budgets.map((b) => ({
      categoryId: b.categoryId,
      categoryName: b.category?.name || "Unknown",
      amount: b.amount,
    })),
    monthlyExpensesByCategory,
    daysPassed,
    daysInMonth
  );

  // Deterministic 2: Week-over-week changes
  const wowAnalysis = computeWeekOverWeek(currentWeekTxs, previousWeekTxs);

  // Deterministic 3: Anomalies in the past 7 days
  const anomalyReport = detectAnomalies(currentWeekTxs);
  const anomaliesCount = anomalyReport.flagged.length;

  // Prepare deterministic facts payload for LLM phrasing
  const deterministicFacts = {
    weekKey,
    daysPassed,
    daysInMonth,
    timeElapsedPct: Math.round((daysPassed / daysInMonth) * 100),
    totalSpentThisWeek: wowAnalysis.totalCurrentWeek,
    wowSpendingChangePct: wowAnalysis.overallChangePct,
    topCategoryChanges: wowAnalysis.categories,
    budgetsStatus: budgetAnalysis.map((b) => ({
      category: b.categoryName,
      spent: b.spent,
      budget: b.budget,
      status: b.status,
    })),
    anomaliesCount,
  };

  const systemInstruction = `You are CashFlow AI's proactive intelligence assistant.
Your task is to write a short, clear, executive weekly financial briefing (2-3 sentences max) based STRICTLY on the provided deterministic calculations.
CRITICAL RULES:
- Never calculate or alter numbers; use only the exact provided figures.
- Highlight positive budget discipline if on track, or call out at-risk categories.
- Keep the tone encouraging, professional, and actionable.`;

  const prompt = `Here are the user's deterministic financial facts for ${weekKey}:
${JSON.stringify(deterministicFacts, null, 2)}

Provide the structured JSON summary with a title, a 2-3 sentence summary, and a single one-line keyHighlight.`;

  let llmResult;
  try {
    llmResult = await callGemini({
      agentName: "proactive_agent",
      contents: prompt,
      systemInstruction,
      zodSchema: proactiveDigestSchema,
      userId,
    });
  } catch (err) {
    // Graceful fallback to deterministic phrasing if LLM is unavailable
    llmResult = {
      title: `Weekly Financial Summary (${weekKey})`,
      summary: `This week you spent ₹${wowAnalysis.totalCurrentWeek.toLocaleString("en-IN")} (${wowAnalysis.overallChangePct > 0 ? "+" : ""}${wowAnalysis.overallChangePct}% vs previous week). ${budgetAnalysis.filter((b) => b.status === "AT_RISK").length} budget(s) are currently at risk.`,
      keyHighlight: `Spent ₹${wowAnalysis.totalCurrentWeek.toLocaleString("en-IN")} across ${currentWeekTxs.length} transactions.`,
    };
  }

  // Idempotent upsert into Notification table
  const notification = await prisma.notification.upsert({
    where: {
      userId_type_weekKey: {
        userId,
        type: "WEEKLY_DIGEST",
        weekKey,
      },
    },
    update: {}, // do not mutate once recorded
    create: {
      userId,
      type: "WEEKLY_DIGEST",
      title: llmResult.title || `Weekly Financial Digest (${weekKey})`,
      body: llmResult.summary,
      dataJson: {
        keyHighlight: llmResult.keyHighlight,
        weekKey,
        burnRate: budgetAnalysis,
        weekOverWeek: wowAnalysis,
        anomaliesCount,
      },
      weekKey,
    },
  });

  return {
    skipped: false,
    created: true,
    weekKey,
    notification,
  };
}

module.exports = {
  getIsoWeekKey,
  computeBudgetBurnRate,
  computeWeekOverWeek,
  generateUserWeeklyDigest,
};
