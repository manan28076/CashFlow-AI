const fraudPrompt = (transactions) => `
You are an AI fraud detection assistant.

Analyze these transactions for suspicious activity (duplicate charges, unusual amounts, odd timing, known scam patterns).

Return ONLY valid JSON. "flaggedIds" must contain the "id" values of suspicious transactions only.

Transactions:

${JSON.stringify(transactions)}

Expected Output:

{
  "risk": "LOW",
  "flaggedIds": [0, 4],
  "reason": "Two duplicate charges to the same merchant within a minute."
}
`;

module.exports = {
  fraudPrompt,
};