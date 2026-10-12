const AppError = require("../../../errors/AppError");

const handleAIError = (error) => {
  console.error("Gemini AI Error:", error);

  const detail = error?.message || error?.toString() || "Unknown AI error";
  throw new AppError(
    `AI service error: ${detail}`,
    503
  );
};

module.exports = {
  handleAIError,
};