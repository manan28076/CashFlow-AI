const categoryPrompt = (transactions) => `
You are a financial AI.

Categorize each transaction.

Return ONLY valid JSON.

Transactions:

${JSON.stringify(transactions)}

Expected Output:

[
  {
    "merchant":"Swiggy",
    "category":"Food"
  }
]
`;

module.exports = {
  categoryPrompt,
};