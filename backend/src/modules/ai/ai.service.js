const { runAI } = require("./orchestrator");
const { sqlAgent } = require("./agents/sql.agent");
const { routerAgent } = require("./agents/router.agent");
const { answerAgent } = require("./agents/answer.agent");
const { askGemini } = require("./services/gemini.service");
const prisma = require("../../lib/prisma");

const testAI = async (transactions) => {
  return runAI(transactions);
};

const askQuestion = async (question, userId) => {
  const sql = await sqlAgent(question, userId);
  const rows = await prisma.$queryRawUnsafe(sql);

  return { question, sql, rows };
};

const chatWithAgent = async (message, userId) => {
  const intent = await routerAgent(message);

  if (intent === "DATA_QUERY") {
    const sql = await sqlAgent(message, userId);
    const rows = await prisma.$queryRawUnsafe(sql);
    const answer = await answerAgent(message, rows);

    return { intent, sql, rows, answer };
  }

  const answer = await askGemini(
    `You are a personal finance advisor. Give short, practical advice for: "${message}"`
  );

  return { intent, answer };
};

module.exports = {
  testAI,
  askQuestion,
  chatWithAgent,
};