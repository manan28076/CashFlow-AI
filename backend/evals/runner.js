/**
 * CashFlow AI - Comprehensive Evaluation Harness Runner
 * 
 * Usage:
 *   node evals/runner.js [options]
 * 
 * Options:
 *   --suite <text2sql|categorization|anomaly|agent|all> (default: all)
 *   --limit <number> (limit items per suite)
 *   --concurrency <number> (default: 2)
 *   --model <model-name> (Gemini model to evaluate)
 *   --compare <path-to-previous-results.json>
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");

const { compareResultSets, scoreCategorization, scoreAnomaly, scoreAgent } = require("./scoring");
const { compareRuns, printComparisonTable } = require("./compare");
const { detectAnomalies } = require("../src/modules/ai/utils/anomaly");
const { generateSafeSql, executeSafeSelect } = require("../src/modules/ai/utils/sqlGuard");
const { categoryAgent } = require("../src/modules/ai/agents/category.agent");
const { runFinanceAgent } = require("../src/modules/ai/agents/finance.agent");

// Parse CLI flags
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    suite: "all",
    limit: Infinity,
    concurrency: 2,
    model: process.env.GEMINI_EVAL_MODEL || "gemini-2.5-flash",
    compare: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--suite" && args[i + 1]) options.suite = args[++i];
    else if (args[i] === "--limit" && args[i + 1]) options.limit = parseInt(args[++i], 10);
    else if (args[i] === "--concurrency" && args[i + 1]) options.concurrency = parseInt(args[++i], 10);
    else if (args[i] === "--model" && args[i + 1]) options.model = args[++i];
    else if (args[i] === "--compare" && args[i + 1]) options.compare = args[++i];
  }

  return options;
}

function getGitCommit() {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "uncommitted";
  }
}

async function runAnomalySuite(limit) {
  const datasetPath = path.join(__dirname, "datasets", "anomaly.json");
  const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf-8")).slice(0, limit);

  const results = [];
  let passed = 0;
  const startTime = Date.now();

  for (const item of dataset) {
    const itemStart = Date.now();
    try {
      const report = detectAnomalies(item.transactions);
      const flagged = report.flagged || [];
      const flaggedIds = flagged.map((a) => a.id);
      const methods = {};
      flagged.forEach((a) => {
        methods[a.id] = a.method;
      });

      const score = scoreAnomaly(flaggedIds, methods, item.expectedFlaggedIds, item.expectedMethods);
      if (score.pass) passed++;

      results.push({
        id: item.id,
        name: item.name,
        pass: score.pass,
        reason: score.reason,
        latencyMs: Date.now() - itemStart,
      });
    } catch (err) {
      results.push({
        id: item.id,
        name: item.name,
        pass: false,
        reason: err.message,
        latencyMs: Date.now() - itemStart,
      });
    }
  }

  const durationMs = Date.now() - startTime;
  return {
    total: dataset.length,
    passed,
    accuracy: dataset.length > 0 ? (passed / dataset.length) * 100 : 0,
    avgLatencyMs: dataset.length > 0 ? durationMs / dataset.length : 0,
    results,
  };
}

async function runText2SqlSuite(limit, prismaEval, evalUserId) {
  const datasetPath = path.join(__dirname, "datasets", "text2sql.json");
  const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf-8")).slice(0, limit);

  if (!prismaEval) {
    return {
      status: "SKIPPED",
      reason: "DATABASE_URL_EVAL is not configured or live eval database is unavailable.",
      total: dataset.length,
      passed: 0,
      accuracy: 0,
      results: [],
    };
  }

  const results = [];
  let passed = 0;
  const categories = {};
  const startTime = Date.now();

  for (const item of dataset) {
    const itemStart = Date.now();
    if (!categories[item.tag]) {
      categories[item.tag] = { total: 0, passed: 0 };
    }
    categories[item.tag].total++;

    try {
      // Adversarial or unanswerable expectations
      if (item.expectReject) {
        let rejected = false;
        try {
          const sqlRes = await generateSafeSql(item.question, evalUserId);
          if (sqlRes.startsWith("-- UNSAFE") || sqlRes.startsWith("-- OUT_OF_SCOPE") || sqlRes.startsWith("-- ERROR")) {
            rejected = true;
          } else {
            await executeSafeSelect(sqlRes, evalUserId);
          }
        } catch {
          rejected = true;
        }

        if (rejected) {
          passed++;
          categories[item.tag].passed++;
          results.push({ id: item.id, tag: item.tag, pass: true, latencyMs: Date.now() - itemStart });
        } else {
          results.push({
            id: item.id,
            tag: item.tag,
            pass: false,
            reason: "Expected query to be rejected, but it succeeded.",
            latencyMs: Date.now() - itemStart,
          });
        }
        continue;
      }

      // Valid text-to-sql generation and execution comparison
      const generatedSql = await generateSafeSql(item.question, evalUserId);
      const actualRows = await executeSafeSelect(generatedSql, evalUserId);
      const expectedRows = await executeSafeSelect(item.referenceSql, evalUserId);

      const comparison = compareResultSets(actualRows, expectedRows);
      if (comparison.pass) {
        passed++;
        categories[item.tag].passed++;
      }

      results.push({
        id: item.id,
        tag: item.tag,
        pass: comparison.pass,
        reason: comparison.reason,
        latencyMs: Date.now() - itemStart,
      });
    } catch (err) {
      results.push({
        id: item.id,
        tag: item.tag,
        pass: false,
        reason: err.message,
        latencyMs: Date.now() - itemStart,
      });
    }
  }

  const durationMs = Date.now() - startTime;
  return {
    total: dataset.length,
    passed,
    accuracy: dataset.length > 0 ? (passed / dataset.length) * 100 : 0,
    avgLatencyMs: dataset.length > 0 ? durationMs / dataset.length : 0,
    categories,
    results,
  };
}

async function runCategorizationSuite(limit, hasApiKey) {
  const datasetPath = path.join(__dirname, "datasets", "categorization.json");
  const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf-8")).slice(0, limit);

  if (!hasApiKey) {
    return {
      status: "SKIPPED",
      reason: "GEMINI_API_KEY is not configured.",
      total: dataset.length,
      passed: 0,
      accuracy: 0,
      results: [],
    };
  }

  const results = [];
  let passed = 0;
  const startTime = Date.now();

  // Test batched in chunks of 10 to respect rate limits
  const chunkSize = 10;
  for (let i = 0; i < dataset.length; i += chunkSize) {
    const chunk = dataset.slice(i, i + chunkSize);
    const mockTxs = chunk.map((item) => ({
      id: item.id,
      merchant: item.merchant,
      description: item.description,
      amount: 100,
    }));

    const chunkStart = Date.now();
    try {
      const categorized = await categoryAgent(mockTxs, null);
      const catMap = new Map();
      categorized.forEach((c) => catMap.set(c.id, c.category));

      for (const item of chunk) {
        const actualCat = catMap.get(item.id);
        const score = scoreCategorization(actualCat, item.expectedCategory);
        if (score.pass) passed++;

        results.push({
          id: item.id,
          merchant: item.merchant,
          expected: item.expectedCategory,
          actual: actualCat,
          pass: score.pass,
          reason: score.reason,
          latencyMs: (Date.now() - chunkStart) / chunk.length,
        });
      }
    } catch (err) {
      for (const item of chunk) {
        results.push({
          id: item.id,
          merchant: item.merchant,
          pass: false,
          reason: err.message,
          latencyMs: (Date.now() - chunkStart) / chunk.length,
        });
      }
    }
  }

  const durationMs = Date.now() - startTime;
  return {
    total: dataset.length,
    passed,
    accuracy: dataset.length > 0 ? (passed / dataset.length) * 100 : 0,
    avgLatencyMs: dataset.length > 0 ? durationMs / dataset.length : 0,
    results,
  };
}

async function runAgentSuite(limit, prismaEval, evalUserId, hasApiKey) {
  const datasetPath = path.join(__dirname, "datasets", "agent.json");
  const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf-8")).slice(0, limit);

  if (!hasApiKey || !prismaEval) {
    return {
      status: "SKIPPED",
      reason: !hasApiKey ? "GEMINI_API_KEY missing" : "DATABASE_URL_EVAL missing",
      total: dataset.length,
      passed: 0,
      accuracy: 0,
      results: [],
    };
  }

  const results = [];
  let passed = 0;
  const startTime = Date.now();

  for (const item of dataset) {
    const itemStart = Date.now();
    try {
      const outcome = await runFinanceAgent({
        message: item.question,
        userId: evalUserId,
      });

      const score = scoreAgent(outcome.steps, outcome.answer, item.expectedTools, item.expectedValues);
      if (score.pass) passed++;

      results.push({
        id: item.id,
        pass: score.pass,
        reason: score.reason,
        stepsCount: outcome.steps?.length || 0,
        latencyMs: Date.now() - itemStart,
      });
    } catch (err) {
      results.push({
        id: item.id,
        pass: false,
        reason: err.message,
        latencyMs: Date.now() - itemStart,
      });
    }
  }

  const durationMs = Date.now() - startTime;
  return {
    total: dataset.length,
    passed,
    accuracy: dataset.length > 0 ? (passed / dataset.length) * 100 : 0,
    avgLatencyMs: dataset.length > 0 ? durationMs / dataset.length : 0,
    results,
  };
}

async function main() {
  const options = parseArgs();

  // If comparison requested, output and exit
  if (options.compare) {
    const prevPath = path.resolve(options.compare);
    if (!fs.existsSync(prevPath)) {
      console.error(`❌ Comparison file not found: ${prevPath}`);
      process.exit(1);
    }
    const prevRun = JSON.parse(fs.readFileSync(prevPath, "utf-8"));
    const latestPath = path.join(__dirname, "results", "latest-summary.json");
    if (!fs.existsSync(latestPath)) {
      console.error(`❌ Latest summary not found at: ${latestPath}`);
      process.exit(1);
    }
    const currentRun = JSON.parse(fs.readFileSync(latestPath, "utf-8"));
    const comparison = compareRuns(currentRun, prevRun);
    printComparisonTable(comparison);
    return;
  }

  console.log("=======================================================");
  console.log("       CASHFLOW AI BENCHMARK EVALUATION HARNESS        ");
  console.log("=======================================================");
  console.log(`Model:       ${options.model}`);
  console.log(`Suite:       ${options.suite}`);
  console.log(`Limit:       ${options.limit === Infinity ? "All" : options.limit}`);
  console.log(`Commit:      ${getGitCommit()}`);
  console.log("-------------------------------------------------------");

  const hasApiKey = Boolean(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("your_"));
  const evalDbUrl = process.env.DATABASE_URL_EVAL;

  let prismaEval = null;
  const evalUserId = "eval_user_fixed_id_2026";

  if (evalDbUrl && evalDbUrl !== process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
    try {
      prismaEval = new PrismaClient({ datasources: { db: { url: evalDbUrl } } });
      await prismaEval.$connect();
      console.log("✅ Connected to isolated eval database.");
    } catch (e) {
      console.warn("⚠️ Failed to connect to DATABASE_URL_EVAL:", e.message);
      prismaEval = null;
    }
  } else {
    console.log("ℹ️ DATABASE_URL_EVAL not set (or equal to production). DB suites will be marked as SKIPPED.");
  }

  const outputRun = {
    timestamp: new Date().toISOString(),
    gitCommit: getGitCommit(),
    model: options.model,
    suites: {},
    categories: {},
    summary: {},
  };

  try {
    // 1. Anomaly suite (Pure statistics, always executes deterministically)
    if (options.suite === "all" || options.suite === "anomaly") {
      console.log("\n▶ Running Anomaly Suite...");
      const res = await runAnomalySuite(options.limit);
      outputRun.suites.anomaly = res;
      console.log(`  Passed: ${res.passed}/${res.total} (${res.accuracy.toFixed(1)}%) | Avg Latency: ${res.avgLatencyMs.toFixed(1)}ms`);
    }

    // 2. Text-to-SQL suite
    if (options.suite === "all" || options.suite === "text2sql") {
      console.log("\n▶ Running Text-to-SQL Suite...");
      const res = await runText2SqlSuite(options.limit, prismaEval, evalUserId);
      outputRun.suites.text2sql = res;
      if (res.status === "SKIPPED") {
        console.log(`  [SKIPPED] ${res.reason}`);
      } else {
        console.log(`  Passed: ${res.passed}/${res.total} (${res.accuracy.toFixed(1)}%) | Avg Latency: ${res.avgLatencyMs.toFixed(1)}ms`);
        if (res.categories) {
          Object.entries(res.categories).forEach(([tag, c]) => {
            outputRun.categories[`text2sql_${tag}`] = {
              accuracy: c.total > 0 ? (c.passed / c.total) * 100 : 0,
              passed: c.passed,
              total: c.total,
            };
          });
        }
      }
    }

    // 3. Categorization suite
    if (options.suite === "all" || options.suite === "categorization") {
      console.log("\n▶ Running Categorization Suite...");
      const res = await runCategorizationSuite(options.limit, hasApiKey);
      outputRun.suites.categorization = res;
      if (res.status === "SKIPPED") {
        console.log(`  [SKIPPED] ${res.reason}`);
      } else {
        console.log(`  Passed: ${res.passed}/${res.total} (${res.accuracy.toFixed(1)}%) | Avg Latency: ${res.avgLatencyMs.toFixed(1)}ms`);
      }
    }

    // 4. Agent suite
    if (options.suite === "all" || options.suite === "agent") {
      console.log("\n▶ Running Agent Multi-Step Trajectory Suite...");
      const res = await runAgentSuite(options.limit, prismaEval, evalUserId, hasApiKey);
      outputRun.suites.agent = res;
      if (res.status === "SKIPPED") {
        console.log(`  [SKIPPED] ${res.reason}`);
      } else {
        console.log(`  Passed: ${res.passed}/${res.total} (${res.accuracy.toFixed(1)}%) | Avg Latency: ${res.avgLatencyMs.toFixed(1)}ms`);
      }
    }

    // Compute overall summary
    let totalItems = 0;
    let totalPassed = 0;
    Object.values(outputRun.suites).forEach((s) => {
      if (s.status !== "SKIPPED") {
        totalItems += s.total || 0;
        totalPassed += s.passed || 0;
      }
    });

    outputRun.summary = {
      totalEvaluated: totalItems,
      totalPassed,
      overallAccuracy: totalItems > 0 ? (totalPassed / totalItems) * 100 : 0,
    };

    console.log("\n=======================================================");
    console.log("                   SUMMARY RESULTS                     ");
    console.log("=======================================================");
    const summaryRows = Object.entries(outputRun.suites).map(([suite, s]) => ({
      Suite: suite,
      Status: s.status || "COMPLETED",
      Passed: s.status === "SKIPPED" ? "N/A" : `${s.passed}/${s.total}`,
      Accuracy: s.status === "SKIPPED" ? "N/A" : `${s.accuracy.toFixed(1)}%`,
      AvgLatency: s.status === "SKIPPED" ? "N/A" : `${s.avgLatencyMs.toFixed(1)}ms`,
    }));
    console.table(summaryRows);

    // Save results
    const resultsDir = path.join(__dirname, "results");
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const timestampStr = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = path.join(resultsDir, `${timestampStr}.json`);
    const summaryPath = path.join(resultsDir, "latest-summary.json");

    fs.writeFileSync(filePath, JSON.stringify(outputRun, null, 2));
    fs.writeFileSync(summaryPath, JSON.stringify(outputRun, null, 2));
    console.log(`\n📄 Benchmark saved to: ${filePath}`);
    console.log(`📌 Updated latest summary: ${summaryPath}`);
  } finally {
    if (prismaEval) {
      await prismaEval.$disconnect();
    }
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("❌ Evaluation runner failed:", err);
    process.exit(1);
  });
}

module.exports = {
  runAnomalySuite,
  runText2SqlSuite,
  runCategorizationSuite,
  runAgentSuite,
  main,
};
