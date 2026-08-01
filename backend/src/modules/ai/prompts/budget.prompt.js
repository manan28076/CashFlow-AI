const budgetPrompt = (transactions) => `
You are an expert financial planner.

Analyze these transactions.

Return ONLY valid JSON.

Transactions:

${JSON.stringify(transactions)}

Example Output:

{
  "status":"OVER_BUDGET",
  "reason":"Food spending is unusually high.",
  "suggestion":"Reduce dining expenses by ₹2000 next month."
}
`;

module.exports = {
  budgetPrompt,
};