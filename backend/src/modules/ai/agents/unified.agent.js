const { askGeminiStructured } = require("../services/gemini.service");
const { safeParseJSON } = require("../utils/jsonParser");
const { assertSafeSelect } = require("../utils/sqlGuard");

const SCHEMA = `
Table "Account" (id TEXT, name TEXT, bankName TEXT, userId TEXT, createdAt TIMESTAMP)
Table "Category" (id TEXT, name TEXT, type TEXT CHECK(type IN ('INCOME','EXPENSE')))
Table "Transaction" (id TEXT, date TIMESTAMP, description TEXT, merchant TEXT, note TEXT, amount FLOAT, type TEXT CHECK(type IN ('INCOME','EXPENSE')), "isAnomaly" BOOLEAN, "accountId" TEXT, "categoryId" TEXT)
Table "Budget" (id TEXT, amount FLOAT, month INT, year INT, userId TEXT, "categoryId" TEXT)
`;

const unifiedPrompt = (message, userId) => `
You are a financial AI Copilot for CashFlow AI with direct read access to a PostgreSQL database.
Database Schema:
${SCHEMA}

Current User ID: "${userId}"
User Message: "${message}"

Task:
1. Determine if this message is a "DATA_QUERY" or "GENERAL_ADVICE".
   - "DATA_QUERY": needs specific numbers, totals, categories, trends, anomalies, or facts from their accounts/transactions/budgets.
   - "GENERAL_ADVICE": general financial tips, rules of thumb (e.g. 50/30/20, emergency funds, investment basics), definitions, or guidance that does not require database records.

2. If "DATA_QUERY":
   - Generate ONE safe, read-only SELECT query in PostgreSQL.
   - "Transaction" always joins to "Account" on "accountId" = "Account".id.
   - Every query MUST restrict to this user only: "Account".userId = '${userId}' (join Budget directly on Budget.userId = '${userId}' if querying Budget).
   - Quote all table and column names exactly as shown (they are mixed case / camelCase).
   - Format: { "intent": "DATA_QUERY", "sql": "SELECT ...", "answer": null }

3. If "GENERAL_ADVICE":
   - Provide a concise, clear, and practical financial answer (2-4 sentences max, professional tone).
   - Format: { "intent": "GENERAL_ADVICE", "sql": null, "answer": "..." }

Return strictly valid JSON:
{
  "intent": "DATA_QUERY",
  "sql": "SELECT ... FROM \\"Transaction\\" t JOIN \\"Account\\" a ON t.\\"accountId\\" = a.id WHERE a.\\"userId\\" = '${userId}' ...",
  "answer": null
}
`;

const unifiedAgent = async (message, userId) => {
  const prompt = unifiedPrompt(message, userId);
  const raw = await askGeminiStructured({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    jsonMode: true,
    temperature: 0,
  });

  const parsed = safeParseJSON(raw);
  const intent = parsed?.intent === "DATA_QUERY" ? "DATA_QUERY" : "GENERAL_ADVICE";

  if (intent === "DATA_QUERY" && parsed?.sql) {
    const safeSql = assertSafeSelect(parsed.sql, userId);
    return {
      intent: "DATA_QUERY",
      sql: safeSql,
      answer: null,
    };
  }

  return {
    intent: "GENERAL_ADVICE",
    sql: null,
    answer: parsed?.answer || "Here is practical advice for managing your cash flow effectively: track every expense regularly, automate savings first, and review high spending categories each month.",
  };
};

module.exports = {
  unifiedAgent,
};
