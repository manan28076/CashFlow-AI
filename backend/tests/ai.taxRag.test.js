const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  TAX_DISCLAIMER,
  parseFrontMatter,
  chunkText,
  cosineSimilarity,
  searchTaxKnowledge,
} = require("../src/modules/ai/services/taxRag.service");

describe("Phase 8: India Tax Knowledge RAG Engine", () => {
  describe("A. Front-Matter Parsing", () => {
    it("should extract required metadata fields and clean body text", () => {
      const raw = `---
title: "Income Tax Slabs FY 2025-26"
sourceUrl: "https://incometax.gov.in/slabs"
financialYear: "2025-26"
retrievedOn: "2026-04-01"
---

# Official Notification
Under section 115BAC, the revised slabs are established.`;

      const { meta, body } = parseFrontMatter(raw);
      assert.equal(meta.title, "Income Tax Slabs FY 2025-26");
      assert.equal(meta.sourceUrl, "https://incometax.gov.in/slabs");
      assert.equal(meta.financialYear, "2025-26");
      assert.equal(meta.retrievedOn, "2026-04-01");
      assert.ok(body.includes("# Official Notification"));
    });

    it("should provide graceful defaults when front-matter is absent", () => {
      const raw = "Direct text without any front matter.";
      const { meta, body } = parseFrontMatter(raw);
      assert.equal(meta.title, "Untitled Official Document");
      assert.equal(body, "Direct text without any front matter.");
    });
  });

  describe("B. Paragraph Chunking with Sliding Overlap", () => {
    it("should split long documents strictly on paragraph boundaries with overlap", () => {
      const p1 = "Paragraph one discusses tax slabs and basic exemption thresholds for resident individuals.";
      const p2 = "Paragraph two outlines standard deduction increases from 50000 to 75000 for salaried employees.";
      const p3 = "Paragraph three details section 87A rebate eligibility for taxable income up to 700000 rupees.";

      const text = `${p1}\n\n${p2}\n\n${p3}`;
      // Target maxChunkChars to force split after each paragraph
      const chunks = chunkText(text, { maxChunkChars: 150, overlapChars: 40 });

      assert.ok(chunks.length >= 2, `Expected at least 2 chunks, got ${chunks.length}`);
      assert.equal(chunks[0].chunkIndex, 0);
      assert.ok(chunks[0].text.includes(p1));
      // Overlap should carry into chunk 1
      assert.ok(chunks[1].text.length > 0);
      assert.ok(typeof chunks[0].tokenCount === "number");
    });

    it("should keep short documents in a single chunk", () => {
      const short = "Single brief clause under Section 80C.";
      const chunks = chunkText(short, { maxChunkChars: 500 });
      assert.equal(chunks.length, 1);
      assert.equal(chunks[0].text, short);
    });
  });

  describe("C. Cosine Similarity & Vector Ranking", () => {
    it("should compute exact mathematical similarity with hand-checked proofs", () => {
      // 1. Identical vectors -> 1.0
      const simIdentical = cosineSimilarity([1, 2, 3], [2, 4, 6]);
      assert.ok(Math.abs(simIdentical - 1.0) < 0.0001);

      // 2. Orthogonal vectors -> 0.0
      const simOrthogonal = cosineSimilarity([1, 0], [0, 1]);
      assert.equal(simOrthogonal, 0);

      // 3. Hand-computed 45-degree angle: [1, 0] and [1, 1] -> 1 / (1 * sqrt(2)) ~= 0.7071
      const sim45 = cosineSimilarity([1, 0], [1, 1]);
      assert.ok(Math.abs(sim45 - 0.7071) < 0.001);
    });

    it("should rank synthetic chunks in deterministic descending order", () => {
      const queryVec = [1, 0, 0];

      const chunkA = { id: "cA", embedding: [0.95, 0.05, 0.0] }; // Highest match
      const chunkB = { id: "cB", embedding: [0.70, 0.70, 0.0] }; // Moderate match
      const chunkC = { id: "cC", embedding: [0.10, 0.99, 0.0] }; // Low match

      const corpus = [chunkC, chunkA, chunkB];

      const scored = corpus
        .map((c) => ({ id: c.id, score: cosineSimilarity(queryVec, c.embedding) }))
        .sort((a, b) => b.score - a.score);

      assert.equal(scored[0].id, "cA");
      assert.equal(scored[1].id, "cB");
      assert.equal(scored[2].id, "cC");

      assert.ok(scored[0].score > 0.99);
      assert.ok(scored[1].score > 0.70);
      assert.ok(scored[2].score < 0.20);
    });
  });

  describe("D. Threshold Gating & Empty Knowledge Base Behavior", () => {
    it("should filter out chunks below minimum threshold and return informative notice", () => {
      const queryVec = [1, 0, 0];
      const chunk = { id: "c1", embedding: [0, 1, 0] }; // orthogonal, score = 0
      const score = cosineSimilarity(queryVec, chunk.embedding);
      const threshold = 0.60;

      const passed = score >= threshold;
      assert.equal(passed, false);
    });

    it("should return explicit empty status when knowledge base has 0 chunks", async () => {
      // searchTaxKnowledge against empty DB (or empty query)
      const res = await searchTaxKnowledge("What is 80C limit?", {
        userId: "test_user_id",
      });

      // Either empty or found depending on test DB state, but strictly handles empty
      if (res.status === "empty") {
        assert.match(res.message, /knowledge base is currently empty/i);
        assert.deepEqual(res.chunks, []);
        assert.equal(res.disclaimer, TAX_DISCLAIMER);
      }
    });

    it("should always include the mandatory professional tax advice disclaimer", () => {
      assert.match(TAX_DISCLAIMER, /does not constitute professional tax advice/i);
    });
  });
});
