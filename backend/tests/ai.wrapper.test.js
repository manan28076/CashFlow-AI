const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { z } = require("zod");
const { callGemini, calculateCost } = require("../src/modules/ai/services/gemini.service");

describe("Phase 1: Central Gemini Wrapper, Validation & Observability", () => {
  it("should successfully parse and validate structured output on first attempt", async () => {
    const testSchema = z.object({
      category: z.string(),
      confidence: z.number(),
    });

    // Mock Gemini client that returns valid JSON conforming to testSchema
    const mockClient = {
      models: {
        generateContent: async ({ model, contents, config }) => {
          assert.equal(config.responseMimeType, "application/json");
          assert.ok(config.responseSchema, "Schema should be passed to config");

          return {
            text: JSON.stringify({ category: "Food & Dining", confidence: 0.95 }),
            usageMetadata: {
              promptTokenCount: 120,
              candidatesTokenCount: 25,
              totalTokenCount: 145,
            },
          };
        },
      },
    };

    const result = await callGemini({
      agentName: "test_agent",
      contents: "Classify this transaction",
      zodSchema: testSchema,
      clientOverride: mockClient,
    });

    assert.equal(result.data.category, "Food & Dining");
    assert.equal(result.data.confidence, 0.95);
    assert.equal(result.promptTokens, 120);
    assert.equal(result.completionTokens, 25);
    assert.equal(result.totalTokens, 145);
    assert.equal(result.retries, 0);
  });

  it("should retry with feedback on schema validation failure and succeed on second attempt", async () => {
    const testSchema = z.object({
      score: z.number().min(0).max(100),
      grade: z.string(),
    });

    let callCount = 0;
    const receivedContents = [];

    const mockClient = {
      models: {
        generateContent: async ({ contents }) => {
          callCount++;
          receivedContents.push(contents);

          if (callCount === 1) {
            // First attempt returns invalid data (score is string, missing grade)
            return {
              text: JSON.stringify({ score: "not_a_number" }),
              usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 15, totalTokenCount: 115 },
            };
          }

          // Second attempt returns valid data matching schema
          return {
            text: JSON.stringify({ score: 88, grade: "A" }),
            usageMetadata: { promptTokenCount: 140, candidatesTokenCount: 20, totalTokenCount: 160 },
          };
        },
      },
    };

    const result = await callGemini({
      agentName: "retry_agent",
      contents: "Calculate financial health",
      zodSchema: testSchema,
      maxRetries: 2,
      clientOverride: mockClient,
    });

    assert.equal(callCount, 2, "Should have retried once before succeeding");
    assert.equal(result.data.score, 88);
    assert.equal(result.data.grade, "A");
    assert.equal(result.retries, 1);
    assert.ok(
      receivedContents[1].includes("[Schema Validation Failure]"),
      "Second attempt contents should include feedback about previous schema error"
    );
  });

  it("should fail gracefully when maxRetries are exceeded on persistent invalid schema", async () => {
    const testSchema = z.object({
      amount: z.number().positive(),
    });

    let callCount = 0;
    const mockClient = {
      models: {
        generateContent: async () => {
          callCount++;
          // Always return invalid structure
          return {
            text: JSON.stringify({ amount: "invalid_string" }),
            usageMetadata: { promptTokenCount: 50, candidatesTokenCount: 10, totalTokenCount: 60 },
          };
        },
      },
    };

    await assert.rejects(
      async () => {
        await callGemini({
          agentName: "failing_agent",
          contents: "Give amount",
          zodSchema: testSchema,
          maxRetries: 2,
          clientOverride: mockClient,
        });
      },
      (err) => {
        assert.ok(err.message, "Should throw error handled by AI error handler");
        return true;
      }
    );

    // Initial attempt + 2 retries = 3 total attempts
    assert.equal(callCount, 3, "Should have attempted initial call plus 2 retries");
  });

  it("should enforce per-call timeout", async () => {
    const mockHangingClient = {
      models: {
        generateContent: async () => {
          // Never resolves
          return new Promise(() => {});
        },
      },
    };

    await assert.rejects(
      async () => {
        await callGemini({
          agentName: "timeout_agent",
          contents: "hanging request",
          timeoutMs: 50, // 50ms timeout
          clientOverride: mockHangingClient,
        });
      },
      (err) => {
        assert.ok(err.message.includes("timed out"), "Should identify timeout");
        return true;
      }
    );
  });

  it("should calculate accurate cost based strictly on configured env vars", () => {
    // Both zero / valid numbers
    const cost = calculateCost({ promptTokens: 1_000_000, completionTokens: 1_000_000 });
    // In our test environment, check if pricing env vars are defined or null
    const inputPrice = process.env.AI_PRICE_PER_1M_INPUT_TOKENS;
    const outputPrice = process.env.AI_PRICE_PER_1M_OUTPUT_TOKENS;

    if (inputPrice && outputPrice) {
      const expected = Number((Number(inputPrice) + Number(outputPrice)).toFixed(6));
      assert.equal(cost, expected);
    } else {
      // Must be null if either price is unset
      assert.equal(cost, null);
    }
  });

  it("should return null for cost if pricing env vars are missing or invalid", () => {
    const originalInput = process.env.AI_PRICE_PER_1M_INPUT_TOKENS;
    delete process.env.AI_PRICE_PER_1M_INPUT_TOKENS;

    const cost = calculateCost({ promptTokens: 5000, completionTokens: 5000 });
    assert.equal(cost, null, "Cost must be null when pricing env var is unset");

    if (originalInput) {
      process.env.AI_PRICE_PER_1M_INPUT_TOKENS = originalInput;
    }
  });

  it("should aggregate metrics correctly including success rate and latency percentiles", async () => {
    const { getAIMetrics } = require("../src/modules/ai/ai.service");
    const prisma = require("../src/lib/prisma");

    const testUser = await prisma.user.create({
      data: {
        email: `metric_test_${Date.now()}@example.com`,
        name: "Metric Tester",
      },
    });

    try {
      // Insert mock logs
      await prisma.aiCallLog.createMany({
        data: [
          { userId: testUser.id, agent: "category_agent", model: "gemini-2.5-flash", promptTokens: 100, completionTokens: 50, totalTokens: 150, latencyMs: 200, success: true },
          { userId: testUser.id, agent: "category_agent", model: "gemini-2.5-flash", promptTokens: 100, completionTokens: 50, totalTokens: 150, latencyMs: 400, success: true },
          { userId: testUser.id, agent: "fraud_agent", model: "gemini-2.5-flash", promptTokens: 200, completionTokens: 60, totalTokens: 260, latencyMs: 300, success: false, errorType: "TimeoutError" },
        ],
      });

      const metrics = await getAIMetrics(testUser.id, { days: 7 });

      assert.equal(metrics.totalCalls, 3);
      assert.equal(metrics.successfulCalls, 2);
      assert.equal(metrics.failedCalls, 1);
      assert.equal(metrics.successRate, 66.67);
      assert.equal(metrics.tokens.totalTokens, 560);
      assert.equal(metrics.perAgent.length, 2);

      const catAgent = metrics.perAgent.find((a) => a.agent === "category_agent");
      assert.ok(catAgent);
      assert.equal(catAgent.calls, 2);
      assert.equal(catAgent.avgLatencyMs, 300);
      assert.equal(catAgent.successRate, 100);
    } finally {
      // Clean up
      await prisma.aiCallLog.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }
  });
});
