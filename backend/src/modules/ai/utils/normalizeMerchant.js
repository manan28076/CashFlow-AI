/**
 * Deterministic Merchant Normalization Utility
 *
 * Normalizes merchant and narration strings:
 * - Converts to lowercase
 * - Extracts merchant from common Indian bank/UPI/NEFT/IMPS statement patterns
 * - Strips reference numbers, transaction IDs, phone numbers, and digits
 * - Strips corporate entity suffixes (pvt ltd, limited, corp, etc.)
 * - Strips punctuation, symbols, and extra whitespace
 *
 * @param {string|any} raw - Raw merchant or statement narration string
 * @returns {string} - Deterministic, normalized merchant key
 */
const normalizeMerchant = (raw) => {
  if (!raw || typeof raw !== "string") {
    return "";
  }

  let s = raw.trim().toLowerCase();
  if (!s) return "";

  // 1. Check for standard Indian UPI statement formats:
  // e.g., "UPI/DR/48392019/SWIGGY/swiggy@icici/Order" -> "swiggy"
  // e.g., "UPI-CR-12345-ZOMATO-zomato@hdfc-Payment" -> "zomato"
  // e.g., "TRANSFER TO JOHN DOE 9876543210" -> "john doe"
  const upiCandidateMatch =
    s.match(/upi[-/](?:cr|dr|p2m|p2p)[-/][^/-]*[-/]([a-z0-9\s._]+)/i) ||
    s.match(/upi[-/]([a-z0-9\s._]+?)[-/]/i) ||
    s.match(/transfer\s+(?:to|from)\s+([a-z0-9\s._]+)/i);

  if (upiCandidateMatch && upiCandidateMatch[1]) {
    const candidate = upiCandidateMatch[1].trim();
    // Validate candidate has letters and is not just digits or routing tokens
    const lettersOnly = candidate.replace(/[^a-z]/g, "");
    if (lettersOnly.length >= 2 && !["cr", "dr", "upi", "imps", "neft"].includes(lettersOnly)) {
      s = candidate;
    }
  }

  // 2. Strip VPA handles (e.g. user@okaxis, swiggy@icici)
  s = s.replace(/[a-z0-9._-]+@[a-z0-9._-]+/gi, " ");

  // 3. Strip transaction/channel prefixes at word start (handles stacked e.g. ACH/NACH/ or IMPS/P2A/)
  s = s.replace(
    /^(?:(?:upi|neft|rtgs|imps|pos|ach|nach|e-mandate|autopay|transfer\s+(?:to|from))[\s/:-]+)+/gi,
    ""
  );
  s = s.trim();
  s = s.replace(/^(?:cr|dr|p2m|p2p|p2a)[\s/:-]+/gi, "");
  s = s.trim();
  s = s.replace(/\b(cr|dr|p2m|p2p|p2a)\b/gi, " ");

  // 4. Strip card masking patterns (e.g., 401234xxxx1234, xx1234)
  s = s.replace(/\b\d{4,6}[x*]+\d{2,6}\b/gi, " ");
  s = s.replace(/[x*]{3,}/gi, " ");

  // 5. Strip corporate entity suffixes
  s = s.replace(/\b(pvt\s+ltd|private\s+limited|pvt|ltd|limited|inc|corp|co|llp)\b/gi, " ");

  // 6. Strip all digits and reference numbers
  s = s.replace(/\d+/g, " ");

  // 7. Strip punctuation and special symbols
  s = s.replace(/[^\w\s]|_/g, " ");

  // 8. Collapse whitespace and trim
  s = s.replace(/\s+/g, " ").trim();

  return s;
};

module.exports = {
  normalizeMerchant,
};
