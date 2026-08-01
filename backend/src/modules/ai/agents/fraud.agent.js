const { askGemini } = require("../services/gemini.service");
const { fraudPrompt } = require("../prompts/fraud.prompt");

const fraudAgent = async (transactions) => {
  const prompt = fraudPrompt(transactions);

  const response = await askGemini(prompt);

  const { safeParseJSON } = require("../utils/jsonParser");

return safeParseJSON(response);
};

module.exports = {
  fraudAgent,
};