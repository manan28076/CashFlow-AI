const { categoryAgent } = require("./agents/category.agent");
const { insightAgent } = require("./agents/insight.agent");
const { budgetAgent } = require("./agents/budget.agent");
const { fraudAgent } = require("./agents/fraud.agent");
const { healthAgent } = require("./agents/health.agent");

const runAI = async (transactions) => {
  const [categories, insights, budget, fraud, health] =
    await Promise.all([
      categoryAgent(transactions),
      insightAgent(transactions),
      budgetAgent(transactions),
      fraudAgent(transactions),
      healthAgent(transactions),
    ]);

  return {
    categories,
    insights,
    budget,
    fraud,
    health,
  };
};

module.exports = {
  runAI,
};