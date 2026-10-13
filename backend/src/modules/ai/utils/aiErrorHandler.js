const AppError = require("../../../errors/AppError");

const handleAIError = (error) => {
  console.error("Gemini AI Error:", error);

  const raw = error?.message || error?.toString() || "";
  let message = "AI service is temporarily busy. Please try asking again in a moment.";

  if (raw.includes("503") || raw.includes("high demand") || raw.includes("UNAVAILABLE")) {
    message = "Google AI is experiencing temporary high traffic. Please try asking again in a few seconds.";
  } else if (raw.includes("429") || raw.includes("quota") || raw.includes("RESOURCE_EXHAUSTED")) {
    message = "AI request rate limit reached. Please wait a few seconds and try again.";
  } else if (error?.message && !error.message.startsWith("{")) {
    message = `AI error: ${error.message}`;
  }

  throw new AppError(message, 503);
};

module.exports = {
  handleAIError,
};