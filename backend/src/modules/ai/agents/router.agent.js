const { askGemini } = require("../services/gemini.service");
const { routerPrompt } = require("../prompts/router.prompt");
const { safeParseJSON } = require("../utils/jsonParser");

const routerAgent = async (message) => {
  const prompt = routerPrompt(message);
  const response = await askGemini(prompt);
  const { intent } = safeParseJSON(response);

  return intent === "DATA_QUERY" ? "DATA_QUERY" : "GENERAL_ADVICE";
};

module.exports = {
  routerAgent,
};