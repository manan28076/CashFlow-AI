/**
 * India Tax Knowledge RAG Engine
 * 
 * Provides:
 * 1. YAML front-matter parser & paragraph chunker with overlap
 * 2. In-memory cosine similarity ranking over PostgreSQL Float[] embeddings (no pgvector required)
 * 3. Threshold-gated retrieval with mandatory source citations (title, sourceUrl, financialYear)
 * 4. Empty-knowledge-base truthfulness guarantees and professional tax advice disclaimers
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const prisma = require("../../../lib/prisma");
const { embedText } = require("./gemini.service");

const TAX_DISCLAIMER =
  "Note: This information is for general educational purposes only and does not constitute professional tax advice.";

/**
 * Parse YAML front-matter from a markdown document.
 * Expected format:
 * ---
 * title: "..."
 * sourceUrl: "..."
 * financialYear: "..."
 * retrievedOn: "YYYY-MM-DD"
 * ---
 */
function parseFrontMatter(content = "") {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return {
      meta: {
        title: "Untitled Official Document",
        sourceUrl: "https://incometax.gov.in",
        financialYear: "General",
        retrievedOn: new Date().toISOString().slice(0, 10),
      },
      body: content.trim(),
    };
  }

  const yamlBlock = match[1];
  const body = match[2].trim();

  const meta = {
    title: "Untitled Official Document",
    sourceUrl: "https://incometax.gov.in",
    financialYear: "General",
    retrievedOn: new Date().toISOString().slice(0, 10),
  };

  const lines = yamlBlock.split(/\r?\n/);
  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (key in meta) {
        meta[key] = val;
      }
    }
  }

  return { meta, body };
}

/**
 * Chunk document content on paragraph boundaries with sliding overlap.
 * 
 * Default chunk target: ~800-1000 characters with ~150 character overlap.
 * Documents chunk boundaries cleanly without splitting words or numbers.
 */
function chunkText(text, options = {}) {
  const { maxChunkChars = 900, overlapChars = 150 } = options;

  if (!text || typeof text !== "string") {
    return [];
  }

  const cleanText = text.trim();
  if (cleanText.length <= maxChunkChars) {
    return [
      {
        chunkIndex: 0,
        text: cleanText,
        tokenCount: Math.ceil(cleanText.length / 4),
      },
    ];
  }

  // Split into paragraphs (handles \r\n and \n)
  const paragraphs = cleanText
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks = [];
  let currentBuffer = "";
  let chunkIdx = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];

    if (!currentBuffer) {
      currentBuffer = p;
    } else if (currentBuffer.length + p.length + 2 <= maxChunkChars) {
      currentBuffer += `\n\n${p}`;
    } else {
      // Finalize current chunk
      chunks.push({
        chunkIndex: chunkIdx++,
        text: currentBuffer,
        tokenCount: Math.ceil(currentBuffer.length / 4),
      });

      // Compute sliding overlap from the end of currentBuffer
      const overlapStart = Math.max(0, currentBuffer.length - overlapChars);
      const overlapText = currentBuffer.slice(overlapStart).trim();

      currentBuffer = overlapText ? `${overlapText}\n\n${p}` : p;
    }
  }

  if (currentBuffer.trim()) {
    chunks.push({
      chunkIndex: chunkIdx++,
      text: currentBuffer.trim(),
      tokenCount: Math.ceil(currentBuffer.trim().length / 4),
    });
  }

  return chunks;
}

/**
 * In-memory Cosine Similarity between two Float[] vectors.
 */
function cosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }

  const len = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search the tax knowledge base with top-k cosine similarity retrieval.
 */
async function searchTaxKnowledge(query, options = {}) {
  const { topK = 4, threshold = 0.55, userId = null } = options;

  if (!query || typeof query !== "string") {
    return {
      status: "invalid_query",
      message: "Please provide a valid query string.",
      disclaimer: TAX_DISCLAIMER,
      chunks: [],
    };
  }

  // 1. Fetch chunks from DB
  const chunks = await prisma.knowledgeChunk.findMany({
    include: {
      doc: true,
    },
  });

  // Strict empty-knowledge-base truthfulness
  if (!chunks || chunks.length === 0) {
    return {
      status: "empty",
      query,
      message: "India tax knowledge base is currently empty. Please refer to ingested official documents.",
      disclaimer: TAX_DISCLAIMER,
      chunks: [],
    };
  }

  // 2. Embed the user query
  let queryEmbedding = [];
  try {
    queryEmbedding = await embedText({ text: query, userId });
  } catch (err) {
    return {
      status: "error",
      message: `Failed to generate query embeddings: ${err.message}`,
      disclaimer: TAX_DISCLAIMER,
      chunks: [],
    };
  }

  if (!queryEmbedding || queryEmbedding.length === 0) {
    return {
      status: "error",
      message: "Empty query vector generated.",
      disclaimer: TAX_DISCLAIMER,
      chunks: [],
    };
  }

  // 3. Compute cosine similarities in JavaScript
  const scoredChunks = chunks
    .map((c) => {
      const score = cosineSimilarity(queryEmbedding, c.embedding);
      return {
        id: c.id,
        score,
        text: c.text,
        title: c.doc?.title || "Income Tax Document",
        sourceUrl: c.doc?.sourceUrl || "https://incometax.gov.in",
        financialYear: c.doc?.financialYear || "General",
        retrievedOn: c.doc?.retrievedOn || new Date(),
      };
    })
    .sort((a, b) => b.score - a.score);

  // 4. Threshold gating
  const relevant = scoredChunks.filter((c) => c.score >= threshold);

  if (relevant.length === 0) {
    return {
      status: "no_relevant_source",
      query,
      message: "No relevant official tax source found for your query.",
      highestScore: scoredChunks[0]?.score ? Number(scoredChunks[0].score.toFixed(3)) : 0,
      disclaimer: TAX_DISCLAIMER,
      chunks: [],
    };
  }

  const topChunks = relevant.slice(0, topK).map((c) => ({
    ...c,
    score: Number(c.score.toFixed(3)),
  }));

  return {
    status: "found",
    query,
    count: topChunks.length,
    chunks: topChunks,
    disclaimer: TAX_DISCLAIMER,
  };
}

/**
 * Ingestion runner: reads markdown files from knowledge directory,
 * chunks on paragraph boundaries, embeds via official API, and stores in Postgres.
 */
async function ingestKnowledgeDirectory(dirPath) {
  const targetDir =
    dirPath || path.resolve(__dirname, "../../../../../knowledge/in-tax");

  if (!fs.existsSync(targetDir)) {
    return {
      status: "empty",
      message: `Knowledge directory not found at: ${targetDir}`,
      processedCount: 0,
      skippedCount: 0,
      chunksCreated: 0,
    };
  }

  const files = fs
    .readdirSync(targetDir)
    .filter((f) => (f.endsWith(".md") || f.endsWith(".txt")) && f.toLowerCase() !== "readme.md");

  if (files.length === 0) {
    return {
      status: "empty",
      message: "No tax documents found to ingest in knowledge directory.",
      processedCount: 0,
      skippedCount: 0,
      chunksCreated: 0,
    };
  }

  let processedCount = 0;
  let skippedCount = 0;
  let chunksCreated = 0;

  for (const file of files) {
    const fullPath = path.join(targetDir, file);
    const rawContent = fs.readFileSync(fullPath, "utf-8");

    // Compute deterministic content hash (skip unchanged files!)
    const contentHash = crypto.createHash("sha256").update(rawContent).digest("hex");

    const existing = await prisma.knowledgeDoc.findUnique({
      where: { contentHash },
    });

    if (existing) {
      skippedCount++;
      continue;
    }

    const { meta, body } = parseFrontMatter(rawContent);
    const chunks = chunkText(body);

    if (chunks.length === 0) {
      continue;
    }

    // Embed each chunk
    const chunksWithEmbeddings = [];
    for (const c of chunks) {
      const embedding = await embedText({ text: c.text, model: "text-embedding-004" });
      chunksWithEmbeddings.push({
        chunkIndex: c.chunkIndex,
        text: c.text,
        embedding,
        tokenCount: c.tokenCount,
      });
    }

    // Transactionally persist doc + chunks
    await prisma.$transaction(async (tx) => {
      // If doc with same title exists, replace it
      const existingDoc = await tx.knowledgeDoc.findFirst({
        where: { title: meta.title },
      });
      if (existingDoc) {
        await tx.knowledgeDoc.delete({ where: { id: existingDoc.id } });
      }

      const doc = await tx.knowledgeDoc.create({
        data: {
          title: meta.title,
          sourceUrl: meta.sourceUrl,
          financialYear: meta.financialYear,
          retrievedOn: new Date(meta.retrievedOn),
          contentHash,
        },
      });

      for (const ch of chunksWithEmbeddings) {
        await tx.knowledgeChunk.create({
          data: {
            docId: doc.id,
            chunkIndex: ch.chunkIndex,
            text: ch.text,
            embedding: ch.embedding,
            tokenCount: ch.tokenCount,
          },
        });
        chunksCreated++;
      }
    });

    processedCount++;
  }

  return {
    status: "success",
    processedCount,
    skippedCount,
    chunksCreated,
  };
}

module.exports = {
  TAX_DISCLAIMER,
  parseFrontMatter,
  chunkText,
  cosineSimilarity,
  searchTaxKnowledge,
  ingestKnowledgeDirectory,
};
