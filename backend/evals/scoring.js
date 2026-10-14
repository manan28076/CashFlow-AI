/**
 * CashFlow AI - Evaluation Scoring Engine
 * 
 * Provides execution-based result set comparison, categorization accuracy checking,
 * anomaly detection scoring, and tool-calling agent trajectory verification.
 */

function normalizeValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") {
    return Math.round(val * 100) / 100;
  }
  if (typeof val === "string") {
    // Check if it's a numeric string
    if (!isNaN(val) && val.trim() !== "") {
      const num = parseFloat(val);
      return Math.round(num * 100) / 100;
    }
    // Check if it's an ISO date string
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
      return val.slice(0, 10);
    }
    return val.trim().toLowerCase();
  }
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }
  if (typeof val === "bigint") {
    return Number(val);
  }
  return String(val).trim().toLowerCase();
}

function normalizeRow(row) {
  if (!row || typeof row !== "object") return {};
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[key.toLowerCase().trim()] = normalizeValue(value);
  }
  return normalized;
}

function rowToKey(row) {
  const sortedKeys = Object.keys(row).sort();
  const pairs = sortedKeys.map((k) => `${k}:${row[k]}`);
  return pairs.join("|");
}

/**
 * Execution-based comparison between actual database rows and reference SQL rows.
 * Compares semantic content rather than raw SQL text.
 */
function compareResultSets(actualRows = [], expectedRows = [], options = {}) {
  const { orderSensitive = false, tolerance = 0.05 } = options;

  if (!Array.isArray(actualRows) || !Array.isArray(expectedRows)) {
    return {
      pass: false,
      reason: "Both actual and expected rows must be arrays.",
      actualCount: Array.isArray(actualRows) ? actualRows.length : 0,
      expectedCount: Array.isArray(expectedRows) ? expectedRows.length : 0,
    };
  }

  if (actualRows.length !== expectedRows.length) {
    return {
      pass: false,
      reason: `Row count mismatch: received ${actualRows.length}, expected ${expectedRows.length}`,
      actualCount: actualRows.length,
      expectedCount: expectedRows.length,
    };
  }

  if (actualRows.length === 0 && expectedRows.length === 0) {
    return { pass: true, actualCount: 0, expectedCount: 0 };
  }

  const normActual = actualRows.map(normalizeRow);
  const normExpected = expectedRows.map(normalizeRow);

  if (orderSensitive) {
    for (let i = 0; i < normActual.length; i++) {
      const act = normActual[i];
      const exp = normExpected[i];
      const expKeys = Object.keys(exp);
      for (const k of expKeys) {
        if (!(k in act)) {
          return {
            pass: false,
            reason: `Row ${i} missing expected column '${k}'`,
            actualCount: actualRows.length,
            expectedCount: expectedRows.length,
          };
        }
        if (typeof exp[k] === "number" && typeof act[k] === "number") {
          if (Math.abs(act[k] - exp[k]) > tolerance) {
            return {
              pass: false,
              reason: `Row ${i} column '${k}' mismatch: got ${act[k]}, expected ${exp[k]}`,
              actualCount: actualRows.length,
              expectedCount: expectedRows.length,
            };
          }
        } else if (act[k] !== exp[k]) {
          return {
            pass: false,
            reason: `Row ${i} column '${k}' mismatch: got '${act[k]}', expected '${exp[k]}'`,
            actualCount: actualRows.length,
            expectedCount: expectedRows.length,
          };
        }
      }
    }
    return { pass: true, actualCount: actualRows.length, expectedCount: expectedRows.length };
  }

  // Order-insensitive multiset comparison
  const expectedMap = new Map();
  for (const row of normExpected) {
    const key = rowToKey(row);
    expectedMap.set(key, (expectedMap.get(key) || 0) + 1);
  }

  const unmatchedActual = [];
  for (const row of normActual) {
    const key = rowToKey(row);
    if (expectedMap.has(key) && expectedMap.get(key) > 0) {
      expectedMap.set(key, expectedMap.get(key) - 1);
    } else {
      unmatchedActual.push(row);
    }
  }

  if (unmatchedActual.length > 0) {
    return {
      pass: false,
      reason: `Unmatched row in result set: ${JSON.stringify(unmatchedActual[0])}`,
      actualCount: actualRows.length,
      expectedCount: expectedRows.length,
    };
  }

  return { pass: true, actualCount: actualRows.length, expectedCount: expectedRows.length };
}

/**
 * Score categorization against ground-truth category.
 */
function scoreCategorization(actualCategory, expectedCategory) {
  if (!actualCategory || typeof actualCategory !== "string") {
    return { pass: false, reason: "Missing or invalid actual category" };
  }
  const normActual = actualCategory.trim().toLowerCase();
  const normExpected = expectedCategory.trim().toLowerCase();
  const pass = normActual === normExpected;
  return {
    pass,
    reason: pass ? undefined : `Expected '${expectedCategory}', got '${actualCategory}'`,
  };
}

/**
 * Score anomaly detection against expected flags and detection methods.
 */
function scoreAnomaly(actualFlaggedIds = [], actualMethods = {}, expectedFlaggedIds = [], expectedMethods = {}) {
  const actualSet = new Set(actualFlaggedIds);
  const expectedSet = new Set(expectedFlaggedIds);

  if (actualSet.size !== expectedSet.size) {
    return {
      pass: false,
      reason: `Anomaly count mismatch: flagged ${actualSet.size}, expected ${expectedSet.size}`,
    };
  }

  for (const id of expectedSet) {
    if (!actualSet.has(id)) {
      return { pass: false, reason: `Failed to flag expected anomaly id '${id}'` };
    }
    if (expectedMethods[id] && actualMethods[id] !== expectedMethods[id]) {
      return {
        pass: false,
        reason: `Anomaly method mismatch for '${id}': got '${actualMethods[id]}', expected '${expectedMethods[id]}'`,
      };
    }
  }

  return { pass: true };
}

/**
 * Score agent multi-step trajectory and numeric extraction.
 */
function scoreAgent(actualSteps = [], actualAnswer = "", expectedTools = [], expectedValues = {}) {
  const usedTools = new Set(actualSteps.map((s) => s.tool));

  // Check tool presence
  for (const tool of expectedTools) {
    if (!usedTools.has(tool)) {
      return {
        pass: false,
        reason: `Expected tool '${tool}' was not invoked by agent (used: ${Array.from(usedTools).join(", ")})`,
      };
    }
  }

  // Check expected numeric values in answer or steps
  const combinedText = `${actualAnswer} ${JSON.stringify(actualSteps)}`;
  for (const [key, value] of Object.entries(expectedValues)) {
    if (typeof value === "number") {
      // Look for the number formatted with commas or plain
      const plainNum = String(value);
      const commaNum = value.toLocaleString();
      if (!combinedText.includes(plainNum) && !combinedText.includes(commaNum)) {
        return {
          pass: false,
          reason: `Expected numeric value for '${key}' (${value}) not found in agent output/steps`,
        };
      }
    } else if (typeof value === "string") {
      if (!combinedText.toLowerCase().includes(value.toLowerCase())) {
        return {
          pass: false,
          reason: `Expected text for '${key}' ('${value}') not found in agent output/steps`,
        };
      }
    }
  }

  return { pass: true };
}

module.exports = {
  normalizeValue,
  normalizeRow,
  rowToKey,
  compareResultSets,
  scoreCategorization,
  scoreAnomaly,
  scoreAgent,
};
