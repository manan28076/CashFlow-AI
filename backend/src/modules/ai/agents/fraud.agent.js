const { askGemini } = require("../services/gemini.service");
const { fraudPrompt } = require("../prompts/fraud.prompt");
const { safeParseJSON } = require("../utils/jsonParser");

const fraudAgent = async (transactions) => {
  const prompt = fraudPrompt(transactions);
  const response = await askGemini(prompt);
  return safeParseJSON(response);
};

module.exports = {
  fraudAgent,
};