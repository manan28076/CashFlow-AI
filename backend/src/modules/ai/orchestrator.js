const { categoryAgent } = require("./agents/category.agent");
const { insightAgent } = require("./agents/insight.agent");
const { budgetAgent } = require("./agents/budget.agent");
const { fraudAgent } = require("./agents/fraud.agent");
const { healthAgent } = require("./agents/health.agent");
const { getCategoryMap } = require("./utils/categoryMap");

const runAI = async (transactions, userId) => {
  const { names: categoryNames, nameToId } = await getCategoryMap();

  const indexed = transactions.map((t, i) => ({ id: i, ...t }));

  const [categories, insights, budget, fraud, health] =
    await Promise.all([
      categoryAgent(indexed, categoryNames, userId),
      insightAgent(indexed, userId),
      budgetAgent(indexed, userId),
      fraudAgent(indexed, userId),
      healthAgent(indexed, userId),
    ]);

  return { indexed, categories, insights, budget, fraud, health, nameToId };
};

module.exports = {
  runAI,
};