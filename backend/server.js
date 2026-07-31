const { PORT } = require("./src/config/env");
const app = require("./app");

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});