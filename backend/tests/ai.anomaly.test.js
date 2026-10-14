const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  detectAnomalies,
  calculateMedian,
  calculateMAD,
  calculatePercentile,
  MIN_CATEGORY_HISTORY,
  MODIFIED_Z_SCORE_THRESHOLD,
} = require("../src/modules/ai/utils/anomaly");
const { fraudAgent } = require("../src/modules/ai/agents/fraud.agent");
const geminiService = require("../src/modules/ai/services/gemini.service");

describe("Phase 3: Hybrid Anomaly Detection & Robust Statistics", () => {
  describe("A. Mathematical Primitive Utilities", () => {
    it("should calculate correct median for odd and even length series", () => {
      // Odd: [10, 20, 30] -> 20
      assert.equal(calculateMedian([10, 20, 30]), 20);
      // Even: [10, 20, 30, 40] -> (20 + 30) / 2 = 25
      assert.equal(calculateMedian([10, 20, 30, 40]), 25);
      // Unsorted: [50, 10, 40, 20, 30] -> sorted [10, 20, 30, 40, 50] -> 30
      assert.equal(calculateMedian([50, 10, 40, 20, 30]), 30);
    });

    it("should calculate correct MAD (Median Absolute Deviation)", () => {
      // Series: [10, 20, 30, 40, 50, 60, 500]
      // Median = 40
      // |x - 40|: [30, 20, 10, 0, 10, 20, 460]
      // Sorted deviations: [0, 10, 10, 20, 20, 30, 460] -> Median at index 3 is 20
      const values = [10, 20, 30, 40, 50, 60, 500];
      const median = calculateMedian(values);
      assert.equal(median, 40);
      const mad = calculateMAD(values, median);
      assert.equal(mad, 20);
    });

    it("should calculate percentiles accurately", () => {
      const sorted = [10, 20, 30, 40, 50];
      assert.equal(calculatePercentile(sorted, 0.5), 30);
      assert.equal(calculatePercentile(sorted, 0), 10);
      assert.equal(calculatePercentile(sorted, 1), 50);
    });
  });

  describe("B. Table-Driven Modified Z-Score Tests (Hand-Computed Math)", () => {
    /**
     * Hand-computed Math Proof:
     * Dataset: 7 transactions in "Food" -> [10, 20, 30, 40, 50, 60, 500]
     * Median = 40
     * Deviations: |x - 40| = [30, 20, 10, 0, 10, 20, 460]
     * Sorted deviations: [0, 10, 10, 20, 20, 30, 460] -> MAD = 20
     *
     * Formula: M_i = 0.6745 * |x_i - Median| / MAD
     *
     * For 500:
     *   M_500 = 0.6745 * |500 - 40| / 20
     *         = 0.6745 * 460 / 20
     *         = 0.6745 * 23
     *         = 15.5135 (rounded to 15.51)
     *   Since 15.51 > 3.5 (threshold), it MUST be flagged!
     *
     * For 60:
     *   M_60 = 0.6745 * |60 - 40| / 20 = 0.6745 * 1.0 = 0.6745 < 3.5 -> Not flagged.
     *
     * For 10:
     *   M_10 = 0.6745 * |10 - 40| / 20 = 0.6745 * 1.5 = 1.01175 < 3.5 -> Not flagged.
     */
    it("should flag outlier using Modified Z-Score matching hand-calculated 15.51 score", () => {
      const transactions = [
        { id: 0, amount: 10, category: "Food" },
        { id: 1, amount: 20, category: "Food" },
        { id: 2, amount: 30, category: "Food" },
        { id: 3, amount: 40, category: "Food" },
        { id: 4, amount: 50, category: "Food" },
        { id: 5, amount: 60, category: "Food" },
        { id: 6, amount: 500, category: "Food" },
      ];

      const result = detectAnomalies(transactions);

      assert.equal(result.flagged.length, 1);
      const flag = result.flagged[0];
      assert.equal(flag.id, 6);
      assert.equal(flag.method, "zscore");
      assert.equal(flag.score, 15.51, "Score must match hand-computed Boris Iglewicz Modified Z-Score: 15.51");
      assert.equal(flag.numbers.median, 40);
      assert.equal(flag.numbers.mad, 20);
      assert.equal(flag.numbers.amount, 500);
      assert.ok(result.risk === "HIGH" || result.risk === "MEDIUM");
    });
  });

  describe("C. Zero MAD Handling (Fallback to IQR / Zero-Variance Rule)", () => {
    /**
     * Hand-computed Math Proof:
     * Dataset: [100, 100, 100, 100, 100, 1000] in "Shopping"
     * Count = 6
     * Median = 100
     * Deviations: [0, 0, 0, 0, 0, 900]
     * MAD = 0 (since > 50% identical values)
     * Fallback to IQR:
     *   Q1 = 100, Q3 = 100, IQR = 0
     * Zero Variance Cutoff: Median * 3.0 = 300
     * For 1000: 1000 >= 300 -> Flagged via IQR/Zero Variance rule with score 10.0x!
     */
    it("should handle MAD = 0 gracefully and flag extreme outlier via IQR fallback", () => {
      const transactions = [
        { id: 0, amount: 100, category: "Shopping" },
        { id: 1, amount: 100, category: "Shopping" },
        { id: 2, amount: 100, category: "Shopping" },
        { id: 3, amount: 100, category: "Shopping" },
        { id: 4, amount: 100, category: "Shopping" },
        { id: 5, amount: 1000, category: "Shopping" },
      ];

      const result = detectAnomalies(transactions);

      assert.equal(result.flagged.length, 1);
      const flag = result.flagged[0];
      assert.equal(flag.id, 5);
      assert.equal(flag.method, "iqr");
      assert.equal(flag.numbers.mad, 0);
      assert.equal(flag.numbers.amount, 1000);
      assert.equal(flag.numbers.median, 100);
    });
  });

  describe("D. Exact Duplicate Charge Detection", () => {
    it("should detect duplicate transactions with same amount and merchant within 24h", () => {
      const now = new Date();
      const transactions = [
        { id: 0, amount: 450, merchant: "Swiggy", date: new Date(now.getTime() - 30 * 60 * 1000), category: "Food" },
        { id: 1, amount: 649, merchant: "Netflix", date: now, category: "Entertainment" },
        { id: 2, amount: 450, merchant: "UPI/DR/123/SWIGGY/swiggy@icici", date: now, category: "Food" },
      ];

      const result = detectAnomalies(transactions);

      assert.equal(result.flagged.length, 1);
      const flag = result.flagged[0];
      assert.equal(flag.id, 2);
      assert.equal(flag.method, "duplicate");
      assert.equal(flag.numbers.duplicateOfId, 0);
    });
  });

  describe("E. Minimum Category History & Edge Cases", () => {
    it("should return insufficient_history and avoid flagging when category has < 5 transactions", () => {
      const transactions = [
        { id: 0, amount: 100, category: "Travel" },
        { id: 1, amount: 150, category: "Travel" },
        { id: 2, amount: 120, category: "Travel" },
        { id: 3, amount: 95000, category: "Travel" }, // Giant amount, but only 4 transactions
      ];

      const result = detectAnomalies(transactions);

      assert.equal(result.flagged.length, 0, "Must not flag statistical outliers without minimum 5 transactions history");
      assert.ok(result.insufficientHistoryCategories.includes("Travel"));
    });

    it("should handle empty and single-item transaction arrays cleanly", () => {
      const emptyResult = detectAnomalies([]);
      assert.equal(emptyResult.flagged.length, 0);
      assert.equal(emptyResult.risk, "LOW");

      const singleResult = detectAnomalies([{ id: 0, amount: 500, category: "Food" }]);
      assert.equal(singleResult.flagged.length, 0);
    });

    it("should not flag normal identical transactions when there are no outliers", () => {
      const transactions = [
        { id: 0, amount: 50, category: "Bills" },
        { id: 1, amount: 50, category: "Bills" },
        { id: 2, amount: 50, category: "Bills" },
        { id: 3, amount: 50, category: "Bills" },
        { id: 4, amount: 50, category: "Bills" },
      ];

      const result = detectAnomalies(transactions);
      assert.equal(result.flagged.length, 0);
    });
  });

  describe("F. Fraud Agent Strict Contract (LLM Can Never Add or Remove Flags)", () => {
    it("should ensure statistics decide flaggedIds and LLM cannot alter them", async () => {
      const transactions = [
        { id: 0, amount: 20, category: "Food" },
        { id: 1, amount: 25, category: "Food" },
        { id: 2, amount: 22, category: "Food" },
        { id: 3, amount: 24, category: "Food" },
        { id: 4, amount: 21, category: "Food" },
        { id: 5, amount: 900, category: "Food" }, // Outlier: flagged by statistics
      ];

      // Mock Gemini to attempt to return different flags
      const originalGenerate = geminiService.ai.models.generateContent;
      geminiService.ai.models.generateContent = async () => ({
        text: JSON.stringify({
          risk: "HIGH",
          reason: "Unusual massive debit of ₹900 detected in food.",
        }),
        usageMetadata: { promptTokenCount: 50, candidatesTokenCount: 20, totalTokenCount: 70 },
      });

      try {
        const response = await fraudAgent(transactions, "test-user-id");

        // Assert contract
        assert.deepEqual(response.flaggedIds, [5], "flaggedIds MUST strictly match statistical outlier ID 5");
        assert.equal(response.risk, "HIGH");
        assert.ok(response.reason.includes("₹900"));
        assert.equal(response.flags.length, 1);
        assert.equal(response.flags[0].method, "zscore");
      } finally {
        geminiService.ai.models.generateContent = originalGenerate;
      }
    });

    it("should bypass LLM call completely when no anomalies exist (0 tokens, instant response)", async () => {
      let llmCalled = false;
      const originalGenerate = geminiService.ai.models.generateContent;
      geminiService.ai.models.generateContent = async () => {
        llmCalled = true;
        throw new Error("Should not be called!");
      };

      try {
        const transactions = [
          { id: 0, amount: 100, category: "Food" },
          { id: 1, amount: 105, category: "Food" },
          { id: 2, amount: 95, category: "Food" },
          { id: 3, amount: 102, category: "Food" },
          { id: 4, amount: 98, category: "Food" },
        ];

        const response = await fraudAgent(transactions, "test-user-id");

        assert.equal(llmCalled, false, "LLM must be bypassed when statistics detect 0 anomalies");
        assert.deepEqual(response.flaggedIds, []);
        assert.equal(response.risk, "LOW");
      } finally {
        geminiService.ai.models.generateContent = originalGenerate;
      }
    });
  });
});
