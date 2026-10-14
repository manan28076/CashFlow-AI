const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeValue,
  normalizeRow,
  compareResultSets,
  scoreCategorization,
  scoreAnomaly,
  scoreAgent,
} = require("../evals/scoring");

const { formatDelta, compareRuns } = require("../evals/compare");

describe("Phase 5: Evaluation Scoring & Comparison Engine", () => {
  describe("A. Value & Row Normalization", () => {
    it("should round numeric floats and parse numeric strings cleanly", () => {
      assert.equal(normalizeValue(123.456), 123.46);
      assert.equal(normalizeValue("450.50"), 450.5);
      assert.equal(normalizeValue(100), 100);
      assert.equal(normalizeValue(null), null);
      assert.equal(normalizeValue(undefined), null);
      assert.equal(normalizeValue("  SWIGGY  "), "swiggy");
    });

    it("should normalize database row keys to lowercase and normalize values", () => {
      const raw = {
        CATEGORY: "  Food  ",
        TOTAL_SPENT: "1500.556",
        Date: new Date("2026-03-15T12:00:00Z"),
      };
      const normalized = normalizeRow(raw);
      assert.deepEqual(normalized, {
        category: "food",
        total_spent: 1500.56,
        date: "2026-03-15",
      });
    });
  });

  describe("B. Execution-Based Result Set Comparison", () => {
    it("should pass identical result sets in different row order (order-insensitive multiset)", () => {
      const actual = [
        { category: "Food", amount: 450 },
        { category: "Shopping", amount: 1200 },
      ];
      const expected = [
        { category: "Shopping", amount: 1200 },
        { category: "Food", amount: 450 },
      ];
      const res = compareResultSets(actual, expected, { orderSensitive: false });
      assert.equal(res.pass, true);
      assert.equal(res.actualCount, 2);
      assert.equal(res.expectedCount, 2);
    });

    it("should tolerate column name casing differences between actual and expected", () => {
      const actual = [{ Total: 5000, Category: "BILLS" }];
      const expected = [{ total: 5000, category: "bills" }];
      const res = compareResultSets(actual, expected);
      assert.equal(res.pass, true);
    });

    it("should fail when row counts do not match", () => {
      const actual = [{ id: 1 }];
      const expected = [{ id: 1 }, { id: 2 }];
      const res = compareResultSets(actual, expected);
      assert.equal(res.pass, false);
      assert.match(res.reason, /Row count mismatch/);
    });

    it("should fail when multiset frequency of duplicated rows differs", () => {
      const actual = [
        { amount: 500, merchant: "Swiggy" },
        { amount: 500, merchant: "Swiggy" },
      ];
      const expected = [
        { amount: 500, merchant: "Swiggy" },
        { amount: 500, merchant: "Zomato" },
      ];
      const res = compareResultSets(actual, expected);
      assert.equal(res.pass, false);
      assert.match(res.reason, /Unmatched row in result set/);
    });

    it("should strictly verify order when orderSensitive is true", () => {
      const actual = [{ rank: 1, amount: 5000 }, { rank: 2, amount: 2000 }];
      const inverted = [{ rank: 2, amount: 2000 }, { rank: 1, amount: 5000 }];

      const passRes = compareResultSets(actual, actual, { orderSensitive: true });
      assert.equal(passRes.pass, true);

      const failRes = compareResultSets(actual, inverted, { orderSensitive: true });
      assert.equal(failRes.pass, false);
      assert.match(failRes.reason, /Row 0 column 'rank' mismatch/);
    });

    it("should pass when both sets are empty", () => {
      const res = compareResultSets([], []);
      assert.equal(res.pass, true);
      assert.equal(res.actualCount, 0);
    });
  });

  describe("C. Categorization Scoring", () => {
    it("should pass matching category names case-insensitively with trimming", () => {
      const res = scoreCategorization("  Food  ", "food");
      assert.equal(res.pass, true);
    });

    it("should fail mismatched category names with descriptive reason", () => {
      const res = scoreCategorization("Travel", "Bills");
      assert.equal(res.pass, false);
      assert.match(res.reason, /Expected 'Bills', got 'Travel'/);
    });
  });

  describe("D. Anomaly Detection Scoring", () => {
    it("should pass when all expected anomalies and detection methods match", () => {
      const actualFlags = ["tx_01", "tx_02"];
      const actualMethods = { tx_01: "zscore", tx_02: "duplicate" };
      const expectedFlags = ["tx_02", "tx_01"];
      const expectedMethods = { tx_01: "zscore", tx_02: "duplicate" };

      const res = scoreAnomaly(actualFlags, actualMethods, expectedFlags, expectedMethods);
      assert.equal(res.pass, true);
    });

    it("should fail when an expected anomaly was missed", () => {
      const res = scoreAnomaly(["tx_01"], { tx_01: "zscore" }, ["tx_01", "tx_02"], {});
      assert.equal(res.pass, false);
      assert.match(res.reason, /Anomaly count mismatch/);
    });

    it("should fail when detection method does not match expected method", () => {
      const res = scoreAnomaly(
        ["tx_01"],
        { tx_01: "iqr" },
        ["tx_01"],
        { tx_01: "zscore" }
      );
      assert.equal(res.pass, false);
      assert.match(res.reason, /Anomaly method mismatch for 'tx_01'/);
    });
  });

  describe("E. Agent Trajectory & Value Extraction Scoring", () => {
    it("should pass when all expected tools are called and expected values appear", () => {
      const steps = [
        { tool: "get_budgets", args: { month: 3, year: 2026 } },
        { tool: "run_sql", args: { query: "SELECT SUM(amount) FROM ..." } },
      ];
      const answer = "Your Food budget is 15,000, and you have spent 7390, leaving 7610.";
      const expectedTools = ["get_budgets", "run_sql"];
      const expectedValues = { budget: 15000, spent: 7390, remaining: 7610 };

      const res = scoreAgent(steps, answer, expectedTools, expectedValues);
      assert.equal(res.pass, true);
    });

    it("should fail when an essential tool was omitted by the agent", () => {
      const steps = [{ tool: "run_sql" }];
      const answer = "You spent 7390.";
      const res = scoreAgent(steps, answer, ["get_budgets", "run_sql"], {});
      assert.equal(res.pass, false);
      assert.match(res.reason, /Expected tool 'get_budgets' was not invoked/);
    });

    it("should fail when a required numeric figure is missing from agent output", () => {
      const steps = [{ tool: "get_budgets" }];
      const answer = "Your budget is 15000.";
      const res = scoreAgent(steps, answer, ["get_budgets"], { remaining: 7610 });
      assert.equal(res.pass, false);
      assert.match(res.reason, /Expected numeric value for 'remaining'/);
    });
  });

  describe("F. Benchmark Run Comparison & Delta Logic", () => {
    it("should compute exact deltas between current and previous benchmark runs", () => {
      const prevRun = {
        timestamp: "2026-10-01T10:00:00Z",
        gitCommit: "abc1234",
        summary: { overallAccuracy: 80.0 },
        suites: {
          text2sql: { accuracy: 75.0, avgLatencyMs: 1200 },
          anomaly: { accuracy: 100.0, avgLatencyMs: 5 },
        },
        categories: {
          text2sql_simple_filter: { accuracy: 80.0 },
        },
      };

      const curRun = {
        timestamp: "2026-10-14T12:00:00Z",
        gitCommit: "def5678",
        summary: { overallAccuracy: 87.5 },
        suites: {
          text2sql: { accuracy: 85.0, avgLatencyMs: 950 },
          anomaly: { accuracy: 100.0, avgLatencyMs: 4 },
        },
        categories: {
          text2sql_simple_filter: { accuracy: 100.0 },
        },
      };

      const comparison = compareRuns(curRun, prevRun);
      assert.equal(comparison.overall.accuracyDelta, 7.5);
      assert.equal(comparison.suites.text2sql.accuracyDelta, 10.0);
      assert.equal(comparison.suites.text2sql.latencyDeltaMs, -250);
      assert.equal(comparison.categories.text2sql_simple_filter.accuracyDelta, 20.0);

      assert.equal(formatDelta(7.5, true), "+7.50%");
      assert.equal(formatDelta(-250), "-250.00");
    });
  });
});
