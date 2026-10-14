const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/apiResponse");
const {
  createOrder,
  verifyPayment,
  getSubscriptionDetails,
  cancelSubscription,
} = require("./payment.service");

const createOrderHandler = asyncHandler(async (req, res) => {
  const { plan, billingCycle } = req.body;
  const result = await createOrder({
    userId: req.user.id,
    plan,
    billingCycle,
  });

  return res.status(200).json(
    new ApiResponse(200, "Order generated successfully", result)
  );
});

const verifyPaymentHandler = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const result = await verifyPayment({
    userId: req.user.id,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  return res.status(200).json(
    new ApiResponse(200, "Payment verified successfully. Plan activated!", result)
  );
});

const getSubscriptionHandler = asyncHandler(async (req, res) => {
  const result = await getSubscriptionDetails(req.user.id);
  return res.status(200).json(
    new ApiResponse(200, "Subscription details retrieved", result)
  );
});

const cancelSubscriptionHandler = asyncHandler(async (req, res) => {
  const updatedUser = await cancelSubscription(req.user.id);
  return res.status(200).json(
    new ApiResponse(200, "Subscription cancelled successfully", updatedUser)
  );
});

module.exports = {
  createOrderHandler,
  verifyPaymentHandler,
  getSubscriptionHandler,
  cancelSubscriptionHandler,
};
