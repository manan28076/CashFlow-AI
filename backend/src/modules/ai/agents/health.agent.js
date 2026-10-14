const { z } = require("zod");
const { callGemini } = require("../services/gemini.service");
const { healthPrompt } = require("../prompts/health.prompt");

const healthOutputSchema = z.object({
  score: z.number().min(0).max(100).default(75),
  grade: z.string().default("B"),
  reason: z.string().default("Balanced spending with controlled discretionary expenses."),
  advice: z.string().default("Continue saving consistently and monitor expenses."),
});

const healthAgent = async (transactions, userId) => {
  if (!transactions || transactions.length === 0) {
    return {
      score: 75,
      grade: "B",
      reason: "No transactions recorded yet to assess health.",
      advice: "Add transactions to calculate your personalized financial score.",
    };
  }

  const prompt = healthPrompt(transactions);
  const result = await callGemini({
    agentName: "health_agent",
    contents: prompt,
    zodSchema: healthOutputSchema,
    userId,
  });

  return result.data;
};

module.exports = {
  healthAgent,
  healthOutputSchema,
};