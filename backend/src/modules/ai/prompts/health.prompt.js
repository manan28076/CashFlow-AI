const healthPrompt = (transactions) => `
You are an AI financial health advisor.

Analyze these transactions and assign a financial health score.

Return ONLY valid JSON.

Transactions:

${JSON.stringify(transactions)}

Example Output:

{
  "score":82,
  "grade":"A",
  "reason":"Balanced spending with controlled discretionary expenses.",
  "advice":"Continue saving consistently and monitor entertainment expenses."
}
`;

module.exports = {
  healthPrompt,
};