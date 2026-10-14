const express = require("express");
const { protect } = require("../../middlewares/auth.middleware");
const {
  createOrderHandler,
  verifyPaymentHandler,
  getSubscriptionHandler,
  cancelSubscriptionHandler,
  webhookHandler,
} = require("./payment.controller");

const router = express.Router();

// 1. Razorpay server-to-server webhook endpoint (Verified via HMAC-SHA256 signature, not JWT)
router.post("/webhook", webhookHandler);

// 2. User-authenticated payment operations
router.use(protect);

router.post("/create-order", createOrderHandler);
router.post("/verify-payment", verifyPaymentHandler);
router.get("/subscription", getSubscriptionHandler);
router.post("/cancel", cancelSubscriptionHandler);

module.exports = router;
