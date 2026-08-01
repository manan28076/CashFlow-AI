const insightPrompt = (transactions) => `
You are a financial analyst.

Analyze these transactions.

Return ONLY valid JSON.

Transactions:

${JSON.stringify(transactions)}

Example Output:

{
  "summary":"Most spending is on Food.",
  "topCategory":"Food",
  "recommendation":"Reduce food spending by 10%."
}
`;

module.exports = {
  insightPrompt,
};