const answerPrompt = (question, rows) => `
You are a financial assistant. Answer the user's question in one short, clear sentence using ONLY the data below. Use ₹ for amounts.

Question: "${question}"

Data:
${JSON.stringify(rows)}

Return ONLY valid JSON.

Expected Output:
{ "answer": "You spent ₹1200 on Food last month." }
`;

module.exports = {
  answerPrompt,
};