const { rateLimit } = require("express-rate-limit");

const aiAgentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 30, // 30 requests per minute
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many AI agent requests. Please slow down and try again after a minute.",
  },
});

module.exports = {
  aiAgentLimiter,
};
