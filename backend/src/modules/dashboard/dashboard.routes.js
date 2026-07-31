const express = require("express");

const {
  summary,
  categoryBreakdown,
  recentTransactions,
  monthlyTrend,
} = require("./dashboard.controller");
const { protect } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.get("/summary", protect, summary);
router.get("/category-breakdown", protect, categoryBreakdown);
router.get("/recent-transactions", protect, recentTransactions);
router.get("/monthly-trend", protect, monthlyTrend);
module.exports = router;