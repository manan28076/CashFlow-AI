const { z } = require("zod");
const { callGemini } = require("../services/gemini.service");
const { sqlPrompt } = require("../prompts/sql.prompt");
const { assertSafeSelect } = require("../utils/sqlGuard");

const sqlOutputSchema = z.object({
  sql: z.string(),
});

const sqlAgent = async (question, userId) => {
  const prompt = sqlPrompt(question, userId);
  const result = await callGemini({
    agentName: "sql_agent",
    contents: prompt,
    zodSchema: sqlOutputSchema,
    userId,
  });

  return assertSafeSelect(result.data.sql, userId);
};

module.exports = {
  sqlAgent,
  sqlOutputSchema,
};