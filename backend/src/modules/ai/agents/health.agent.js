const { askGemini } = require("../services/gemini.service");
const { healthPrompt } = require("../prompts/health.prompt");

const healthAgent = async (transactions) => {
  const prompt = healthPrompt(transactions);

  const response = await askGemini(prompt);

  const { safeParseJSON } = require("../utils/jsonParser");

return safeParseJSON(response);
};

module.exports = {
  healthAgent,
};