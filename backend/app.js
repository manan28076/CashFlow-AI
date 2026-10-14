const categoryRoutes = require("./src/modules/category/category.routes");
const aiRoutes = require("./src/modules/ai/ai.routes");
const budgetRoutes = require("./src/modules/budget/budget.routes");
const dashboardRoutes = require("./src/modules/dashboard/dashboard.routes");
const transactionRoutes = require("./src/modules/transaction/transaction.routes");
const accountRoutes = require("./src/modules/account/account.routes");
const errorMiddleware = require("./src/middlewares/error.middleware");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const authRoutes = require("./src/modules/auth/auth.routes");
const importRoutes = require("./src/modules/import/import.routes");
const paymentRoutes = require("./src/modules/payment/payment.routes");
const app = express();

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/import", importRoutes);
app.use("/api/payment", paymentRoutes);
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CashFlow AI Backend Running 🚀",
  });
});
app.use(errorMiddleware);
module.exports = app;