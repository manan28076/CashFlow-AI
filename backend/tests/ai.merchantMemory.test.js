const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const prisma = require("../src/lib/prisma");
const { normalizeMerchant } = require("../src/modules/ai/utils/normalizeMerchant");
const { categoryAgent } = require("../src/modules/ai/agents/category.agent");
const { updateTransaction } = require("../src/modules/transaction/transaction.service");
const geminiService = require("../src/modules/ai/services/gemini.service");

describe("Phase 2: Merchant Memory & User Corrections", () => {
  let testUser;
  let testAccount;
  let foodCategory;
  let shoppingCategory;

  before(async () => {
    // Ensure categories exist
    foodCategory = await prisma.category.upsert({
      where: { name: "Food" },
      update: {},
      create: { name: "Food" },
    });

    shoppingCategory = await prisma.category.upsert({
      where: { name: "Shopping" },
      update: {},
      create: { name: "Shopping" },
    });

    // Create test user and account
    testUser = await prisma.user.create({
      data: {
        email: `merchant_test_${Date.now()}@example.com`,
        name: "Merchant Memory Tester",
      },
    });

    testAccount = await prisma.account.create({
      data: {
        name: "Test Bank",
        bankName: "HDFC Bank",
        userId: testUser.id,
      },
    });
  });

  after(async () => {
    // Cleanup
    if (testUser) {
      await prisma.merchantRule.deleteMany({ where: { userId: testUser.id } }).catch(() => {});
      await prisma.transaction.deleteMany({ where: { account: { userId: testUser.id } } }).catch(() => {});
      await prisma.account.deleteMany({ where: { userId: testUser.id } }).catch(() => {});
      await prisma.aiCallLog.deleteMany({ where: { userId: testUser.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    }
  });

  describe("A. Deterministic Merchant Normalization (17 realistic cases)", () => {
    const testCases = [
      { raw: "UPI/DR/48392019/SWIGGY/swiggy@icici/Order", expected: "swiggy" },
      { raw: "UPI/CR/12345/ZOMATO/zomato@hdfc/Payment", expected: "zomato" },
      { raw: "POS 401234XXXX1234 STARBUCKS BANGALORE", expected: "starbucks bangalore" },
      { raw: "NEFT-12345678-AMAZON PAY INDIA", expected: "amazon pay india" },
      { raw: "IMPS/P2A/3948201/SWIGGY", expected: "swiggy" },
      { raw: "ACH/NACH/MUTUAL FUND SIP GROWW", expected: "mutual fund sip groww" },
      { raw: "ZEPTO QUICK COMMERCE PVT LTD", expected: "zepto quick commerce" },
      { raw: "UBER RIDES TRIP 98214", expected: "uber rides trip" },
      { raw: "NETFLIX ENTERTAINMENT IN 928374", expected: "netflix entertainment in" },
      { raw: "BLINKIT GROCERIES 12847", expected: "blinkit groceries" },
      { raw: "SWIGGY INSTAMART ORDER #9923", expected: "swiggy instamart order" },
      { raw: "TRANSFER TO JOHN DOE 9876543210", expected: "john doe" },
      { raw: "AIRTEL PREPAID RECHARGE 9876543210", expected: "airtel prepaid recharge" },
      { raw: "D-MART SUPERMARKET AVENUE 883", expected: "d mart supermarket avenue" },
      { raw: "JIO FIBER BROADBAND 102938", expected: "jio fiber broadband" },
      { raw: "APOLLO PHARMACY 247 STORE 12", expected: "apollo pharmacy store" },
      { raw: "9876543210", expected: "" },
    ];

    for (let i = 0; i < testCases.length; i++) {
      const { raw, expected } = testCases[i];
      it(`Case ${i + 1}: should normalize "${raw}" -> "${expected}"`, () => {
        const actual = normalizeMerchant(raw);
        assert.equal(actual, expected);
      });
    }

    it("should handle null, undefined, and non-string inputs safely", () => {
      assert.equal(normalizeMerchant(null), "");
      assert.equal(normalizeMerchant(undefined), "");
      assert.equal(normalizeMerchant(12345), "");
      assert.equal(normalizeMerchant({}), "");
    });
  });

  describe("B. Rule Hit Skips LLM Call (Merchant Memory)", () => {
    it("should resolve category from memory without invoking Gemini LLM", async () => {
      // 1. Create a merchant rule in memory for "swiggy"
      const swiggyKey = normalizeMerchant("SWIGGY");
      await prisma.merchantRule.upsert({
        where: {
          userId_merchantKey: {
            userId: testUser.id,
            merchantKey: swiggyKey,
          },
        },
        create: {
          userId: testUser.id,
          merchantKey: swiggyKey,
          categoryId: foodCategory.id,
          source: "USER",
          hitCount: 5,
        },
        update: {
          categoryId: foodCategory.id,
          source: "USER",
        },
      });

      // 2. Mock or spy on gemini call to ensure it is NOT called
      let llmInvoked = false;
      const originalGenerate = geminiService.ai.models.generateContent;
      geminiService.ai.models.generateContent = async () => {
        llmInvoked = true;
        throw new Error("Gemini should NOT be called when rule hits!");
      };

      try {
        const transactions = [
          { id: 0, merchant: "UPI/DR/48392019/SWIGGY/swiggy@icici/Order", amount: 350 },
        ];

        const result = await categoryAgent(transactions, ["Food", "Shopping"], testUser.id);

        assert.equal(llmInvoked, false, "Gemini LLM must not be called when rule hits");
        assert.equal(result.categorizedFromMemory, 1);
        assert.equal(result.categorizedByLlm, 0);
        assert.equal(result.categories.length, 1);
        assert.equal(result.categories[0].category, "Food");
      } finally {
        geminiService.ai.models.generateContent = originalGenerate;
      }
    });
  });

  describe("C. USER Overrides LLM in MerchantRule", () => {
    it("should upgrade rule from source=LLM to source=USER and update category on user correction", async () => {
      const merchantKey = normalizeMerchant("ZOMATO");

      // 1. Initially saved as LLM rule pointing to Shopping (incorrect)
      await prisma.merchantRule.upsert({
        where: {
          userId_merchantKey: {
            userId: testUser.id,
            merchantKey,
          },
        },
        create: {
          userId: testUser.id,
          merchantKey,
          categoryId: shoppingCategory.id,
          source: "LLM",
          hitCount: 1,
        },
        update: {
          categoryId: shoppingCategory.id,
          source: "LLM",
        },
      });

      // Check initial state
      let rule = await prisma.merchantRule.findUnique({
        where: { userId_merchantKey: { userId: testUser.id, merchantKey } },
      });
      assert.equal(rule.source, "LLM");
      assert.equal(rule.categoryId, shoppingCategory.id);

      // 2. Create a transaction for this user
      const tx = await prisma.transaction.create({
        data: {
          accountId: testAccount.id,
          categoryId: shoppingCategory.id,
          amount: 250,
          type: "EXPENSE",
          merchant: "ZOMATO",
          description: "Zomato dinner",
          date: new Date(),
        },
      });

      // 3. User edits transaction category to Food via updateTransaction
      await updateTransaction(tx.id, { categoryId: foodCategory.id }, testUser.id);

      // 4. Verify rule was upgraded to source=USER with category=Food
      rule = await prisma.merchantRule.findUnique({
        where: { userId_merchantKey: { userId: testUser.id, merchantKey } },
      });
      assert.ok(rule);
      assert.equal(rule.source, "USER", "User correction must override LLM source to USER");
      assert.equal(rule.categoryId, foodCategory.id, "Category must be updated to user choice");
    });
  });

  describe("D. Unique Constraint Behavior", () => {
    it("should enforce @@unique([userId, merchantKey]) and reject duplicate inserts", async () => {
      const merchantKey = "unique_test_merchant";

      await prisma.merchantRule.create({
        data: {
          userId: testUser.id,
          merchantKey,
          categoryId: foodCategory.id,
          source: "USER",
        },
      });

      // Attempting to create duplicate (userId, merchantKey) must reject
      await assert.rejects(
        async () => {
          await prisma.merchantRule.create({
            data: {
              userId: testUser.id,
              merchantKey,
              categoryId: shoppingCategory.id,
              source: "LLM",
            },
          });
        },
        /Unique constraint failed/i
      );
    });
  });
});
