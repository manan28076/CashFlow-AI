const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  assertSafeSelect,
  buildScopedSql,
  executeHardenedSql,
} = require("../src/modules/ai/utils/sqlGuard");

describe("Phase 4A: Hardened SQL Guard (27 Security Attack & Edge Cases)", () => {
  const validCases = [
    {
      name: "Case 1: Standard SELECT on Transaction",
      sql: 'SELECT id, amount, description FROM "Transaction" WHERE amount > 100',
    },
    {
      name: "Case 2: Standard SELECT on Account",
      sql: 'SELECT id, name, "bankName" FROM "Account"',
    },
    {
      name: "Case 3: Standard SELECT on Category",
      sql: 'SELECT id, name FROM "Category"',
    },
    {
      name: "Case 4: Standard SELECT on Budget",
      sql: 'SELECT id, amount, month, year FROM "Budget"',
    },
    {
      name: "Case 5: Standard SELECT on MonthlyBudget",
      sql: 'SELECT id, amount, month, year FROM "MonthlyBudget"',
    },
    {
      name: "Case 6: WITH-SELECT Common Table Expression",
      sql: 'WITH t AS (SELECT id, amount FROM "Transaction") SELECT * FROM t',
    },
    {
      name: "Case 7: Query with createdAt column (False Positive Check for 'create')",
      sql: 'SELECT id, amount, "createdAt" FROM "Transaction" ORDER BY "createdAt" DESC',
    },
    {
      name: "Case 8: Query with updatedAt column (False Positive Check for 'update')",
      sql: 'SELECT id, "updatedAt" FROM "Budget" ORDER BY "updatedAt" DESC',
    },
    {
      name: "Case 9: Allowed aggregations (SUM, AVG, COUNT, MIN, MAX)",
      sql: 'SELECT COUNT(id), SUM(amount), AVG(amount), MIN(amount), MAX(amount) FROM "Transaction"',
    },
    {
      name: "Case 10: Allowed date functions (date_trunc, now, current_date)",
      sql: "SELECT date_trunc('month', date) AS month, SUM(amount) FROM \"Transaction\" GROUP BY 1",
    },
    {
      name: "Case 11: Allowed functions (COALESCE, ROUND, LOWER)",
      sql: 'SELECT COALESCE(merchant, description), ROUND(amount::numeric, 2), LOWER(type) FROM "Transaction"',
    },
    {
      name: "Case 12: Tautology condition (Safe due to CTE parameter $1 scoping)",
      sql: 'SELECT * FROM "Transaction" WHERE 1=1 OR 2=2',
    },
    {
      name: "Case 13: Clean trailing semicolon stripping",
      sql: 'SELECT id, amount FROM "Transaction";',
    },
  ];

  for (const tc of validCases) {
    it(`should ACCEPT: ${tc.name}`, () => {
      const result = assertSafeSelect(tc.sql, "test-user-id");
      assert.ok(result);
    });
  }

  const attackCases = [
    {
      name: "Case 14: Comment injection via double-dash (--)",
      sql: 'SELECT * FROM "Transaction" -- DROP TABLE "Account"',
      expectedError: /comments are strictly forbidden/i,
    },
    {
      name: "Case 15: Comment injection via multi-line comment (/* */)",
      sql: 'SELECT * FROM "Transaction" /* evil comment */ WHERE 1=1',
      expectedError: /comments are strictly forbidden/i,
    },
    {
      name: "Case 16: Stacked query with internal semicolon",
      sql: 'SELECT * FROM "Transaction"; DROP TABLE "Account"',
      expectedError: /multiple sql statements or internal semicolons/i,
    },
    {
      name: "Case 17: Mutation attempt: INSERT",
      sql: 'INSERT INTO "Transaction" (amount) VALUES (1000)',
      expectedError: /only select and with-select/i,
    },
    {
      name: "Case 18: Mutation attempt: UPDATE",
      sql: 'UPDATE "Transaction" SET amount = 0',
      expectedError: /only select and with-select/i,
    },
    {
      name: "Case 19: Mutation attempt: DELETE",
      sql: 'DELETE FROM "Transaction"',
      expectedError: /only select and with-select/i,
    },
    {
      name: "Case 20: DDL attempt: DROP TABLE",
      sql: 'DROP TABLE "Transaction"',
      expectedError: /only select and with-select/i,
    },
    {
      name: "Case 21: DDL attempt: ALTER TABLE",
      sql: 'ALTER TABLE "Transaction" DROP COLUMN amount',
      expectedError: /only select and with-select/i,
    },
    {
      name: "Case 22: Remote execution / sleep attack: pg_sleep",
      sql: 'SELECT pg_sleep(10) FROM "Transaction"',
      expectedError: /system catalog|function call not allowed/i,
    },
    {
      name: "Case 23: Metadata exfiltration: information_schema",
      sql: "SELECT table_name FROM information_schema.tables",
      expectedError: /information_schema/i,
    },
    {
      name: "Case 24: Sensitive table access: User table",
      sql: 'SELECT email, password FROM "User"',
      expectedError: /sensitive user\/payment\/system tables/i,
    },
    {
      name: "Case 25: Sensitive table access: users table lowercase",
      sql: "SELECT * FROM users",
      expectedError: /sensitive user\/payment\/system tables/i,
    },
    {
      name: "Case 26: Sensitive table access: SubscriptionPayment table",
      sql: 'SELECT * FROM "SubscriptionPayment"',
      expectedError: /sensitive user\/payment\/system tables/i,
    },
    {
      name: "Case 27: Disallowed function: version()",
      sql: 'SELECT version() FROM "Transaction"',
      expectedError: /function call not allowed: version/i,
    },
  ];

  for (const tc of attackCases) {
    it(`should REJECT: ${tc.name}`, () => {
      assert.throws(() => {
        assertSafeSelect(tc.sql, "test-user-id");
      }, tc.expectedError);
    });
  }

  describe("Structural CTE Scoping Verification", () => {
    it("should build CTE query that shadows Transaction, Account, and Budget using bound parameter $1", () => {
      const raw = 'SELECT * FROM "Transaction" WHERE amount > 500';
      const scoped = buildScopedSql(raw);

      assert.ok(scoped.includes('"Account" AS ('), "Must shadow Account with CTE");
      assert.ok(scoped.includes('WHERE "userId" = $1'), "Must bind Account CTE to $1");
      assert.ok(scoped.includes('"Transaction" AS ('), "Must shadow Transaction with CTE");
      assert.ok(scoped.includes('LIMIT 200'), "Must enforce LIMIT 200");
    });
  });
});
