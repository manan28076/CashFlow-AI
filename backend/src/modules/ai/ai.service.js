const { runAI } = require("./orchestrator");

const testAI = async (transactions) => {
  const result = await runAI(transactions);

  return result;
};

module.exports = {
  testAI,
};