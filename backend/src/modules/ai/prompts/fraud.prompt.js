/**
 * Prompt for synthesizing human-readable explanation of already-flagged statistical anomalies.
 * The LLM does NOT decide what to flag; it only explains the already-computed statistical findings.
 */
const fraudPrompt = (flaggedItems, overallRisk) => `
You are a financial security assistant explaining flagged unusual transactions to a user.

The following transactions were flagged as suspicious or anomalous by our statistical engine:
${JSON.stringify(flaggedItems, null, 2)}

Overall Risk Level: ${overallRisk}

Provide a concise, professional, 1 to 2 sentence explanation of why these transactions are suspicious (mentioning specific merchants and why they deviate or appear duplicated).

Expected Output:
{
  "reason": "Flagged 1 duplicate charge to Swiggy and an unusually large debit of ₹45,000 on Electronics far exceeding your usual category median."
}
`;

module.exports = {
  fraudPrompt,
};