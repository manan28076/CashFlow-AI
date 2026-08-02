const routerPrompt = (message) => `
Classify the user's message into exactly one intent.

Intents:
- "DATA_QUERY": needs specific numbers/facts from their transaction data (spending, income, totals, anomalies, budget status, filters, dates).
- "GENERAL_ADVICE": general financial advice/tips, no specific personal data needed.

Return ONLY valid JSON.

Message: "${message}"

Expected Output:
{ "intent": "DATA_QUERY" }
`;

module.exports = {
  routerPrompt,
};