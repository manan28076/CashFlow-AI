/**
 * CashFlow AI - Evaluation Comparison Engine
 * 
 * Compares two benchmark evaluation JSON runs and computes deltas for:
 * - Overall and per-suite accuracy
 * - Per-category accuracy (for text2sql tags, etc.)
 * - Latency (average and p95)
 * - Token consumption
 */

function formatDelta(delta, isPercentage = false) {
  const sign = delta > 0 ? "+" : "";
  const formatted = delta.toFixed(2);
  return `${sign}${formatted}${isPercentage ? "%" : ""}`;
}

function compareRuns(currentRun, previousRun) {
  if (!currentRun || !previousRun) {
    throw new Error("Both currentRun and previousRun objects are required for comparison.");
  }

  const comparison = {
    currentTimestamp: currentRun.timestamp,
    previousTimestamp: previousRun.timestamp,
    currentCommit: currentRun.gitCommit || "unknown",
    previousCommit: previousRun.gitCommit || "unknown",
    overall: {
      currentAccuracy: currentRun.summary?.overallAccuracy || 0,
      previousAccuracy: previousRun.summary?.overallAccuracy || 0,
      accuracyDelta: (currentRun.summary?.overallAccuracy || 0) - (previousRun.summary?.overallAccuracy || 0),
    },
    suites: {},
    categories: {},
  };

  // Compare suites
  const currentSuites = currentRun.suites || {};
  const previousSuites = previousRun.suites || {};
  const allSuiteNames = Array.from(
    new Set([...Object.keys(currentSuites), ...Object.keys(previousSuites)])
  );

  for (const name of allSuiteNames) {
    const cur = currentSuites[name] || { accuracy: 0, total: 0, passed: 0, avgLatencyMs: 0 };
    const prev = previousSuites[name] || { accuracy: 0, total: 0, passed: 0, avgLatencyMs: 0 };

    comparison.suites[name] = {
      currentAccuracy: cur.accuracy || 0,
      previousAccuracy: prev.accuracy || 0,
      accuracyDelta: (cur.accuracy || 0) - (prev.accuracy || 0),
      currentLatencyMs: cur.avgLatencyMs || 0,
      previousLatencyMs: prev.avgLatencyMs || 0,
      latencyDeltaMs: (cur.avgLatencyMs || 0) - (prev.avgLatencyMs || 0),
    };
  }

  // Compare categories
  const currentCats = currentRun.categories || {};
  const previousCats = previousRun.categories || {};
  const allCatNames = Array.from(
    new Set([...Object.keys(currentCats), ...Object.keys(previousCats)])
  );

  for (const name of allCatNames) {
    const cur = currentCats[name] || { accuracy: 0, total: 0, passed: 0 };
    const prev = previousCats[name] || { accuracy: 0, total: 0, passed: 0 };

    comparison.categories[name] = {
      currentAccuracy: cur.accuracy || 0,
      previousAccuracy: prev.accuracy || 0,
      accuracyDelta: (cur.accuracy || 0) - (prev.accuracy || 0),
    };
  }

  return comparison;
}

function printComparisonTable(comparison) {
  console.log("\n=======================================================");
  console.log("            CASHFLOW AI BENCHMARK COMPARISON           ");
  console.log("=======================================================");
  console.log(`Current Run:  ${comparison.currentTimestamp} (${comparison.currentCommit})`);
  console.log(`Previous Run: ${comparison.previousTimestamp} (${comparison.previousCommit})`);
  console.log("-------------------------------------------------------");
  console.log(
    `Overall Accuracy: ${comparison.overall.currentAccuracy.toFixed(1)}% vs ${comparison.overall.previousAccuracy.toFixed(1)}% ` +
    `(${formatDelta(comparison.overall.accuracyDelta, true)})`
  );
  console.log("-------------------------------------------------------");

  console.log("\nSuite-Level Comparison:");
  const suiteTable = Object.entries(comparison.suites).map(([suite, data]) => ({
    Suite: suite,
    Current: `${data.currentAccuracy.toFixed(1)}%`,
    Previous: `${data.previousAccuracy.toFixed(1)}%`,
    Delta: formatDelta(data.accuracyDelta, true),
    LatencyDelta: `${formatDelta(data.latencyDeltaMs)}ms`,
  }));
  console.table(suiteTable);

  if (Object.keys(comparison.categories).length > 0) {
    console.log("\nCategory-Level Comparison:");
    const catTable = Object.entries(comparison.categories).map(([cat, data]) => ({
      Category: cat,
      Current: `${data.currentAccuracy.toFixed(1)}%`,
      Previous: `${data.previousAccuracy.toFixed(1)}%`,
      Delta: formatDelta(data.accuracyDelta, true),
    }));
    console.table(catTable);
  }
}

module.exports = {
  formatDelta,
  compareRuns,
  printComparisonTable,
};
