const { PORT } = require("./src/config/env");
const app = require("./app");
const { initSubscriptionCron } = require("./src/jobs/subscriptionCron");
const { initProactiveCron } = require("./src/jobs/proactiveCron");

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  initSubscriptionCron();
  initProactiveCron();
});