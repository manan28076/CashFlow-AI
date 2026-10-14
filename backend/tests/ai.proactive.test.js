const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const prisma = require("../src/lib/prisma");

const {
  getIsoWeekKey,
  computeBudgetBurnRate,
  computeWeekOverWeek,
} = require("../src/modules/ai/agents/proactive.agent");

const {
  getUserNotifications,
  markNotificationAsRead,
} = require("../src/modules/notification/notification.service");

describe("Phase 6: Proactive Weekly Agent & Notifications", () => {
  describe("A. Deterministic Budget Burn-Rate Calculation (Hand-Checked)", () => {
    it("should compute exact burn-rate percentages and assign ON_TRACK status", () => {
      // Math: Day 15 of 30 (50% elapsed). Budget 10,000, Spent 4,000 (40% burn rate).
      // 40% <= 50% + 15% -> ON_TRACK
      const budgets = [{ categoryId: "c_food", categoryName: "Food", amount: 10000 }];
      const expenses = { c_food: 4000 };
      const res = computeBudgetBurnRate(budgets, expenses, 15, 30);

      assert.equal(res[0].burnRatePct, 40);
      assert.equal(res[0].timeElapsedPct, 50);
      assert.equal(res[0].remaining, 6000);
      assert.equal(res[0].status, "ON_TRACK");
    });

    it("should flag AT_RISK when burn-rate outpaces month elapsed time by > 15%", () => {
      // Math: Day 15 of 30 (50% elapsed). Budget 10,000, Spent 7,000 (70% burn rate).
      // 70% > 50% + 15% (65%) -> AT_RISK
      const budgets = [{ categoryId: "c_food", categoryName: "Food", amount: 10000 }];
      const expenses = { c_food: 7000 };
      const res = computeBudgetBurnRate(budgets, expenses, 15, 30);

      assert.equal(res[0].burnRatePct, 70);
      assert.equal(res[0].timeElapsedPct, 50);
      assert.equal(res[0].remaining, 3000);
      assert.equal(res[0].status, "AT_RISK");
    });

    it("should flag OVER_BUDGET immediately when spent exceeds allocated budget", () => {
      // Math: Spent 11,000 > 10,000 budget -> OVER_BUDGET
      const budgets = [{ categoryId: "c_food", categoryName: "Food", amount: 10000 }];
      const expenses = { c_food: 11000 };
      const res = computeBudgetBurnRate(budgets, expenses, 10, 30);

      assert.equal(res[0].burnRatePct, 110);
      assert.equal(res[0].remaining, 0);
      assert.equal(res[0].status, "OVER_BUDGET");
    });
  });

  describe("B. Week-Over-Week Category Shift Calculation", () => {
    it("should compute exact percentage deltas and overall change", () => {
      const curTxs = [
        { type: "EXPENSE", amount: 2000, category: { name: "Food" } },
        { type: "EXPENSE", amount: 1000, category: { name: "Travel" } },
      ];
      const prevTxs = [
        { type: "EXPENSE", amount: 1000, category: { name: "Food" } },
        { type: "EXPENSE", amount: 2000, category: { name: "Travel" } },
      ];

      const res = computeWeekOverWeek(curTxs, prevTxs);

      assert.equal(res.totalCurrentWeek, 3000);
      assert.equal(res.totalPreviousWeek, 3000);
      assert.equal(res.overallChangePct, 0);

      const foodChange = res.categories.find((c) => c.category === "Food");
      assert.equal(foodChange.changePct, 100); // (2000 - 1000)/1000 * 100 = +100%

      const travelChange = res.categories.find((c) => c.category === "Travel");
      assert.equal(travelChange.changePct, -50); // (1000 - 2000)/2000 * 100 = -50%
    });

    it("should generate deterministic ISO 8601 week keys", () => {
      const d = new Date("2026-03-15T12:00:00Z");
      const weekKey = getIsoWeekKey(d);
      assert.equal(weekKey, "2026-W11");
    });
  });

  describe("C. Database Idempotency & User Isolation", () => {
    let testUserA;
    let testUserB;

    before(async () => {
      testUserA = await prisma.user.create({
        data: {
          email: `proactive_user_a_${Date.now()}@test.com`,
          name: "User A",
          plan: "STARTER",
        },
      });

      testUserB = await prisma.user.create({
        data: {
          email: `proactive_user_b_${Date.now()}@test.com`,
          name: "User B",
          plan: "STARTER",
        },
      });
    });

    after(async () => {
      if (testUserA?.id) {
        await prisma.notification.deleteMany({ where: { userId: testUserA.id } });
        await prisma.user.delete({ where: { id: testUserA.id } });
      }
      if (testUserB?.id) {
        await prisma.notification.deleteMany({ where: { userId: testUserB.id } });
        await prisma.user.delete({ where: { id: testUserB.id } });
      }
    });

    it("should enforce strict idempotency (running twice in the same week creates only one row)", async () => {
      const weekKey = "2026-W11";

      // First run: insert notification
      const n1 = await prisma.notification.upsert({
        where: {
          userId_type_weekKey: {
            userId: testUserA.id,
            type: "WEEKLY_DIGEST",
            weekKey,
          },
        },
        update: {},
        create: {
          userId: testUserA.id,
          type: "WEEKLY_DIGEST",
          title: "Weekly Summary 2026-W11",
          body: "You spent 5000 this week.",
          weekKey,
        },
      });

      // Second run: attempt to insert again
      const n2 = await prisma.notification.upsert({
        where: {
          userId_type_weekKey: {
            userId: testUserA.id,
            type: "WEEKLY_DIGEST",
            weekKey,
          },
        },
        update: {},
        create: {
          userId: testUserA.id,
          type: "WEEKLY_DIGEST",
          title: "Duplicate Attempt",
          body: "Should not replace.",
          weekKey,
        },
      });

      assert.equal(n1.id, n2.id);

      const count = await prisma.notification.count({
        where: {
          userId: testUserA.id,
          weekKey,
        },
      });
      assert.equal(count, 1, "Exactly one notification row must exist for weekKey");
    });

    it("should enforce strict user isolation (User B cannot view or mark User A's notification)", async () => {
      const userANotif = await prisma.notification.findFirst({
        where: { userId: testUserA.id },
      });

      // User B fetches their own notifications: should be 0
      const bList = await getUserNotifications(testUserB.id);
      assert.equal(bList.notifications.length, 0);

      // User B attempts to mark User A's notification as read: must throw 403
      await assert.rejects(
        async () => {
          await markNotificationAsRead(userANotif.id, testUserB.id);
        },
        (err) => {
          assert.equal(err.statusCode, 403);
          assert.match(err.message, /Not authorized/);
          return true;
        }
      );

      // User A marks their own notification as read: succeeds
      const updated = await markNotificationAsRead(userANotif.id, testUserA.id);
      assert.ok(updated.readAt instanceof Date);
    });
  });
});
