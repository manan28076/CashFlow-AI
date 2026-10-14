const { z } = require("zod");
const { callGemini } = require("../services/gemini.service");
const { categoryPrompt } = require("../prompts/category.prompt");

const categoryOutputSchema = z.array(
  z.object({
    id: z.number(),
    category: z.string(),
  })
);

const categoryAgent = async (transactions, categoryNames, userId) => {
  if (!transactions || transactions.length === 0) return [];

  const prompt = categoryPrompt(transactions, categoryNames);
  const result = await callGemini({
    agentName: "category_agent",
    contents: prompt,
    zodSchema: categoryOutputSchema,
    userId,
  });

  return result.data;
};

module.exports = {
  categoryAgent,
  categoryOutputSchema,
};