const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/apiResponse");

const {
  getSummary,
  getCategoryBreakdown,
  getRecentTransactions,
  getMonthlyTrend,
} = require("./dashboard.service");

const summary = asyncHandler(async (req, res) => {
  const data = await getSummary(req.user.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      "Dashboard summary fetched successfully",
      data
    )
  );
});
const categoryBreakdown = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const data = await getCategoryBreakdown(req.user.id, month, year);

  return res.status(200).json(
    new ApiResponse(
      200,
      "Category breakdown fetched successfully",
      data
    )
  );
});
const recentTransactions = asyncHandler(async (req, res) => {
  const data = await getRecentTransactions(req.user.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      "Recent transactions fetched successfully",
      data
    )
  );
});
const monthlyTrend = asyncHandler(async (req, res) => {
  const data = await getMonthlyTrend(req.user.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      "Monthly trend fetched successfully",
      data
    )
  );
});
module.exports = {
  summary,
  categoryBreakdown,
  recentTransactions,
  monthlyTrend,
};