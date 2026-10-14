/**
 * India Tax Knowledge Base Ingestion Script
 * 
 * Usage:
 *   npm run ingest:knowledge
 */

require("dotenv").config();
const path = require("path");
const { ingestKnowledgeDirectory } = require("../src/modules/ai/services/taxRag.service");

async function main() {
  console.log("=======================================================");
  console.log("       CASHFLOW AI: TAX KNOWLEDGE BASE INGESTION       ");
  console.log("=======================================================");

  const targetDir = path.resolve(__dirname, "../knowledge/in-tax");
  console.log(`Target Directory: ${targetDir}`);

  const result = await ingestKnowledgeDirectory(targetDir);

  if (result.status === "empty") {
    console.log(`ℹ️ ${result.message}`);
    console.log("To add documents, place official tax markdown files in backend/knowledge/in-tax/");
    console.log("See backend/knowledge/in-tax/README.md for required front-matter specifications.");
    return;
  }

  console.log("\n✅ Ingestion Results:");
  console.log(`- Processed Documents: ${result.processedCount}`);
  console.log(`- Skipped Unchanged:   ${result.skippedCount}`);
  console.log(`- Chunks Generated:    ${result.chunksCreated}`);
}

main().catch((err) => {
  console.error("❌ Knowledge ingestion failed:", err);
  process.exit(1);
});
