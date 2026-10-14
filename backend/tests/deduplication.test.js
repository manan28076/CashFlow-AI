const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");

describe("Zero-Duplicate Transaction Engine & Cryptographic Deduplication", () => {
  // Deduplication hash function: SHA-256(date + '|' + amount + '|' + normalized_merchant)
  const generateTxHash = (date, amount, merchant) => {
    const normalized = `${new Date(date).toISOString().split("T")[0]}|${Number(amount).toFixed(2)}|${merchant.trim().toLowerCase()}`;
    return crypto.createHash("sha256").update(normalized).digest("hex");
  };

  it("should generate identical hash for duplicate bank statement transactions", () => {
    const tx1 = {
      date: "2026-10-14",
      amount: 1500,
      merchant: "Swiggy Online",
    };

    const tx2 = {
      date: "2026-10-14",
      amount: 1500,
      merchant: "  swiggy online  ", // case & whitespace insensitivity
    };

    const hash1 = generateTxHash(tx1.date, tx1.amount, tx1.merchant);
    const hash2 = generateTxHash(tx2.date, tx2.amount, tx2.merchant);

    assert.equal(hash1, hash2, "Identical transactions must generate matching cryptographic hash");
  });

  it("should generate distinct hashes for legitimate repeated charges on different days", () => {
    const txDay1 = {
      date: "2026-10-14",
      amount: 249,
      merchant: "Uber India",
    };

    const txDay2 = {
      date: "2026-10-15",
      amount: 249,
      merchant: "Uber India",
    };

    const hash1 = generateTxHash(txDay1.date, txDay1.amount, txDay1.merchant);
    const hash2 = generateTxHash(txDay2.date, txDay2.amount, txDay2.merchant);

    assert.notEqual(hash1, hash2, "Transactions on different dates must not be falsely flagged as duplicate");
  });

  it("should generate distinct hashes for different amounts with same merchant on same day", () => {
    const txLunch = {
      date: "2026-10-14",
      amount: 450,
      merchant: "Starbucks Coffee",
    };

    const txDinner = {
      date: "2026-10-14",
      amount: 820,
      merchant: "Starbucks Coffee",
    };

    const hash1 = generateTxHash(txLunch.date, txLunch.amount, txLunch.merchant);
    const hash2 = generateTxHash(txDinner.date, txDinner.amount, txDinner.merchant);

    assert.notEqual(hash1, hash2, "Different amounts must be treated as distinct transactions");
  });
});
