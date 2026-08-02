const FORBIDDEN = [
  "insert",
  "update",
  "delete",
  "drop",
  "alter",
  "truncate",
  "create",
  "grant",
  "revoke",
  "--",
  ";",
];

const assertSafeSelect = (sql, userId) => {
  const trimmed = sql.trim();
  const lower = trimmed.toLowerCase();

  if (!lower.startsWith("select")) {
    throw new Error("Only SELECT queries are allowed.");
  }

  for (const word of FORBIDDEN) {
    if (lower.includes(word)) {
      throw new Error(`Query contains forbidden keyword: ${word}`);
    }
  }

  if (!trimmed.includes(userId)) {
    throw new Error("Query is missing required user scoping.");
  }

  return trimmed;
};

module.exports = {
  assertSafeSelect,
};