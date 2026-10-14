const { z } = require("zod");
const { callGemini } = require("../services/gemini.service");
const { fraudPrompt } = require("../prompts/fraud.prompt");
const { detectAnomalies } = require("../utils/anomaly");

const fraudOutputSchema = z.object({
  risk: z.enum(["LOW", "MEDIUM", "HIGH"]).default("LOW"),
  flaggedIds: z.array(z.number()).default([]),
  reason: z.string().default("All charges appear normal and verified."),
  flags: z.array(z.any()).optional().default([]),
});

const fraudExplanationSchema = z.object({
  reason: z.string().describe("A concise 1-2 sentence explanation of the flagged anomalies"),
});

/**
 * Hybrid Anomaly Detection Agent
 *
 * 1. Statistics decide WHAT is flagged (Modified Z-Score, IQR, Duplicates)
 * 2. LLM ONLY writes human-readable explanation for already-flagged items
 * 3. The LLM can NEVER add or remove flags.
 */
const fraudAgent = async (transactions, userId) => {
  if (!transactions || transactions.length === 0) {
    return {
      risk: "LOW",
      flaggedIds: [],
      reason: "No transactions to analyze.",
      flags: [],
    };
  }

  // 1. Run deterministic statistical anomaly detection
  const anomalyResult = detectAnomalies(transactions);
  const flaggedIds = anomalyResult.flagged.map((f) => Number(f.id));

  // If no items were flagged by statistics, return immediately without wasting LLM tokens
  if (flaggedIds.length === 0) {
    return {
      risk: "LOW",
      flaggedIds: [],
      reason: "All charges appear normal and verified against category spending history.",
      flags: [],
    };
  }

  // 2. LLM writes human-readable explanation strictly for already-flagged items
  let explanation = anomalyResult.summary;
  try {
    const prompt = fraudPrompt(anomalyResult.flagged, anomalyResult.risk);
    const result = await callGemini({
      agentName: "fraud_agent",
      contents: prompt,
      zodSchema: fraudExplanationSchema,
      userId,
    });
    if (result?.data?.reason) {
      explanation = result.data.reason;
    }
  } catch (err) {
    // If LLM call fails, graceful fallback to deterministic summary
    explanation = anomalyResult.flagged.map((f) => f.reason).join("; ");
  }

  return {
    risk: anomalyResult.risk,
    flaggedIds, // STRICT: Statistics decide flags; LLM can NEVER add or remove flags
    reason: explanation,
    flags: anomalyResult.flagged, // Detailed explainable breakdown (numbers, median, mad, score, method)
  };
};

module.exports = {
  fraudAgent,
  fraudOutputSchema,
};