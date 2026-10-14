const { categoryAgent } = require("./agents/category.agent");
const { insightAgent } = require("./agents/insight.agent");
const { budgetAgent } = require("./agents/budget.agent");
const { fraudAgent } = require("./agents/fraud.agent");
const { healthAgent } = require("./agents/health.agent");
const { getCategoryMap } = require("./utils/categoryMap");

const runAI = async (transactions, userId) => {
  const { names: categoryNames, nameToId } = await getCategoryMap();

  const indexed = transactions.map((t, i) => ({ id: i, ...t }));

  const [categoryResult, insights, budget, fraud, health] =
    await Promise.all([
      categoryAgent(indexed, categoryNames, userId),
      insightAgent(indexed, userId),
      budgetAgent(indexed, userId),
      fraudAgent(indexed, userId),
      healthAgent(indexed, userId),
    ]);

  const categories = categoryResult?.categories || (Array.isArray(categoryResult) ? categoryResult : []);
  const categorizedFromMemory = categoryResult?.categorizedFromMemory ?? 0;
  const categorizedByLlm = categoryResult?.categorizedByLlm ?? (Array.isArray(categoryResult) ? categoryResult.length : 0);

  return {
    indexed,
    categories,
    insights,
    budget,
    fraud,
    health,
    nameToId,
    categorizedFromMemory,
    categorizedByLlm,
  };
};

module.exports = {
  runAI,
};