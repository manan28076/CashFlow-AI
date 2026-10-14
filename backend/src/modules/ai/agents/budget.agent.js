const { z } = require("zod");
const { callGemini } = require("../services/gemini.service");
const { budgetPrompt } = require("../prompts/budget.prompt");

const budgetOutputSchema = z.object({
  status: z.string().default("ON_TRACK"),
  reason: z.string().default("Spending is within normal parameters."),
  suggestion: z.string().default("Maintain your current savings pace."),
});

const budgetAgent = async (transactions, userId) => {
  if (!transactions || transactions.length === 0) {
    return {
      status: "ON_TRACK",
      reason: "No transactions to analyze.",
      suggestion: "Add transactions to calculate budget status.",
    };
  }

  const prompt = budgetPrompt(transactions);
  const result = await callGemini({
    agentName: "budget_agent",
    contents: prompt,
    zodSchema: budgetOutputSchema,
    userId,
  });

  return result.data;
};

module.exports = {
  budgetAgent,
  budgetOutputSchema,
};