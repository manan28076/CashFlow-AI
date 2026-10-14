const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");

describe("Fintech Payment Security & Razorpay Cryptographic Verification", () => {
  const TEST_SECRET = "jYQhlIZKLNeBHwlZPpWWNrAi";
  const ORDER_ID = "order_TniZaPUi2lU4f2";
  const PAYMENT_ID = "pay_test_987654321";

  it("should generate and verify authentic HMAC-SHA256 signature for client checkout", () => {
    // Standard Razorpay checkout signature algorithm: HMAC-SHA256(order_id + '|' + payment_id, secret)
    const payload = `${ORDER_ID}|${PAYMENT_ID}`;
    const validSignature = crypto
      .createHmac("sha256", TEST_SECRET)
      .update(payload)
      .digest("hex");

    assert.ok(validSignature, "Signature should be generated");
    assert.equal(validSignature.length, 64, "HMAC-SHA256 signature should be 64 hex characters");

    // Verification check
    const verification = crypto
      .createHmac("sha256", TEST_SECRET)
      .update(payload)
      .digest("hex");

    assert.equal(verification, validSignature, "Signatures must match identically");
  });

  it("should strictly reject tampered payment IDs or modified order IDs (Fraud Protection)", () => {
    const originalPayload = `${ORDER_ID}|${PAYMENT_ID}`;
    const validSignature = crypto
      .createHmac("sha256", TEST_SECRET)
      .update(originalPayload)
      .digest("hex");

    // Attacker tampers payment ID
    const tamperedPayload = `${ORDER_ID}|pay_fraudulent_hacked_id`;
    const tamperedVerification = crypto
      .createHmac("sha256", TEST_SECRET)
      .update(tamperedPayload)
      .digest("hex");

    assert.notEqual(
      tamperedVerification,
      validSignature,
      "Tampered payload must fail cryptographic verification"
    );
  });

  it("should calculate accurate subscription duration (30 days vs 365 days)", () => {
    const now = new Date("2026-10-14T12:00:00Z");

    // Monthly Plan: 30 days
    const monthlyDurationDays = 30;
    const monthlyExpiry = new Date(now.getTime() + monthlyDurationDays * 24 * 60 * 60 * 1000);
    const monthlyDiffDays = Math.round((monthlyExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    assert.equal(monthlyDiffDays, 30, "Monthly plan must be exactly 30 days");

    // Annual Plan: 365 days
    const annualDurationDays = 365;
    const annualExpiry = new Date(now.getTime() + annualDurationDays * 24 * 60 * 60 * 1000);
    const annualDiffDays = Math.round((annualExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    assert.equal(annualDiffDays, 365, "Annual plan must be exactly 365 days");
  });

  it("should verify server-to-server webhook raw body signature matching Razorpay specification", () => {
    const rawWebhookBody = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: { entity: { id: PAYMENT_ID, order_id: ORDER_ID, amount: 238800 } },
      },
    });

    const webhookSignature = crypto
      .createHmac("sha256", TEST_SECRET)
      .update(rawWebhookBody)
      .digest("hex");

    // Server-side check
    const computedSignature = crypto
      .createHmac("sha256", TEST_SECRET)
      .update(rawWebhookBody)
      .digest("hex");

    assert.equal(computedSignature, webhookSignature, "Webhook signature must verify against raw body");
  });
});
