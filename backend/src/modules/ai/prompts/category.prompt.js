const categoryPrompt = (transactions, categoryNames) => `
You are a financial AI.

Categorize each transaction into exactly one of these categories:
${JSON.stringify(categoryNames)}

Return ONLY valid JSON array, one entry per transaction, in the same order as given, using the "id" field to match.

Transactions:

${JSON.stringify(transactions)}

Expected Output:

[
  {
    "id": 0,
    "category": "Food"
  }
]
`;

module.exports = {
  categoryPrompt,
};