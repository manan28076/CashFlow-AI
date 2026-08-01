const AppError = require("../../../errors/AppError");

const handleAIError = (error) => {
  console.error(error);

  throw new AppError(
    "AI service is temporarily unavailable.",
    503
  );
};

module.exports = {
  handleAIError,
};