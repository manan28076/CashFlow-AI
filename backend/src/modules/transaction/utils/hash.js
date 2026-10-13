const crypto = require("crypto");

/**
 * Standardized hash generator for financial transactions:
 * sha256(YYYY-MM-DD|amount.toFixed(2)|type|lowercased description|occurrence)
 */
const computeTransactionHash = (dateStr, amount, type, description, occurrence = 1) => {
  const normDate = new Date(dateStr).toISOString().split("T")[0];
  const normDesc = (description || "").toLowerCase().trim();
  const normAmt = Number(amount).toFixed(2);
  const payload = `${normDate}|${normAmt}|${type}|${normDesc}|${occurrence}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
};

module.exports = {
  computeTransactionHash,
};
