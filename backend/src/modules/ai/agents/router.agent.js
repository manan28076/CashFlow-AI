const { z } = require("zod");
const { callGemini } = require("../services/gemini.service");
const { routerPrompt } = require("../prompts/router.prompt");

const routerOutputSchema = z.object({
  intent: z.enum(["DATA_QUERY", "GENERAL_ADVICE"]).default("GENERAL_ADVICE"),
});

const routerAgent = async (message, userId) => {
  const prompt = routerPrompt(message);
  const result = await callGemini({
    agentName: "router_agent",
    contents: prompt,
    zodSchema: routerOutputSchema,
    userId,
  });

  return result.data?.intent === "DATA_QUERY" ? "DATA_QUERY" : "GENERAL_ADVICE";
};

module.exports = {
  routerAgent,
  routerOutputSchema,
};