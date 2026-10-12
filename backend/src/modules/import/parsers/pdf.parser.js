const { PDFDocument } = require("pdf-lib");
const AppError = require("../../../errors/AppError");
const { askGeminiStructured } = require("../../ai/services/gemini.service");
const { safeParseJSON } = require("../../ai/utils/jsonParser");

/**
 * Split a PDF buffer into chunks of 3 pages and extract transactions using Gemini multimodal API.
 * Concurrency: up to 3 chunks in parallel.
 * Max pages: 40.
 */
const parsePdfStatement = async (buffer) => {
  let srcDoc;
  try {
    srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });
  } catch (err) {
    const msg = (err && err.message) ? err.message.toLowerCase() : "";
    if (msg.includes("encrypt") || msg.includes("password")) {
      throw new AppError(
        "This PDF is password-protected. Please open it in Google Chrome, enter your password, click Print → Save as PDF, and upload that unlocked PDF.",
        400
      );
    }
    throw new AppError("Failed to read PDF file. Ensure it is a valid, uncorrupted PDF document.", 400);
  }

  // Check if encrypted
  if (srcDoc.isEncrypted) {
    throw new AppError(
      "This PDF is password-protected. Please open it in Google Chrome, enter your password, click Print → Save as PDF, and upload that unlocked PDF.",
      400
    );
  }

  const totalPages = srcDoc.getPageCount();
  if (totalPages === 0) {
    throw new AppError("The uploaded PDF has no pages.", 400);
  }
  if (totalPages > 40) {
    throw new AppError("Statement exceeds maximum 40 pages limit. Please upload a shorter statement period.", 400);
  }

  // Chunk pages into groups of 3
  const chunkSize = 3;
  const chunkRanges = [];
  for (let i = 0; i < totalPages; i += chunkSize) {
    const end = Math.min(i + chunkSize, totalPages);
    chunkRanges.push({ start: i, end });
  }

  // Process a chunk of pages
  const processChunk = async ({ start, end }) => {
    const subDoc = await PDFDocument.create();
    const pageIndices = [];
    for (let p = start; p < end; p++) {
      pageIndices.push(p);
    }
    const copiedPages = await subDoc.copyPages(srcDoc, pageIndices);
    copiedPages.forEach((p) => subDoc.addPage(p));
    const subPdfBytes = await subDoc.save();
    const base64Data = Buffer.from(subPdfBytes).toString("base64");

    const promptText = `
You are an expert financial auditor extracting transactions from an Indian bank/UPI/wallet statement (pages ${start + 1} to ${end}).
Extract all individual financial debit and credit transactions.
Ignore opening balances, closing balances, summary sections, headers, ads, and total rows.
For each transaction, return a JSON array of objects with the exact schema:
[
  {
    "date": "YYYY-MM-DD",
    "description": "Full narration or raw description as written",
    "debit": null or positive number (if money was spent/withdrawn/transferred out),
    "credit": null or positive number (if money was received/deposited/transferred in)
  }
]
Rules:
1. Indian statement dates are often DD/MM/YYYY or DD-MM-YYYY or DD MMM YYYY. Convert all dates strictly to YYYY-MM-DD.
2. If debit is recorded, debit must be a positive number and credit must be null (or 0).
3. If credit is recorded, credit must be a positive number and debit must be null (or 0).
4. If neither debit nor credit is recorded, or it is a summary line, SKIP it.
5. Do NOT hallucinate transactions. Return an empty array [] if no transactions exist on these pages.
Return ONLY valid JSON.
`;

    const contents = [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: "application/pdf",
            },
          },
          {
            text: promptText,
          },
        ],
      },
    ];

    const rawResponse = await askGeminiStructured({
      contents,
      jsonMode: true,
      temperature: 0,
    });

    const parsed = safeParseJSON(rawResponse);
    return Array.isArray(parsed) ? parsed : [];
  };

  // Run with concurrency limit of 3
  const results = [];
  const concurrency = 3;
  for (let i = 0; i < chunkRanges.length; i += concurrency) {
    const batch = chunkRanges.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((range) => processChunk(range)));
    for (const chunkResult of batchResults) {
      results.push(...chunkResult);
    }
  }

  return results;
};

module.exports = {
  parsePdfStatement,
};
