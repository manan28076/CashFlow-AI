const { askGemini } = require("../services/gemini.service");
const { categoryPrompt } = require("../prompts/category.prompt");

const categoryAgent = async (transactions) => {
  const prompt = categoryPrompt(transactions);

  const response = await askGemini(prompt);

  const { safeParseJSON } = require("../utils/jsonParser");

return safeParseJSON(response);
};

module.exports = {
  categoryAgent,
};