/**
 * Robust Statistical Anomaly Detection Module
 *
 * Implements:
 * 1. Median + Median Absolute Deviation (MAD) Modified Z-Score (Iglewicz & Hoaglin, 1993)
 * 2. Tukey's IQR Outlier Detection fallback when MAD = 0
 * 3. Exact Duplicate Charge Detection within a sliding time window
 * 4. Strict Minimum History requirement (5 transactions per category)
 *
 * Pure module: No DB, No LLM.
 */

const { normalizeMerchant } = require("./normalizeMerchant");

// ==========================================
// NAMED CONSTANTS & THRESHOLDS (WITH RATIONALE)
// ==========================================

/**
 * Minimum history required per category before computing statistical anomalies.
 * Below this, we return "insufficient_history" to avoid false positives on small sample sizes.
 */
const MIN_CATEGORY_HISTORY = 5;

/**
 * Standard Boris Iglewicz and David Hoaglin (1993) outlier threshold for modified Z-score.
 * M_i = (0.6745 * |x - median|) / MAD > 3.5 indicates an outlier with high statistical confidence.
 */
const MODIFIED_Z_SCORE_THRESHOLD = 3.5;

/**
 * Consistency constant for Modified Z-Score: 1 / 1.4826 ~= 0.6745.
 * Makes MAD an unbiased estimator of standard deviation for normally distributed data.
 */
const MAD_CONSISTENCY_FACTOR = 0.6745;

/**
 * Standard Tukey IQR multiplier (Q3 + 1.5 * IQR) for fence cutoff.
 */
const IQR_MULTIPLIER = 1.5;

/**
 * Multiplier above median when variance is completely zero (MAD = 0 and IQR = 0).
 * e.g., if a user paid 100 for 5 consecutive transactions, an amount >= 300 (3x) is flagged.
 */
const ZERO_VARIANCE_MULTIPLIER = 3.0;

/**
 * Sliding window for exact duplicate charge detection (in milliseconds).
 * 24 hours = 24 * 60 * 60 * 1000 ms.
 */
const DUPLICATE_TIME_WINDOW_MS = 24 * 60 * 60 * 1000;

// ==========================================
// PURE MATHEMATICAL FUNCTIONS
// ==========================================

/**
 * Compute the median of a numerical array.
 * @param {number[]} values
 * @returns {number}
 */
const calculateMedian = (values) => {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

/**
 * Compute the Median Absolute Deviation (MAD).
 * MAD = median(|x_i - median(x)|)
 * @param {number[]} values
 * @param {number} [median]
 * @returns {number}
 */
const calculateMAD = (values, median) => {
  if (!values || values.length === 0) return 0;
  const med = median !== undefined ? median : calculateMedian(values);
  const absDeviations = values.map((v) => Math.abs(v - med));
  return calculateMedian(absDeviations);
};

/**
 * Compute percentile using linear interpolation between closest ranks.
 * @param {number[]} sortedValues - Array already sorted ascending
 * @param {number} p - Percentile between 0 and 1 (e.g. 0.25, 0.75)
 * @returns {number}
 */
const calculatePercentile = (sortedValues, p) => {
  if (!sortedValues || sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];

  const index = (sortedValues.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) return sortedValues[lower];
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
};

// ==========================================
// CORE ANOMALY DETECTION ENGINE
// ==========================================

/**
 * Pure statistical anomaly detection per user per category.
 *
 * @param {Array<{
 *   id: number|string,
 *   amount: number,
 *   category?: string,
 *   categoryId?: string,
 *   merchant?: string,
 *   description?: string,
 *   date?: string|Date,
 *   type?: string
 * }>} transactions
 * @returns {{
 *   flagged: Array<{
 *     id: number|string,
 *     transactionIndex: number|string,
 *     method: 'zscore' | 'iqr' | 'duplicate',
 *     score: number,
 *     numbers: { amount: number, median?: number, mad?: number, q1?: number, q3?: number, iqr?: number, duplicateOfId?: number|string },
 *     reason: string
 *   }>,
 *   insufficientHistoryCategories: string[],
 *   risk: 'LOW' | 'MEDIUM' | 'HIGH',
 *   summary: string
 * }}
 */
const detectAnomalies = (transactions) => {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      flagged: [],
      insufficientHistoryCategories: [],
      risk: "LOW",
      summary: "No transactions to analyze.",
    };
  }

  const flagged = [];
  const flaggedIds = new Set();

  // 1. Detect Exact Duplicates (Same amount + normalized merchant/description + within 24h window)
  const seenTransactions = [];
  for (const tx of transactions) {
    const amt = Number(tx.amount) || 0;
    const rawMerchant = tx.merchant || tx.description || "";
    const merchantKey = normalizeMerchant(rawMerchant) || rawMerchant.trim().toLowerCase();
    const txDate = tx.date ? new Date(tx.date).getTime() : 0;

    for (const prev of seenTransactions) {
      if (
        Math.abs(prev.amount - amt) < 0.01 &&
        prev.merchantKey === merchantKey &&
        merchantKey.length > 0
      ) {
        // Check date window if dates are valid
        const timeDiff = Math.abs(prev.txDate - txDate);
        const withinWindow = !txDate || !prev.txDate || timeDiff <= DUPLICATE_TIME_WINDOW_MS;

        if (withinWindow && !flaggedIds.has(tx.id)) {
          flaggedIds.add(tx.id);
          flagged.push({
            id: tx.id,
            transactionIndex: tx.id,
            method: "duplicate",
            score: 1.0,
            numbers: {
              amount: amt,
              duplicateOfId: prev.id,
            },
            reason: `Exact duplicate charge of ₹${amt.toLocaleString("en-IN")} matching previous charge (ID: ${prev.id}) on ${rawMerchant}`,
          });
          break;
        }
      }
    }

    seenTransactions.push({
      id: tx.id,
      amount: amt,
      merchantKey,
      txDate,
    });
  }

  // 2. Group transactions by category for statistical anomaly detection
  const categoryGroups = new Map();
  for (const tx of transactions) {
    const cat = String(tx.category || tx.categoryId || "General").trim();
    if (!categoryGroups.has(cat)) {
      categoryGroups.set(cat, []);
    }
    categoryGroups.get(cat).push(tx);
  }

  const insufficientHistoryCategories = [];

  for (const [categoryName, items] of categoryGroups.entries()) {
    // Check minimum category history
    if (items.length < MIN_CATEGORY_HISTORY) {
      insufficientHistoryCategories.push(categoryName);
      continue;
    }

    const amounts = items.map((i) => Number(i.amount) || 0);
    const median = calculateMedian(amounts);
    const mad = calculateMAD(amounts, median);

    const sortedAmounts = [...amounts].sort((a, b) => a - b);
    const q1 = calculatePercentile(sortedAmounts, 0.25);
    const q3 = calculatePercentile(sortedAmounts, 0.75);
    const iqr = q3 - q1;

    for (const tx of items) {
      if (flaggedIds.has(tx.id)) continue; // Already flagged as duplicate

      const amt = Number(tx.amount) || 0;
      // We only flag unusually high expenses/debits
      if (amt <= median) continue;

      if (mad > 0) {
        // Path A: Modified Z-Score
        const diff = Math.abs(amt - median);
        const modifiedZScore = (MAD_CONSISTENCY_FACTOR * diff) / mad;

        if (modifiedZScore > MODIFIED_Z_SCORE_THRESHOLD) {
          flaggedIds.add(tx.id);
          flagged.push({
            id: tx.id,
            transactionIndex: tx.id,
            method: "zscore",
            score: Number(modifiedZScore.toFixed(2)),
            numbers: {
              amount: amt,
              median: Number(median.toFixed(2)),
              mad: Number(mad.toFixed(2)),
            },
            reason: `Amount ₹${amt.toLocaleString("en-IN")} is significantly above category median ₹${median.toFixed(0)} (Modified Z-Score: ${modifiedZScore.toFixed(2)} > ${MODIFIED_Z_SCORE_THRESHOLD})`,
          });
        }
      } else {
        // Path B: Fallback to IQR rule when MAD = 0 (e.g. repeated same amounts)
        if (iqr > 0) {
          const iqrCutoff = q3 + IQR_MULTIPLIER * iqr;
          if (amt > iqrCutoff) {
            const iqrScore = (amt - q3) / iqr;
            flaggedIds.add(tx.id);
            flagged.push({
              id: tx.id,
              transactionIndex: tx.id,
              method: "iqr",
              score: Number(iqrScore.toFixed(2)),
              numbers: {
                amount: amt,
                median: Number(median.toFixed(2)),
                mad: 0,
                q1: Number(q1.toFixed(2)),
                q3: Number(q3.toFixed(2)),
                iqr: Number(iqr.toFixed(2)),
              },
              reason: `Amount ₹${amt.toLocaleString("en-IN")} exceeds IQR boundary cutoff ₹${iqrCutoff.toFixed(0)} with zero MAD`,
            });
          }
        } else {
          // Both MAD = 0 and IQR = 0 (all or >75% transactions are identical)
          const zeroVarCutoff = median * ZERO_VARIANCE_MULTIPLIER;
          if (amt >= zeroVarCutoff) {
            const score = amt / (median || 1);
            flaggedIds.add(tx.id);
            flagged.push({
              id: tx.id,
              transactionIndex: tx.id,
              method: "iqr",
              score: Number(score.toFixed(2)),
              numbers: {
                amount: amt,
                median: Number(median.toFixed(2)),
                mad: 0,
                zeroVarCutoff: Number(zeroVarCutoff.toFixed(2)),
              },
              reason: `Amount ₹${amt.toLocaleString("en-IN")} is ${score.toFixed(1)}x greater than constant category norm ₹${median.toFixed(0)}`,
            });
          }
        }
      }
    }
  }

  // Determine overall risk
  let risk = "LOW";
  if (flagged.length > 2 || flagged.some((f) => f.score >= 6.0)) {
    risk = "HIGH";
  } else if (flagged.length > 0) {
    risk = "MEDIUM";
  }

  const summary =
    flagged.length > 0
      ? `Flagged ${flagged.length} unusual transaction(s) requiring review.`
      : "All transactions verified. No anomalous debits or duplicates detected.";

  return {
    flagged,
    insufficientHistoryCategories,
    risk,
    summary,
  };
};

module.exports = {
  detectAnomalies,
  calculateMedian,
  calculateMAD,
  calculatePercentile,
  MIN_CATEGORY_HISTORY,
  MODIFIED_Z_SCORE_THRESHOLD,
  MAD_CONSISTENCY_FACTOR,
  IQR_MULTIPLIER,
  ZERO_VARIANCE_MULTIPLIER,
  DUPLICATE_TIME_WINDOW_MS,
};
