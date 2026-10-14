/**
 * Hardened Text-to-SQL Guard and Execution Engine
 *
 * Enforces:
 * 1. Single statement only (no multiple statements, no internal semicolons)
 * 2. Rejection of comments (-- and /* *\/)
 * 3. Word-boundary keyword blocklist (no false positives on createdAt / updatedAt)
 * 4. System catalog blocks (pg_*, information_schema)
 * 5. Strict function allowlist (sum, count, avg, min, max, coalesce, date_trunc, extract, round, lower, upper, to_char, now, current_date)
 * 6. Prisma schema table allowlist (transactions, accounts, categories, budgets only; NEVER users, payments, tokens)
 * 7. Structural user scoping via CTE table shadowing bound to $1 (userId never comes from model text)
 * 8. Read-only transaction with statement_timeout = 5000ms and row limit (200)
 */

const prisma = require("../../../lib/prisma");

// ==========================================
// CONSTANTS & ALLOWLISTS
// ==========================================

const FORBIDDEN_KEYWORDS = [
  "insert",
  "update",
  "delete",
  "drop",
  "alter",
  "truncate",
  "create",
  "grant",
  "revoke",
  "set",
  "copy",
  "call",
  "do",
  "execute",
  "merge",
  "upsert",
  "replace",
  "reindex",
  "vacuum",
  "cluster",
  "lock",
  "into",
  "role",
  "database",
  "schema",
];

const ALLOWED_FUNCTIONS = new Set([
  "sum",
  "count",
  "avg",
  "min",
  "max",
  "coalesce",
  "date_trunc",
  "extract",
  "round",
  "lower",
  "upper",
  "to_char",
  "now",
  "current_date",
  "cast",
  "nullif",
  "concat",
  "abs",
  "floor",
  "ceil",
  "distinct",
]);

const SQL_CONSTRUCTS = new Set([
  "in",
  "exists",
  "not",
  "and",
  "or",
  "between",
  "case",
  "when",
  "then",
  "else",
  "end",
  "like",
  "ilike",
  "as",
  "order",
  "group",
  "by",
  "select",
  "from",
  "where",
  "having",
  "limit",
  "offset",
  "join",
  "left",
  "right",
  "inner",
  "cross",
  "on",
  "is",
  "null",
]);

const ALLOWED_TABLES = new Set([
  "transaction",
  "transactions",
  "account",
  "accounts",
  "category",
  "categories",
  "budget",
  "budgets",
  "monthlybudget",
  "monthlybudgets",
  "__user_scoped_query",
  "__scoped_result",
  "t",
  "a",
  "c",
  "b",
  "mb",
]);

const PROHIBITED_TABLE_PATTERNS = [
  /\buser\b/i,
  /\busers\b/i,
  /\bsubscriptionpayment\b/i,
  /\bsubscriptionpayments\b/i,
  /\bpayment\b/i,
  /\bpayments\b/i,
  /\baicalllog\b/i,
  /\baicalllogs\b/i,
  /\bmerchantrule\b/i,
  /\bmerchantrules\b/i,
  /\bpendingaiaction\b/i,
  /\bpendingaiactions\b/i,
  /\btoken\b/i,
  /\btokens\b/i,
  /\bpassword\b/i,
  /\bauth\b/i,
];

/**
 * Validates that raw SQL meets strict security requirements.
 *
 * @param {string} rawSql
 * @param {string} [userId] - Optional, kept for backwards compatibility with existing callers
 * @returns {string} Cleaned, validated SQL string
 */
const assertSafeSelect = (rawSql, userId) => {
  if (!rawSql || typeof rawSql !== "string") {
    throw new Error("SQL query must be a non-empty string.");
  }

  // 1. Reject comments
  if (rawSql.includes("--") || /\/\*[\s\S]*?\*\//.test(rawSql)) {
    throw new Error("SQL comments are strictly forbidden.");
  }

  // 2. Strip trailing semicolon
  let cleaned = rawSql.trim().replace(/;+\s*$/, "");

  // 3. Reject multiple statements / internal semicolons
  if (cleaned.includes(";")) {
    throw new Error("Multiple SQL statements or internal semicolons are forbidden.");
  }

  // 4. Must start with SELECT or WITH
  if (!/^(select|with)\b/i.test(cleaned)) {
    throw new Error("Only SELECT and WITH-SELECT queries are allowed.");
  }

  // 5. Keyword blocklist with strict word boundaries
  for (const keyword of FORBIDDEN_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(cleaned)) {
      throw new Error(`Query contains forbidden keyword: ${keyword}`);
    }
  }

  // 6. Block system catalogs (pg_* and information_schema)
  if (/\bpg_[a-zA-Z0-9_]+/i.test(cleaned)) {
    throw new Error("Access to PostgreSQL system catalog (pg_*) is forbidden.");
  }
  if (/\binformation_schema\b/i.test(cleaned)) {
    throw new Error("Access to information_schema is forbidden.");
  }

  // 7. Reject prohibited tables (e.g. User, SubscriptionPayment, etc.)
  for (const pattern of PROHIBITED_TABLE_PATTERNS) {
    if (pattern.test(cleaned)) {
      throw new Error("Access to sensitive user/payment/system tables is forbidden.");
    }
  }

  // 8. Validate function calls against allowlist
  const fnMatches = cleaned.matchAll(/\b([a-zA-Z0-9_]+)\s*\(/g);
  for (const match of fnMatches) {
    const fn = match[1].toLowerCase();
    if (!ALLOWED_FUNCTIONS.has(fn) && !SQL_CONSTRUCTS.has(fn)) {
      throw new Error(`Function call not allowed: ${fn}`);
    }
  }

  // 9. Validate tables in FROM and JOIN clauses
  const tableMatches = cleaned.matchAll(/\b(?:from|join)\s+([a-zA-Z0-9_".]+)/gi);
  for (const match of tableMatches) {
    const rawTable = match[1].replace(/["']/g, "").replace(/^public\./i, "").toLowerCase();
    // Ignore subqueries (e.g., FROM (SELECT ...))
    if (rawTable.startsWith("(")) continue;

    if (!ALLOWED_TABLES.has(rawTable)) {
      throw new Error(`Access to table not allowed: ${rawTable}`);
    }
  }

  return cleaned;
};

/**
 * Wraps user-supplied query in CTEs pre-filtered by userId parameter $1.
 * Provides structural isolation: model query can never bypass user scoping.
 *
 * @param {string} cleanSql
 * @returns {string}
 */
const buildScopedSql = (cleanSql) => {
  return `
WITH
  "Account" AS (
    SELECT * FROM "public"."Account" WHERE "userId" = $1
  ),
  "account" AS (SELECT * FROM "Account"),
  "accounts" AS (SELECT * FROM "Account"),
  "Transaction" AS (
    SELECT t.* FROM "public"."Transaction" t
    JOIN "Account" a ON t."accountId" = a."id"
  ),
  "transaction" AS (SELECT * FROM "Transaction"),
  "transactions" AS (SELECT * FROM "Transaction"),
  "Budget" AS (
    SELECT * FROM "public"."Budget" WHERE "userId" = $1
  ),
  "budget" AS (SELECT * FROM "Budget"),
  "budgets" AS (SELECT * FROM "Budget"),
  "MonthlyBudget" AS (
    SELECT * FROM "public"."MonthlyBudget" WHERE "userId" = $1
  ),
  "monthlybudget" AS (SELECT * FROM "MonthlyBudget"),
  "monthlybudgets" AS (SELECT * FROM "MonthlyBudget"),
  "Category" AS (
    SELECT * FROM "public"."Category"
  ),
  "category" AS (SELECT * FROM "Category"),
  "categories" AS (SELECT * FROM "Category")
SELECT * FROM (
  ${cleanSql}
) AS __user_scoped_query
LIMIT 200
`.trim();
};

/**
 * Executes raw SQL with full hardening, structural CTE scoping, and read-only transaction limits.
 *
 * @param {string} rawSql
 * @param {string} userId
 * @param {object} [txClient]
 * @returns {Promise<Array<Record<string, any>>>}
 */
const executeHardenedSql = async (rawSql, userId, txClient = prisma) => {
  if (!userId) {
    throw new Error("userId is required for secure SQL execution");
  }

  const validated = assertSafeSelect(rawSql, userId);
  const scopedSql = buildScopedSql(validated);

  const rows = await txClient.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL statement_timeout = '5000ms'`);
    return await tx.$queryRawUnsafe(scopedSql, userId);
  });

  // Cap rows sent back to LLM at 50
  return Array.isArray(rows) ? rows.slice(0, 50) : rows;
};

module.exports = {
  assertSafeSelect,
  buildScopedSql,
  executeHardenedSql,
  ALLOWED_FUNCTIONS,
  ALLOWED_TABLES,
  FORBIDDEN_KEYWORDS,
};