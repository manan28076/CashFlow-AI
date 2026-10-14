const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const prisma = require("../src/lib/prisma");
const geminiService = require("../src/modules/ai/services/gemini.service");
const {
  runFinanceAgent,
  confirmPendingAction,
} = require("../src/modules/ai/agents/finance.agent");

describe("Phase 4B & 4E: Tool-Calling Finance Agent & Confirmation Engine", () => {
  let testUser;
  let testAccount;
  let foodCategory;
  let attackerUser;

  before(async () => {
    foodCategory = await prisma.category.upsert({
      where: { name: "Food" },
      update: {},
      create: { name: "Food" },
    });

    testUser = await prisma.user.create({
      data: {
        email: `finance_agent_test_${Date.now()}@example.com`,
        name: "Finance Agent Tester",
      },
    });

    attackerUser = await prisma.user.create({
      data: {
        email: `attacker_test_${Date.now()}@example.com`,
        name: "Attacker User",
      },
    });

    testAccount = await prisma.account.create({
      data: {
        name: "Agent HDFC",
        bankName: "HDFC",
        userId: testUser.id,
      },
    });
  });

  after(async () => {
    if (testUser) {
      await prisma.pendingAiAction.deleteMany({ where: { userId: testUser.id } }).catch(() => {});
      await prisma.transaction.deleteMany({ where: { account: { userId: testUser.id } } }).catch(() => {});
      await prisma.account.deleteMany({ where: { userId: testUser.id } }).catch(() => {});
      await prisma.aiCallLog.deleteMany({ where: { userId: testUser.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    }
    if (attackerUser) {
      await prisma.user.delete({ where: { id: attackerUser.id } }).catch(() => {});
    }
  });

  describe("A. Loop Termination & Max Iteration Guardrails", () => {
    it("should terminate gracefully at max 6 iterations when model continuously requests tools", async () => {
      let callCount = 0;
      const originalGenerate = geminiService.ai.models.generateContent;

      // Mock Gemini to continuously return new function calls
      geminiService.ai.models.generateContent = async () => {
        callCount++;
        return {
          functionCalls: [
            {
              name: "get_spending_summary",
              args: { groupBy: "category", from: `2026-0${callCount}-01` },
            },
          ],
          text: "",
          usageMetadata: { promptTokenCount: 50, candidatesTokenCount: 20, totalTokenCount: 70 },
        };
      };

      try {
        const result = await runFinanceAgent({
          message: "Analyze everything repeatedly",
          userId: testUser.id,
        });

        assert.ok(callCount <= 6, `Agent must stop by iteration 6 (called: ${callCount})`);
        assert.ok(result.steps.length <= 6);
        assert.ok(result.answer, "Agent must return a final graceful answer");
      } finally {
        geminiService.ai.models.generateContent = originalGenerate;
      }
    });
  });

  describe("B. Write Tool Safety: Staged as Pending Action (Not Executed)", () => {
    it("should NOT execute write tool immediately, but return a pending action for user confirmation", async () => {
      const originalGenerate = geminiService.ai.models.generateContent;

      let stage = 0;
      geminiService.ai.models.generateContent = async () => {
        stage++;
        if (stage === 1) {
          // Model requests write tool
          return {
            functionCalls: [
              {
                name: "add_transaction",
                args: {
                  amount: 450,
                  category: "Food",
                  description: "Lunch at Subway",
                  type: "EXPENSE",
                },
              },
            ],
            text: "",
            usageMetadata: { promptTokenCount: 40, candidatesTokenCount: 20, totalTokenCount: 60 },
          };
        }
        // Model acknowledges staged action
        return {
          functionCalls: [],
          text: "I have prepared the transaction for your confirmation: ₹450 for Food (Lunch at Subway).",
          usageMetadata: { promptTokenCount: 20, candidatesTokenCount: 20, totalTokenCount: 40 },
        };
      };

      try {
        const initialTxCount = await prisma.transaction.count({
          where: { account: { userId: testUser.id } },
        });

        const agentResult = await runFinanceAgent({
          message: "Add an expense of 450 for lunch at Subway",
          userId: testUser.id,
        });

        // 1. Transaction must NOT be in database yet
        const currentTxCount = await prisma.transaction.count({
          where: { account: { userId: testUser.id } },
        });
        assert.equal(currentTxCount, initialTxCount, "Write tool must NOT execute directly without user confirmation");

        // 2. Pending action must be staged
        assert.equal(agentResult.pendingActions.length, 1);
        const action = agentResult.pendingActions[0];
        assert.equal(action.tool, "add_transaction");
        assert.ok(action.summary.includes("450"));
        assert.ok(action.summary.includes("Food"));

        // 3. Database PendingAiAction record check
        const pendingRecord = await prisma.pendingAiAction.findUnique({
          where: { id: action.actionId },
        });
        assert.ok(pendingRecord);
        assert.equal(pendingRecord.status, "PENDING");
      } finally {
        geminiService.ai.models.generateContent = originalGenerate;
      }
    });
  });

  describe("C. Confirmation Idempotency & User Scoping Isolation", () => {
    it("should execute confirmed action exactly once and reject duplicate / attacker confirmations", async () => {
      // 1. Create a staged action in DB
      const pending = await prisma.pendingAiAction.create({
        data: {
          userId: testUser.id,
          tool: "add_transaction",
          argsJson: JSON.stringify({
            amount: 750,
            category: "Food",
            description: "Dinner at Haldiram",
            type: "EXPENSE",
          }),
          status: "PENDING",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      // 2. Attacker attempts to confirm testUser's action -> MUST REJECT (cross-user isolation)
      await assert.rejects(
        async () => {
          await confirmPendingAction({
            actionId: pending.id,
            userId: attackerUser.id,
          });
        },
        /belongs to another user|not found/i
      );

      // 3. Legitimate user confirms action -> MUST EXECUTE
      const confirmResult = await confirmPendingAction({
        actionId: pending.id,
        userId: testUser.id,
      });

      assert.equal(confirmResult.success, true);
      assert.equal(confirmResult.status, "CONFIRMED");
      assert.ok(confirmResult.result);
      assert.equal(confirmResult.result.amount, 750);

      // Verify transaction now exists in DB
      const createdTx = await prisma.transaction.findFirst({
        where: { account: { userId: testUser.id }, amount: 750 },
      });
      assert.ok(createdTx);

      // 4. Confirming a second time must reject idempotently
      await assert.rejects(
        async () => {
          await confirmPendingAction({
            actionId: pending.id,
            userId: testUser.id,
          });
        },
        /already been processed/i
      );
    });
  });

  describe("D. Tool Argument Validation Failure Feedback", () => {
    it("should handle invalid tool arguments gracefully and record validation error in steps", async () => {
      let turn = 0;
      const originalGenerate = geminiService.ai.models.generateContent;

      geminiService.ai.models.generateContent = async () => {
        turn++;
        if (turn === 1) {
          // Model sends invalid args (missing required query string)
          return {
            functionCalls: [
              {
                name: "run_sql",
                args: { query: "" }, // invalid: min length is 5
              },
            ],
            text: "",
            usageMetadata: { promptTokenCount: 30, candidatesTokenCount: 15, totalTokenCount: 45 },
          };
        }
        return {
          functionCalls: [],
          text: "I received a validation error on the SQL query and corrected it.",
          usageMetadata: { promptTokenCount: 20, candidatesTokenCount: 20, totalTokenCount: 40 },
        };
      };

      try {
        const result = await runFinanceAgent({
          message: "Run a query",
          userId: testUser.id,
        });

        assert.equal(result.steps.length, 1);
        assert.ok(result.steps[0].summary.includes("Error:"));
        assert.ok(result.answer);
      } finally {
        geminiService.ai.models.generateContent = originalGenerate;
      }
    });
  });
});
