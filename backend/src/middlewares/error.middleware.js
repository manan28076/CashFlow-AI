const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(err.isDuplicate && { isDuplicate: true, duplicateDetails: err.duplicateDetails }),
  });
};

module.exports = errorMiddleware;