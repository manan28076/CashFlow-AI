const { PORT } = require("./src/config/env");
const app = require("./app");
const { initSubscriptionCron } = require("./src/jobs/subscriptionCron");

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  initSubscriptionCron();
});