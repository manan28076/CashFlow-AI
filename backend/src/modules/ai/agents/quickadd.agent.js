const { askGeminiStructured } = require("../services/gemini.service");
const { safeParseJSON } = require("../utils/jsonParser");

const parseQuickAddPrompt = async (text, categoryNames) => {
  const todayStr = new Date().toISOString().split("T")[0];

  const prompt = `
You are a smart financial transaction parser.
Today's date is ${todayStr}.
Allowed categories: ${JSON.stringify(categoryNames)}

Given this user input representing a financial transaction (e.g., "zomato 450", "chai 40 yesterday", "got 5000 from dad", "salary 50000"):
User input: "${text}"

Extract:
1. amount: positive number
2. type: "EXPENSE" or "INCOME" (e.g. received/got/salary/credit is INCOME; spent/paid/bought/zomato/chai is EXPENSE)
3. category: exactly one of the allowed categories that best fits (default to "Food" for food or "Other" if unclear)
4. description: clean readable description / merchant name (e.g. "Zomato", "Chai", "Gift from Dad")
5. date: "YYYY-MM-DD" (if user mentions "yesterday", "2 days ago", or a specific date, calculate it relative to today ${todayStr}; otherwise default to ${todayStr})

Return strictly valid JSON:
{
  "amount": 450,
  "type": "EXPENSE",
  "category": "Food",
  "description": "Zomato",
  "date": "${todayStr}"
}
`;

  const raw = await askGeminiStructured({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    jsonMode: true,
    temperature: 0,
  });

  return safeParseJSON(raw);
};

module.exports = {
  parseQuickAddPrompt,
};
