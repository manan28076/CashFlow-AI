const { askGemini } = require("../services/gemini.service");
const { insightPrompt } = require("../prompts/insight.prompt");

const insightAgent = async (transactions) => {
  const prompt = insightPrompt(transactions);

  const response = await askGemini(prompt);

  const { safeParseJSON } = require("../utils/jsonParser");

return safeParseJSON(response);
};

module.exports = {
  insightAgent,
};