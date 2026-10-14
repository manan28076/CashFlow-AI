const { z } = require("zod");
const { callGemini } = require("../services/gemini.service");
const { fraudPrompt } = require("../prompts/fraud.prompt");

const fraudOutputSchema = z.object({
  risk: z.enum(["LOW", "MEDIUM", "HIGH"]).default("LOW"),
  flaggedIds: z.array(z.number()).default([]),
  reason: z.string().default("All charges appear normal and verified."),
});

const fraudAgent = async (transactions, userId) => {
  if (!transactions || transactions.length === 0) {
    return { risk: "LOW", flaggedIds: [], reason: "No transactions to analyze." };
  }

  const prompt = fraudPrompt(transactions);
  const result = await callGemini({
    agentName: "fraud_agent",
    contents: prompt,
    zodSchema: fraudOutputSchema,
    userId,
  });

  return result.data;
};

module.exports = {
  fraudAgent,
  fraudOutputSchema,
};