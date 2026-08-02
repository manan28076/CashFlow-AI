const { askGemini } = require("../services/gemini.service");
const { answerPrompt } = require("../prompts/answer.prompt");
const { safeParseJSON } = require("../utils/jsonParser");

const answerAgent = async (question, rows) => {
  const prompt = answerPrompt(question, rows);
  const response = await askGemini(prompt);
  const { answer } = safeParseJSON(response);

  return answer;
};

module.exports = {
  answerAgent,
};