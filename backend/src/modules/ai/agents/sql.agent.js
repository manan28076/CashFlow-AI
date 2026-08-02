const { askGemini } = require("../services/gemini.service");
const { sqlPrompt } = require("../prompts/sql.prompt");
const { safeParseJSON } = require("../utils/jsonParser");
const { assertSafeSelect } = require("../utils/sqlGuard");

const sqlAgent = async (question, userId) => {
  const prompt = sqlPrompt(question, userId);
  const response = await askGemini(prompt);
  const { sql } = safeParseJSON(response);

  return assertSafeSelect(sql, userId);
};

module.exports = {
  sqlAgent,
};