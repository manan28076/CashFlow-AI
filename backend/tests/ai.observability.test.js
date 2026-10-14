const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

describe("Phase 7: End-to-End Observability & Architectural Hygiene", () => {
  it("should ensure zero direct Gemini SDK instantiation or generateContent calls outside gemini.service.js", () => {
    const srcDir = path.resolve(__dirname, "../src");

    function scanFiles(dir) {
      let results = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results = results.concat(scanFiles(fullPath));
        } else if (file.endsWith(".js")) {
          results.push(fullPath);
        }
      }
      return results;
    }

    const allJsFiles = scanFiles(srcDir);
    const violations = [];

    const allowedFile = path.normalize("src/modules/ai/services/gemini.service.js");

    for (const filePath of allJsFiles) {
      const normalized = path.normalize(filePath);
      if (normalized.endsWith(allowedFile)) {
        continue;
      }

      const content = fs.readFileSync(filePath, "utf-8");

      // Check for illegal direct SDK usage
      if (content.includes('@google/genai"') || content.includes("@google/genai'")) {
        violations.push(`${filePath}: direct require of @google/genai`);
      }
      if (content.includes("new GoogleGenAI")) {
        violations.push(`${filePath}: direct instantiation of GoogleGenAI`);
      }
      if (content.includes(".models.generateContent")) {
        violations.push(`${filePath}: direct call to .models.generateContent`);
      }
      if (content.includes(".models.embedContent")) {
        violations.push(`${filePath}: direct call to .models.embedContent`);
      }
    }

    assert.equal(
      violations.length,
      0,
      `Found direct Gemini SDK usage outside central wrapper: \n${violations.join("\n")}`
    );
  });

  it("should verify that all agent modules route through callGemini", () => {
    const agentsDir = path.resolve(__dirname, "../src/modules/ai/agents");
    const agentFiles = fs.readdirSync(agentsDir).filter((f) => f.endsWith(".js"));

    assert.ok(agentFiles.length >= 10, "Expected at least 10 agent files in agents directory");

    const bypassedAgents = [];
    for (const file of agentFiles) {
      const content = fs.readFileSync(path.join(agentsDir, file), "utf-8");
      if (!content.includes("callGemini") && !content.includes("askGemini")) {
        bypassedAgents.push(file);
      }
    }

    assert.equal(
      bypassedAgents.length,
      0,
      `Agents bypassing central Gemini wrapper: ${bypassedAgents.join(", ")}`
    );
  });
});
