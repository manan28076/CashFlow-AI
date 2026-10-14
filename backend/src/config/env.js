const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
    PORT: process.env.PORT || 5000,
    JWT_SECRET: process.env.JWT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET,
    AI_PRICE_PER_1M_INPUT_TOKENS: process.env.AI_PRICE_PER_1M_INPUT_TOKENS ? Number(process.env.AI_PRICE_PER_1M_INPUT_TOKENS) : null,
    AI_PRICE_PER_1M_OUTPUT_TOKENS: process.env.AI_PRICE_PER_1M_OUTPUT_TOKENS ? Number(process.env.AI_PRICE_PER_1M_OUTPUT_TOKENS) : null,
    AI_CALL_TIMEOUT_MS: process.env.AI_CALL_TIMEOUT_MS ? Number(process.env.AI_CALL_TIMEOUT_MS) : 20000,
    AI_PROACTIVE_ENABLED: process.env.AI_PROACTIVE_ENABLED === "true",
    AI_WEEKLY_CRON: process.env.AI_WEEKLY_CRON || "0 9 * * 1",
    AI_PROACTIVE_CRON_SECRET: process.env.AI_PROACTIVE_CRON_SECRET || process.env.ADMIN_API_KEY || process.env.JWT_SECRET,
};