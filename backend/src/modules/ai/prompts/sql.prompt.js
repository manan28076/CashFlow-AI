const SCHEMA = `
Table "Account" (id TEXT, name TEXT, bankName TEXT, userId TEXT, createdAt TIMESTAMP)
Table "Category" (id TEXT, name TEXT)
Table "Transaction" (id TEXT, date TIMESTAMP, description TEXT, merchant TEXT, note TEXT, amount FLOAT, type TEXT CHECK(type IN ('INCOME','EXPENSE')), "isAnomaly" BOOLEAN, "accountId" TEXT, "categoryId" TEXT)
Table "Budget" (id TEXT, amount FLOAT, month INT, year INT, userId TEXT, "categoryId" TEXT)
`;

const sqlPrompt = (question, userId) => `
You are a PostgreSQL expert. Convert the question into ONE safe, read-only SELECT query.

Schema:
${SCHEMA}

Rules:
- Only SELECT statements. No INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, or multiple statements.
- "Transaction" always joins to "Account" on "accountId" = "Account".id.
- Every query MUST restrict to this user only, using: "Account".userId = '${userId}' (join Budget directly on Budget.userId = '${userId}' if querying Budget).
- Quote all table and column names exactly as given (they are camelCase / mixed case).
- Return ONLY valid JSON, nothing else.

Question: "${question}"

Expected Output:
{
  "sql": "SELECT ... FROM \\"Transaction\\" t JOIN \\"Account\\" a ON t.\\"accountId\\" = a.id WHERE a.\\"userId\\" = '${userId}' ..."
}
`;

module.exports = {
  sqlPrompt,
};