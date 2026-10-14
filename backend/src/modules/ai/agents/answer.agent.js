const { z } = require("zod");
const { callGemini } = require("../services/gemini.service");
const { answerPrompt } = require("../prompts/answer.prompt");

const answerOutputSchema = z.object({
  answer: z.string(),
});

const answerAgent = async (question, rows, userId) => {
  const prompt = answerPrompt(question, rows);
  const result = await callGemini({
    agentName: "answer_agent",
    contents: prompt,
    zodSchema: answerOutputSchema,
    userId,
  });

  return result.data?.answer || "Based on your records, here are the results.";
};

module.exports = {
  answerAgent,
  answerOutputSchema,
};