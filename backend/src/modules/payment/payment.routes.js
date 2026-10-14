const express = require("express");
const { protect } = require("../../middlewares/auth.middleware");
const {
  createOrderHandler,
  verifyPaymentHandler,
  getSubscriptionHandler,
  cancelSubscriptionHandler,
} = require("./payment.controller");

const router = express.Router();

// All payment operations require authentication
router.use(protect);

router.post("/create-order", createOrderHandler);
router.post("/verify-payment", verifyPaymentHandler);
router.get("/subscription", getSubscriptionHandler);
router.post("/cancel", cancelSubscriptionHandler);

module.exports = router;
