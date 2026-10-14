const { z } = require("zod");
const { callGemini } = require("../services/gemini.service");
const { insightPrompt } = require("../prompts/insight.prompt");

const insightOutputSchema = z.object({
  summary: z.string().default("No summary available."),
  topCategory: z.string().default("General"),
  recommendation: z.string().default("Continue monitoring expenses."),
});

const insightAgent = async (transactions, userId) => {
  if (!transactions || transactions.length === 0) {
    return {
      summary: "No transactions to analyze.",
      topCategory: "None",
      recommendation: "Add transactions to see insights.",
    };
  }

  const prompt = insightPrompt(transactions);
  const result = await callGemini({
    agentName: "insight_agent",
    contents: prompt,
    zodSchema: insightOutputSchema,
    userId,
  });

  return result.data;
};

module.exports = {
  insightAgent,
  insightOutputSchema,
};