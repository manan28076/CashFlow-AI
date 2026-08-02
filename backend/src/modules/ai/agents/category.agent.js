const { askGemini } = require("../services/gemini.service");
const { categoryPrompt } = require("../prompts/category.prompt");
const { safeParseJSON } = require("../utils/jsonParser");

const categoryAgent = async (transactions, categoryNames) => {
  const prompt = categoryPrompt(transactions, categoryNames);
  const response = await askGemini(prompt);
  return safeParseJSON(response);
};

module.exports = {
  categoryAgent,
};