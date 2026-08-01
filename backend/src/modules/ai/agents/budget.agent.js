const { askGemini } = require("../services/gemini.service");
const { budgetPrompt } = require("../prompts/budget.prompt");

const budgetAgent = async (transactions) => {
  const prompt = budgetPrompt(transactions);

  const response = await askGemini(prompt);

  const { safeParseJSON } = require("../utils/jsonParser");

return safeParseJSON(response);
};

module.exports = {
  budgetAgent,
};