# CashFlow AI — AI Layer Upgrade Engineering Notes

## Phase 0: System Reconnaissance & Architecture Audit

### 1. Database Schema (`backend/prisma/schema.prisma`)
Exact model and column casing verified:
- **`User`**
  - Columns: `id` (String cuid), `email` (String @unique), `password` (String?), `googleId` (String? @unique), `name` (String?), `avatarUrl` (String?), `plan` (String default "STARTER"), `planBillingCycle` (String?), `subscriptionStatus` (String default "INACTIVE"), `subscriptionStartedAt` (DateTime?), `subscriptionExpiresAt` (DateTime?), `createdAt` (DateTime default now).
  - Relations: `accounts Account[]`, `budgets Budget[]`, `monthlyBudgets MonthlyBudget[]`, `payments SubscriptionPayment[]`.
- **`SubscriptionPayment`**
  - Columns: `id` (String cuid), `userId` (String), `plan` (String), `billingCycle` (String), `amount` (Float), `currency` (String default "INR"), `razorpayOrderId` (String @unique), `razorpayPaymentId` (String? @unique), `razorpaySignature` (String?), `status` (String default "PENDING"), `startedAt` (DateTime), `expiresAt` (DateTime), `createdAt` (DateTime), `updatedAt` (DateTime).
  - Relations: `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`.
- **`Account`**
  - Columns: `id` (String cuid), `name` (String), `bankName` (String), `createdAt` (DateTime), `userId` (String).
  - Relations: `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`, `transactions Transaction[]`.
- **`Category`**
  - Columns: `id` (String cuid), `name` (String @unique), `type` (TransactionType enum `INCOME` | `EXPENSE` default `EXPENSE`).
  - Relations: `transactions Transaction[]`, `budgets Budget[]`.
- **`Transaction`**
  - Columns: `id` (String cuid), `date` (DateTime), `description` (String), `merchant` (String?), `note` (String?), `amount` (Float), `type` (TransactionType enum `INCOME` | `EXPENSE`), `isAnomaly` (Boolean default false), `hash` (String?), `createdAt` (DateTime), `accountId` (String), `categoryId` (String).
  - Relations: `account Account @relation(fields: [accountId], references: [id])`, `category Category @relation(fields: [categoryId], references: [id])`.
  - Indexes: `@@index([accountId, hash])`.
- **`Budget`**
  - Columns: `id` (String cuid), `amount` (Float), `month` (Int), `year` (Int), `createdAt` (DateTime), `updatedAt` (DateTime), `userId` (String), `categoryId` (String).
  - Relations: `user User`, `category Category`.
  - Constraints: `@@unique([userId, categoryId, month, year])`.
- **`MonthlyBudget`**
  - Columns: `id` (String cuid), `amount` (Float), `month` (Int), `year` (Int), `createdAt` (DateTime), `updatedAt` (DateTime), `userId` (String).
  - Constraints: `@@unique([userId, month, year])`.

---

### 2. AI Module Audit (`backend/src/modules/ai/**`)
- **Routes (`ai.routes.js`)**:
  - `POST /api/ai/test` (auth: protect) -> `test`
  - `POST /api/ai/upload` (auth: protect, multipart: statement) -> `uploadStatement`
  - `POST /api/ai/ask` (auth: protect) -> `ask`
  - `POST /api/ai/chat` (auth: protect) -> `chat`
  - `POST /api/ai/quick-add` (auth: protect) -> `parseQuickAdd`
  - `POST /api/ai/live-audit` & `GET /api/ai/live-audit` (auth: protect) -> `liveAudit`
- **Orchestrator (`orchestrator.js`)**:
  - Dispatches `Promise.all` across 5 agents: `categoryAgent`, `insightAgent`, `budgetAgent`, `fraudAgent`, `healthAgent`.
- **Agents (`agents/`)**:
  - `category.agent.js`: calls `askGemini(categoryPrompt(transactions, categoryNames))`, parses with `safeParseJSON`.
  - `fraud.agent.js`: calls `askGemini(fraudPrompt(transactions))`, parses with `safeParseJSON`.
  - `insight.agent.js`: calls `askGemini(insightPrompt(transactions))`, parses with `safeParseJSON`.
  - `budget.agent.js`: calls `askGemini(budgetPrompt(transactions))`, parses with `safeParseJSON`.
  - `health.agent.js`: calls `askGemini(healthPrompt(transactions))`, parses with `safeParseJSON`.
  - `router.agent.js`: calls `askGemini(routerPrompt(message))`, returns `"DATA_QUERY"` or `"GENERAL_ADVICE"`.
  - `sql.agent.js`: calls `askGemini(sqlPrompt(question, userId))`, parses with `safeParseJSON`, calls `assertSafeSelect`.
  - `answer.agent.js`: calls `askGemini(answerPrompt(question, rows))`, parses with `safeParseJSON`.
  - `quickadd.agent.js`: natural language input parser returning `{ amount, type, category, description, date }`.
  - `unified.agent.js`: merges intent classification + text-to-SQL generation in a single prompt for `/api/ai/chat`.

---

### 3. Key Architectural Questions Answered

#### A. How Gemini is currently called
Gemini is called via `backend/src/modules/ai/services/gemini.service.js`. It imports `GoogleGenAI` from `@google/genai` and instantiates a single client `new GoogleGenAI({ apiKey: GEMINI_API_KEY })`. It defines two functions:
1. `askGemini(prompt)`: Iterates through an array of fallback models (`gemini-3-flash-preview`, `gemini-3.1-flash-lite-preview`, `gemini-3.8-flash`, `gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-flash-latest`, `gemini-flash-lite-latest`) calling `ai.models.generateContent({ model, contents: prompt })`.
2. `askGeminiStructured({ contents, jsonMode, temperature })`: Sets `config.responseMimeType = "application/json"` and calls `ai.models.generateContent({ model, contents, config })`.

#### B. How JSON is currently parsed
JSON is parsed through hand-parsing regex in `backend/src/modules/ai/utils/jsonParser.js`:
```js
const safeParseJSON = (text) => {
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
};
```
If `JSON.parse` fails, it throws a generic error `new Error("Invalid JSON returned by AI.")`.

#### C. How user ID reaches the AI code
`backend/src/middlewares/auth.middleware.js` intercepts requests, extracts the JWT Bearer token from `req.headers.authorization`, verifies it with `JWT_SECRET`, checks the database for the user, checks subscription expiry, and sets `req.user = user`.
In `ai.controller.js`, `req.user.id` is extracted and passed to `askQuestion(question, req.user.id)` and `chatWithAgent(message, req.user.id)`.

#### D. What `unified.agent.js` and `quickadd.agent.js` do
- `unified.agent.js`: Evaluates whether a chat message is `DATA_QUERY` or `GENERAL_ADVICE`. If `DATA_QUERY`, generates a safe read-only SQL string referencing the schema (`Account`, `Category`, `Transaction`, `Budget`) and scoped by `userId`. If `GENERAL_ADVICE`, returns an immediate qualitative advice string.
- `quickadd.agent.js`: Takes a raw natural language phrase (e.g. `"zomato 350"` or `"chai 40 yesterday"`), calculates the relative date, categorizes it into allowed seeded categories, and returns `{ amount, type, category, description, date }`.

#### E. What `src/jobs` contains
`src/jobs` contains `subscriptionCron.js`, which uses `node-cron` to run an hourly sweep (`0 * * * *`) that downgrades expired users (`subscriptionExpiresAt < now`) back to `STARTER` and marks abandoned `PENDING` payments older than 24h as `FAILED`.

#### F. Installed but unused dependencies in `package.json`
- `bullmq`: `^5.81.2` (installed, but 0 references in `backend/src`)
- `ioredis`: `^5.11.1` (installed, but 0 references in `backend/src`)
*Per Rule 10 / Phase 0 instructions: we do NOT build on bullmq or ioredis.*

---

### 4. Verification of Installed Library APIs (`@google/genai` v2.15.0)

Verified directly from `backend/node_modules/@google/genai` source (`dist/index.cjs` and `dist/genai.d.ts`):
1. **Calling `generateContent`**:
   `await ai.models.generateContent({ model, contents, config })`
2. **`responseSchema` & `responseMimeType`**:
   - In `config`, pass `responseMimeType: "application/json"`.
   - Pass `responseSchema` or `responseJsonSchema` as a JSON Schema object.
   - The SDK's internal method `maybeMoveToResponseJsonSchema` automatically migrates any `responseSchema` with `$schema` to `responseJsonSchema`.
3. **Function Calling Declaration**:
   - Declared under `config.tools: [{ functionDeclarations: [declaration] }]`.
   - Declaration structure:
     ```js
     {
       name: "tool_name",
       description: "Tool description",
       parametersJsonSchema: {
         type: "object",
         properties: { ... },
         required: [ ... ]
       }
     }
     ```
4. **Function Call parts in response**:
   - `response.functionCalls`: returns array of `{ name: string, args: Record<string, any> }` where `args` is already parsed as an object.
5. **Token Usage Metadata (`usageMetadata`)**:
   - `response.usageMetadata` contains:
     - `promptTokenCount` (integer)
     - `candidatesTokenCount` (integer) [completion tokens]
     - `totalTokenCount` (integer)
6. **Embeddings API**:
   - `await ai.models.embedContent({ model, contents })`
   - Model name: `text-embedding-004` (standard Gemini Developer API embedding model).
   - Response structure: `response.embedding.values` or `response.embeddings[0].values` (`number[]`).
7. **Zod Version in Project**:
   - `zod` version is `4.4.3`.
   - Native `z.toJSONSchema(schema)` is available built-in in Zod v4, returning valid JSON Schema.

#### UNVERIFIED Items:
*None.* All methods, property names, and parameter structures have been verified from the installed package files.

---

### 5. Existing Behavior Preservation Map
- `POST /api/ai/upload`: Must keep returning `{ transactions, insights, budget, fraud, health }`.
- `POST /api/ai/ask`: Must keep returning `{ question, sql, rows }`.
- `POST /api/ai/chat`: Must keep returning `{ intent, sql, rows, answer }`.
- `POST /api/ai/quick-add`: Must keep returning `{ amount, type, category, description, date, categoryId, categoryName }`.
- `POST/GET /api/ai/live-audit`: Must keep returning `{ transactionCount, insights, budget, fraud, health }`.
- Frontend `FraudCard.tsx`: Uses `data.risk`, `data.flaggedIds`, `data.reason`. Existing shape must remain intact.

---

## Phase 1: Structured Outputs + Observability Summary
- **Central Gemini Wrapper (`services/gemini.service.js`)**:
  - Integrated `callGemini({ agentName, model, contents, systemInstruction, responseSchema, zodSchema, userId, timeoutMs, maxRetries })`.
  - Uses native `responseMimeType: "application/json"` and `responseSchema` (or converted from Zod schema via `z.toJSONSchema`).
  - Includes automatic retry (up to 2 retries) with validation error feedback in prompt upon schema violation.
  - Per-call configurable timeout (`AI_CALL_TIMEOUT_MS`, default 20s).
  - Token usage extracted from `usageMetadata` (`promptTokenCount`, `candidatesTokenCount`, `totalTokenCount`).
  - Logs every attempt (including errors and timeouts) to `AiCallLog`.
- **Database Schema**:
  - Added `AiCallLog` model to `schema.prisma`.
  - Created migration `backend/prisma/migrations/20261014_add_ai_call_log/migration.sql`.
  - Synchronized schema to Supabase with `npx prisma db push`.
- **Cost Calculation**:
  - Purely derived from environment variables `AI_PRICE_PER_1M_INPUT_TOKENS` and `AI_PRICE_PER_1M_OUTPUT_TOKENS`.
  - Returns `null` if variables are not configured or invalid. Never hardcodes pricing.
- **Agent Migrations**:
  - All 10 existing agents (`category`, `fraud`, `insight`, `budget`, `health`, `router`, `sql`, `answer`, `quickadd`, `unified`) migrated to `callGemini` with typed Zod schemas.
- **Metrics API**:
  - `GET /api/ai/metrics` with optional query param `?days=` (validated by Zod, default 7).
  - Aggregates total calls, successful calls, failed calls, success rate, token counts, estimated cost, and per-agent latency metrics (average and p95).
- **Verification**:
  - `backend/tests/ai.wrapper.test.js`: 7 subtests verifying wrapper retry, validation errors, timeouts, cost estimation, and database metrics aggregation.
  - Total test suite: 14 passing tests, 0 failing. `npx prisma validate` passed.

---

## Phase 2: Merchant Memory + User Corrections Summary
- **Database Schema**:
  - Added enum `MerchantRuleSource` (`USER`, `LLM`) and model `MerchantRule` with fields `id`, `userId`, `merchantKey`, `categoryId`, `source`, `hitCount`, `lastUsedAt`, `createdAt`, `updatedAt`, and unique constraint `@@unique([userId, merchantKey])`.
  - Added relations to `User` and `Category`.
  - Created migration `backend/prisma/migrations/20261014_add_merchant_rule/migration.sql`.
  - Synced to remote database via `npx prisma db push`.
- **Merchant Normalization (`utils/normalizeMerchant.js`)**:
  - Deterministic normalizer handling lowercase conversion, stripping Indian banking channel prefixes (`UPI`, `NEFT`, `RTGS`, `IMPS`, `ACH/NACH`, `POS`, `TRANSFER TO/FROM`), stripping routing flags (`CR`, `DR`, `P2M`, `P2P`, `P2A`), stripping reference IDs, phone numbers, card masking patterns, legal entity suffixes (`pvt ltd`, `inc`, `corp`), punctuation, and extra whitespace.
  - Tested against 18 deterministic cases including realistic statement narrations.
- **Category Flow in `category.agent.js` & `orchestrator.js`**:
  - Checks user rules in `MerchantRule` first.
  - Matches resolve instantly from memory with `source=USER` or `source=LLM`, incrementing `hitCount`.
  - Only unknown merchants are batched to Gemini LLM. When all match memory, LLM call is completely bypassed (0 tokens, 0 API latency).
  - New LLM categorization results are saved as `source=LLM` rules without overwriting higher-priority `USER` rules.
- **User Corrections**:
  - Hooked into `updateTransaction` in `transaction.service.js`: when a user updates a transaction's category, it upserts a `MerchantRule` with `source: "USER"`, overriding any previous LLM rules while preserving the existing API contract.
- **Few-Shot Prompting**:
  - User's top 10 most recent `USER` corrections are fetched and injected as few-shot examples into `categoryPrompt`.
- **Upload Response Additive Fields**:
  - `POST /api/ai/upload` returns `categorizedFromMemory` and `categorizedByLlm` alongside all existing fields (`transactions`, `insights`, `budget`, `fraud`, `health`).
- **Verification**:
  - `backend/tests/ai.merchantMemory.test.js` tests normalization (18 test cases), rule hit skipping LLM (mocked), USER overriding LLM, and unique constraint enforcement.
  - Total test suite: 35 passing tests, 0 failing across 8 suites. `npx prisma validate` passed.

---

## Phase 3: Hybrid Anomaly Detection Summary
- **Pure Module `utils/anomaly.js` (No DB, No LLM)**:
  - Per category per user robust statistics.
  - Computes median and Median Absolute Deviation (MAD)-based modified Z-score using Boris Iglewicz & David Hoaglin (1993) standard ($M_i = \frac{0.6745 \times |x - \text{median}|}{MAD} > 3.5$).
  - Fallback to Tukey's IQR rule ($Q_3 + 1.5 \times IQR$) and zero-variance multiplier ($3.0 \times \text{median}$) when $MAD = 0$.
  - Enforces strict minimum history requirement (`MIN_CATEGORY_HISTORY = 5`) before flagging statistical outliers; below it returns `insufficient_history` instead of guessing.
  - Detects exact duplicates (same amount + normalized merchant + within 24-hour window).
  - Flags include `transactionIndex`/`id`, `method` (`zscore` | `iqr` | `duplicate`), `score`, and explainability numbers (`median`, `mad`, `q1`, `q3`, `amount`).
- **Fraud Agent Redesign (`fraud.agent.js`)**:
  - Deterministic statistics decide WHAT is flagged. The LLM can NEVER add or remove flags.
  - If 0 anomalies detected, bypasses LLM completely (0 tokens, instant response).
  - If anomalies detected, LLM writes a concise human-readable explanation strictly for already-flagged items using structured output via the Phase 1 wrapper.
  - Preserves exact response shape for frontend `FraudCard` (`risk`, `flaggedIds`, `reason`) plus additive `flags` array.
- **Verification**:
  - Table-driven unit tests in `backend/tests/ai.anomaly.test.js` with hand-computed mathematical proofs documented in comments (Modified Z-score calculation 15.51, MAD=0 fallback, duplicate detection, history threshold, empty/edge cases, fraud agent strict contract).
  - Total test suite: 46 passing tests, 0 failing across 15 suites. `npx prisma validate` passed.
---

## Phase 4: Hardened Text-to-SQL + Tool-Calling Agent Summary
- **Hardened Text-to-SQL Security (`utils/sqlGuard.js`)**:
  - Single statement enforcement, rejecting multi-statements and SQL comments (`--`, `/* */`).
  - Word-boundary blocklist (`\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|pg_|information_schema)\b`) preventing false positives on legitimate column names (e.g. `createdAt`, `updatedAt`).
  - Strict function allowlist: `sum`, `count`, `avg`, `min`, `max`, `coalesce`, `date_trunc`, `extract`, `round`, `lower`, `upper`, `to_char`, `now`, `current_date`. Blocks all unlisted system calls (e.g. `pg_sleep`, `version`).
  - Table allowlist: derived from schema (`Transaction`, `Account`, `Category`, `Budget`, `MonthlyBudget`). System/auth tables (`User`, `SubscriptionPayment`, `AiCallLog`, `MerchantRule`, `PendingAiAction`) are strictly forbidden.
  - **Structural User Scoping**: The model is never trusted to write `WHERE userId = ...`. Queries are wrapped in Common Table Expressions (CTEs) that pre-filter every allowed table by `$1` (`userId` bound parameter):
    ```sql
    WITH "Transaction" AS (
      SELECT t.* FROM "Transaction" t
      JOIN "Account" a ON t."accountId" = a.id
      WHERE a."userId" = $1
    ),
    "Account" AS (SELECT * FROM "Account" WHERE "userId" = $1),
    "Budget" AS (SELECT * FROM "Budget" WHERE "userId" = $1),
    "MonthlyBudget" AS (SELECT * FROM "MonthlyBudget" WHERE "userId" = $1),
    "Category" AS (SELECT * FROM "Category")
    SELECT ...
    ```
  - Read-only execution via `prisma.$transaction` with `SET LOCAL statement_timeout = '5000ms'`, forced `LIMIT 200`, and capped result size returned to the LLM.
  - 27 unit tests in `backend/tests/ai.sqlGuard.test.js` validating injection attacks, stacked queries, table access violations, function restrictions, and valid CTE generation.
- **Prisma Schema Update**:
  - Added model `PendingAiAction` (`id`, `userId`, `tool`, `argsJson`, `status`, `expiresAt`, `createdAt`, `updatedAt`) with index on `[userId, status]` and cascade delete on user deletion.
  - Synced to Supabase database with `npx prisma db push`.
- **Tool-Calling Agent (`agents/finance.agent.js`)**:
  - Autonomous multi-turn function-calling loop with `@google/genai` tool declarations.
  - Available tools:
    - `run_sql(query)`: Executes validated SQL via hardened CTE path.
    - `get_budgets(month?, year?)`: Retrieves user budgets deterministically.
    - `get_spending_summary(from, to, groupBy)`: Deterministic database aggregation (no LLM math).
    - `forecast_spending(category?, horizonDays)`: Deterministic run-rate / moving-average spending projection.
    - `search_tax_knowledge(query)`: Extensible hook for India Tax RAG (Phase 8).
    - `add_transaction(amount, type, category, description, date)`: Write tool staging a pending action.
    - `create_budget(category, amount, month, year)`: Write tool staging a pending action.
  - **Write Tool Safety**: Write tools never execute immediately. They create a `PendingAiAction` expiring in 10 minutes. The user must confirm via `POST /api/ai/agent/confirm`. Confirmation is idempotent and strictly user-scoped.
  - **Loop Limits**: Max 6 iterations, 30s timeout, detection of repeated identical tool calls, and step recording (`steps` array returned with tool name, args, latency, and summarized result).
- **API Endpoints & Rate Limiting**:
  - `POST /api/ai/agent`: Protected by `aiAgentLimiter` (15 requests/minute). Runs the autonomous agent loop.
  - `POST /api/ai/agent/confirm`: Confirms and executes staged pending actions.
  - `POST /api/ai/chat`: Preserved intact as backward-compatible conversational endpoint.
- **Frontend Integration**:
  - Updated `frontend/src/components/ai/ChatBox.tsx` with collapsible "How I got this answer" step viewer and interactive Confirm/Cancel action buttons for pending AI actions.
  - Updated `frontend/src/services/ai.service.ts` and `frontend/src/types/ai.ts`.
- **Verification**:
  - `backend/tests/ai.sqlGuard.test.js` (27 tests) and `backend/tests/ai.financeAgent.test.js` (5 suites, 5 tests).
  - Total test suite: 78 passing tests, 0 failing across 22 suites. `npx prisma validate` passed.
---

## Phase 5: Evaluation Harness Summary
- **Deterministic Fixtures (`evals/fixtures/seedEval.js`)**:
  - Seeds an isolated test user, account, categories, budgets, and 26 realistic transactions in an isolated evaluation database.
  - Strict guardrails: refuses to execute if `DATABASE_URL_EVAL` is missing, if it matches production `DATABASE_URL`, or if `NODE_ENV === "production"`.
- **Benchmark Datasets (`evals/datasets/`)**:
  - `text2sql.json`: 40 benchmark questions across 8 categories (`simple_filter`, `aggregation`, `date_range`, `group_by`, `ranking`, `multi_condition`, `unanswerable`, `adversarial`) with human-written reference SQL and rejection flags.
  - `categorization.json`: 60 labeled transactions from Indian statement narrations mapped to the 12 seeded database categories.
  - `anomaly.json`: 5 labeled series with known injected statistical outliers (modified Z-score), zero-MAD IQR fallbacks, exact 24h duplicates, and minimum history gates.
  - `agent.json`: 15 multi-step questions with expected tool sequence trajectories and ground-truth values computed from fixtures.
- **Execution-Based Scoring Engine (`evals/scoring.js`)**:
  - Compares query result sets semantically using order-insensitive multiset matching, numeric tolerance handling (0.05 / 2 decimal places), and column casing normalization. Never compares raw SQL strings.
  - Verifies adversarial prompt rejection.
  - Trajectory scoring: validates required tool invocation and numerical answer accuracy.
- **Comparison Engine (`evals/compare.js`)**:
  - Calculates run-to-run deltas for overall accuracy, per-suite accuracy, per-category accuracy, and latency.
- **CLI Runner (`evals/runner.js`)**:
  - Added `npm run eval` to `package.json` supporting `--suite`, `--limit`, `--concurrency`, `--model`, and `--compare`.
  - Saves benchmark results to `backend/evals/results/<timestamp>.json` and updates `backend/evals/results/latest-summary.json`.
- **Documentation (`docs/EVAL_RESULTS.md`)**:
  - Empirical results documented honestly: Anomaly suite achieved 100.0% accuracy (5/5). Database-dependent and API-dependent suites explicitly marked as "not yet run" awaiting isolated database infrastructure.
- **Verification**:
  - `backend/tests/ai.evalScoring.test.js`: 17 unit tests verifying scoring normalization, multiset comparison, categorization, anomaly matching, agent trajectory scoring, and delta calculation. All 17 passed.
  - Total test suite: 95 passing tests, 0 failing across 29 suites. `npx prisma validate` passed.
---

## Phase 6: Proactive Weekly Agent & Notifications Summary
- **Database Schema**:
  - Added model `Notification` (`id`, `userId`, `type`, `title`, `body`, `dataJson`, `weekKey`, `readAt`, `createdAt`) with unique constraint `@@unique([userId, type, weekKey])` ensuring strict idempotency per week.
  - Added index on `[userId, readAt]` and cascade delete on user deletion.
  - Created migration `backend/prisma/migrations/20261014_add_notification/migration.sql`.
  - Pushed to Supabase Postgres via `npx prisma db push`.
- **Deterministic Proactive Intelligence (`proactive.agent.js`)**:
  - `computeBudgetBurnRate`: pure deterministic calculation comparing spending velocity against days elapsed in the month. Assigns `ON_TRACK`, `AT_RISK` (burn-rate > time elapsed + 15%), or `OVER_BUDGET`.
  - `computeWeekOverWeek`: pure calculation comparing the last 7 days of spending against the preceding 7 days per category.
  - `detectAnomalies`: checks for statistical spikes and duplicates in recent activity.
  - `generateUserWeeklyDigest`: skips inactive users (0 transactions). Feeds precomputed deterministic facts to `callGemini` (`proactive_agent`) with structured Zod schema (`{ title, summary, keyHighlight }`). The LLM never computes numbers.
  - Upserts into `Notification` idempotently using `[userId, type, weekKey]`.
- **Automated Cron Daemon (`src/jobs/proactiveCron.js`)**:
  - Schedules weekly execution via `node-cron` using `AI_WEEKLY_CRON` (default `"0 9 * * 1"`), active when `AI_PROACTIVE_ENABLED=true`.
  - Concurrency cap of 5 users per batch. Failures for one user do not abort the sweep.
  - Documented Render free-tier sleep behavior in `README.md` and provided external trigger documentation.
- **REST API Endpoints**:
  - `GET /api/notifications`: paginated with unread filter and total counts.
  - `PATCH /api/notifications/:id/read`: marks a notification read; validates user ownership.
  - `POST /api/ai/proactive/run`: protected manual trigger endpoint supporting `x-cron-secret` / `x-admin-key` or JWT auth for external schedulers (e.g. GitHub Actions / cron-job.org).
- **Frontend Dashboard Integration**:
  - Created `frontend/src/components/dashboard/NotificationCard.tsx` and service `frontend/src/services/notification.service.ts`.
  - Displays proactive weekly AI briefings with unread badges, key highlights, and inline "Mark as Read" actions directly on the dashboard.
- **Verification**:
  - `backend/tests/ai.proactive.test.js`: 7 tests verifying hand-computed burn-rate math (on track, at risk, over budget), week-over-week deltas, week key determinism, database idempotency, and cross-user isolation.
  - Total test suite: 102 passing tests, 0 failing across 33 suites. `npx prisma validate` passed.
---

## Phase 7: End-to-End Observability Verification Summary
- **Unified Call Wrapper Enforcement**:
  - Re-verified all 11 AI agent call paths: `category`, `fraud`, `insight`, `budget`, `health`, `router`, `sql`, `answer`, `quickadd`, `unified`, `finance`, and `proactive`.
  - Refactored `finance.agent.js` so that its multi-turn tool-calling loop invokes `callGemini` at each individual iteration, automatically recording token usage, model fallback attempts, execution latency, and success/failure rows into `AiCallLog`.
  - Completely eliminated any direct client instantiations (`new GoogleGenAI`) and direct `.models.generateContent()` calls outside `src/modules/ai/services/gemini.service.js`.
- **Architectural Hygiene Linter & Test (`tests/ai.observability.test.js`)**:
  - Added an automated architectural AST/grep test that scans every `.js` file across the entire `backend/src` tree.
  - Strictly asserts 0 occurrences of `@google/genai` imports, 0 direct SDK instantiations, and 0 direct API method calls outside `gemini.service.js`. Fails the test runner if any code bypasses the central wrapper.
  - Asserts that all agent modules import and route via `callGemini`.
- **Verification**:
  - `backend/tests/ai.observability.test.js`: 2 tests passed.
  - Full test suite: 104 passing tests, 0 failing across 34 suites. `npx prisma validate` passed.
