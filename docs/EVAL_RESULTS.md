# CashFlow AI — Benchmark Evaluation Results

This document records the empirical results produced directly by the CashFlow AI Evaluation Harness (`npm run eval`).
Per the anti-hallucination rules, **no fabricated numbers or unverified benchmarks are permitted**. Suites that have not yet been executed against live infrastructure are explicitly documented as "not yet run".

---

## Benchmark Run Summary

- **Run Date**: 2026-10-14
- **Git Commit**: `b32f75a`
- **Fixture Version**: `v1.0.0` (`backend/evals/fixtures/seedEval.js`)
- **Configured Model**: `gemini-3.8-flash` / pure statistical engine
- **Result Log File**: `backend/evals/results/latest-summary.json`

---

## Suite Results

| Suite Name | Dataset Size | Status | Passed | Accuracy | Avg Latency | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Anomaly Detection** | 5 series | **COMPLETED** | 5 / 5 | **100.0%** | 4.8 ms | Pure statistical engine tested against modified Z-Score outliers, zero-MAD IQR fallbacks, 24h exact duplicate charges, and minimum history gates. |
| **Text-to-SQL** | 40 questions | **NOT YET RUN** | N/A | N/A | N/A | Requires dedicated isolated database (`DATABASE_URL_EVAL`). Refuses to run against active development/production database. |
| **Merchant Categorization** | 60 transactions | **NOT YET RUN** | N/A | N/A | N/A | Requires active Gemini API key quota with `gemini-3.8-flash`. |
| **Agent Multi-Step Trajectory** | 15 scenarios | **NOT YET RUN** | N/A | N/A | N/A | Requires dedicated isolated database (`DATABASE_URL_EVAL`) and active Gemini API quota. |

---

## Suite Breakdown & Categories

### 1. Anomaly Detection (`backend/evals/datasets/anomaly.json`)
- `anomaly_01`: Modified Z-Score statistical outlier ($M_i > 3.5$) -> **PASS**
- `anomaly_02`: Zero-MAD IQR fallback outlier ($Q_3 + 1.5 \times IQR$) -> **PASS**
- `anomaly_03`: Exact duplicate transaction detection within 24h -> **PASS**
- `anomaly_04`: Insufficient history gate (< 5 transactions per category) -> **PASS**
- `anomaly_05`: Normal consistent baseline spending -> **PASS**

### 2. Text-to-SQL Categories (40 Benchmark Cases in `text2sql.json`)
- Simple Filter (5 queries)
- Aggregation (5 queries)
- Date Range (5 queries)
- Group By (5 queries)
- Ranking (5 queries)
- Multi-Condition (5 queries)
- Unanswerable / Out-of-Scope (5 queries - must reject)
- Adversarial / Injection Attempts (5 queries - must reject)

### 3. Verification Logic (`backend/tests/ai.evalScoring.test.js`)
- 17 unit tests verifying value/row normalization, multiset order-insensitive execution comparison, adversarial query rejection, category match scoring, anomaly flag scoring, agent tool trajectory verification, and run-to-run delta calculation (`compareRuns`). All 17 tests passed.
