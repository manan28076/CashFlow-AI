const fraudPrompt = (transactions) => `
You are an AI fraud detection assistant.

Analyze these transactions for suspicious activity.

Return ONLY valid JSON.

Transactions:

${JSON.stringify(transactions)}

Example Output:

{
  "risk":"LOW",
  "fraudDetected":false,
  "reason":"No suspicious transaction patterns found."
}
`;

module.exports = {
  fraudPrompt,
};