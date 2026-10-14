<div align="center">

# 💎 CashFlow AI

### *Autonomous Multi-Agent Financial Copilot & Enterprise Billing Engine*

[![Production Status](https://img.shields.io/badge/status-active-success.svg?style=for-the-badge&color=10B981)](https://cash-flow-ai-rose.vercel.app)
[![React 19](https://img.shields.io/badge/React_19-TypeScript-blue.svg?style=for-the-badge&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js_v20+-Express-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791.svg?style=for-the-badge&logo=postgresql)](https://supabase.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-ORM-2D3748.svg?style=for-the-badge&logo=prisma)](https://prisma.io/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4.svg?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Razorpay](https://img.shields.io/badge/Razorpay-PCI--DSS_Level_1-0C2340.svg?style=for-the-badge&logo=razorpay)](https://razorpay.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg?style=for-the-badge)](LICENSE)

<br/>

**[🌐 Launch Live Web Application](https://cash-flow-ai-rose.vercel.app)** &nbsp;•&nbsp; **[⚡ Production API Health](https://cashflow-ai-oz1i.onrender.com)** &nbsp;•&nbsp; **[📖 Architecture Docs](#-system-architecture)**

<br/>

> ⚡ **Cold-Start Notice**: The production API runs on Render's container tier. If idle, the first request might take 30-45 seconds for container initialization.

<br/>

---

</div>

## 📌 Executive Summary

**CashFlow AI** is a production-grade personal wealth copilot engineered to bridge standard transaction tracking with an **autonomous multi-agent AI decision layer** and an **institutional fintech billing engine**.

Unlike conventional budgeting tools (e.g., Mint, YNAB) that require tedious manual categorization and offer static monthly charts, CashFlow AI autonomously ingests unstructured bank statements (CSV/PDF), categorizes transactions against real historical databases, flags suspicious anomalies, computes an algorithmic Financial Health Index (0–100), and allows users to query their financial records in natural language via a **sandboxed Text-to-SQL firewall**.

CashFlow AI features an end-to-end **subscription monetization suite** featuring Razorpay Standard Checkout (UPI & Cards), **cryptographic HMAC-SHA256 signature verification**, **automated background subscription lifecycle cron workers**, and **GST-compliant downloadable PDF tax invoices**.

---

## 🚀 Key Innovations & Showstopper Features

### 1. 🤖 Parallel 5-Agent Financial Ingestion Engine
When a bank statement is uploaded, CashFlow AI dispatches **five specialized Gemini 2.5 Flash agents in parallel** via `Promise.all`:
- **Categorization Agent**: Accurately classifies transactions against seeded database categories using contextual transaction memos and merchant semantics.
- **Fraud & Anomaly Agent**: Detects irregular spikes, duplicated merchant swipes, and suspicious out-of-band transfers.
- **Spending Intelligence Agent**: Generates concise, data-driven qualitative analysis of discretionary spending.
- **Budget Advisory Agent**: Audits recent velocity against user-configured envelope limits.
- **Financial Health Index Agent**: Computes a dynamic 0–100 fiscal wellness score across liquidity, savings rate, and burn velocity.

### 2. 🛡️ Zero-Duplicate Cryptographic Ledger
Re-uploading the same bank statement will never corrupt your ledger. CashFlow AI constructs an idempotent cryptographic transaction fingerprint (`SHA-256(userId + date + amount + merchant + rawMemo)`) on ingestion, silently de-duplicating statement rows before persisting to PostgreSQL.

### 3. 💬 Sandboxed Natural Language Text-to-SQL Firewall
Users can query their finances in plain conversational English (*"How much did I spend on dining out last weekend compared to grocery runs?"*):
- **Intent Classifier Router**: Distinguishes between qualitative financial advice and database queries.
- **Security-Constrained SQL Generator**: Translates natural language into scoped, read-only `SELECT` queries.
- **Zero-Trust Query Sanitizer**: Strictly enforces an AST and keyword blocklist (`DROP`, `DELETE`, `UPDATE`, `ALTER`, `--`, `;`), validates user ID scoping literals, and rejects cross-tenant data leakage.

### 4. 💳 Production Fintech Subscription & Billing Engine
- **Razorpay Standard Checkout**: Native support for **Instant UPI (Google Pay, PhonePe, Paytm)**, **Debit/Credit Cards**, and **Netbanking**.
- **Cryptographic Signature Verification**: Validates every incoming payment payload using HMAC-SHA256 hash digests (`crypto.createHmac("sha256", RAZORPAY_KEY_SECRET)`). Tampered payment or order IDs are flagged as fraudulent and rejected at the gateway.
- **Server-to-Server Webhooks (`POST /api/payment/webhook`)**: Asynchronously listens for `order.paid` and `payment.captured` events with signature verification for resilient reconciliation.
- **Automated Lifecycle Cron Worker**: Background worker (`node-cron`) sweeps the database hourly to audit active subscriptions, automatically downgrade expired tiers, and preserve data integrity without downtime.

### 5. 🧾 Downloadable GST-Compliant Tax Invoices
- Generates official **PDF Tax Invoices** directly inside the browser using client-side PDF document synthesis.
- Includes **SAC Code 998313 (Information Technology Software Services)**, automatic **18% GST breakdown** (9% CGST + 9% SGST), customer details, payment timestamps, and Razorpay transaction audit hashes.

### 6. 🎨 Midnight Sapphire Adaptive Design System
- Multi-theme engine featuring **Midnight Sapphire (Dark Blue)** and **Classic Ledger (Light)**.
- Glassmorphic card styling, micro-animations, and fluid responsive layouts powered by Tailwind CSS.

---

## 🏛 System Architecture

### Multi-Agent Bank Statement Processing Pipeline

```mermaid
flowchart TD
    A[📄 Raw Bank Statement CSV / PDF] --> B[Parser & Normalizer]
    B --> C[Zero-Duplicate Cryptographic Deduplicator]
    C --> D[Parallel AI Agent Dispatcher]
    
    subgraph MultiAgentEngine [Google Gemini 2.5 Flash Agentic Core]
        D --> E1[🏷️ Categorization Agent]
        D --> E2[🚨 Fraud & Anomaly Agent]
        D --> E3[📊 Spending Insight Agent]
        D --> E4[🎯 Budget Velocity Agent]
        D --> E5[💯 Health Score Agent]
    end
    
    E1 & E2 & E3 & E4 & E5 --> F[Consolidated Analysis Aggregator]
    F --> G[(PostgreSQL / Supabase via Prisma ORM)]
    G --> H[📈 Real-Time Reactive Dashboard]
```

---

### Sandboxed Text-to-SQL Query Firewall

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 User
    participant Frontend as 💻 React 19 Frontend
    participant API as 🛡️ Express API Gateway
    participant Router as 🧭 Intent Router Agent
    participant SQLAgent as 🤖 Gemini Text-to-SQL Agent
    participant Firewall as 🔒 Query Security Firewall
    participant DB as 🗄️ PostgreSQL Database

    User->>Frontend: "How much did I spend on Swiggy last month?"
    Frontend->>API: POST /api/ai/ask
    API->>Router: Evaluate Query Intent
    Router-->>API: Intent = DATA_QUERY
    API->>SQLAgent: Generate Parameterized Read-Only Query
    SQLAgent-->>Firewall: Candidate SQL Statement
    Firewall->>Firewall: Validate SELECT-only, User ID Scoping, Keyword Blocklist
    Firewall->>DB: Execute Sandboxed SELECT
    DB-->>API: Row Set Results
    API->>SQLAgent: Synthesize Conversational Answer
    SQLAgent-->>API: "You spent ₹4,230 across 11 orders..."
    API-->>Frontend: JSON Response with Visual Table & Answer
    Frontend-->>User: Rendered Analytics Card
```

---

### Autonomous Multi-Turn Tool-Calling Finance Agent (`POST /api/ai/agent`)

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 User
    participant Frontend as 💻 React 19 Frontend
    participant API as 🛡️ Express API Gateway
    participant Agent as 🤖 Finance Tool-Calling Agent
    participant Wrapper as ⚙️ Central Gemini Wrapper
    participant Registry as 🧰 Deterministic Tool Registry
    participant DB as 🗄️ PostgreSQL (Read-Only CTE / Pending Action)

    User->>Frontend: "Can you create a dining budget of ₹8,000 for this month?"
    Frontend->>API: POST /api/ai/agent { message }
    API->>Agent: Run Multi-Turn ReAct Loop (Max 6 Iterations)
    Agent->>Wrapper: callGemini(contents, tools: [create_budget, run_sql, ...])
    Wrapper-->>Agent: FunctionCall: create_budget(category="Dining Out", limit=8000)
    Agent->>Registry: Execute Tool: create_budget (Write Tool)
    Note over Registry: Write-tools stage a pending action.<br/>Never execute directly without confirmation!
    Registry->>DB: Stage in PendingAiAction (TTL: 10m, Status: PENDING)
    DB-->>Registry: { actionId: "uuid", expiresAt }
    Registry-->>Agent: { pendingAction: { actionId, summary, expiresAt } }
    Agent->>Wrapper: Re-prompt with tool response
    Wrapper-->>Agent: "I have prepared the budget creation. Please confirm."
    Agent-->>API: { answer, steps: [...], pendingActions: [...] }
    API-->>Frontend: Render answer with Confirm / Cancel action card
    User->>Frontend: Click "Confirm Action"
    Frontend->>API: POST /api/ai/agent/confirm { actionId }
    API->>DB: Validate User Scoping & Execute Idempotent Prisma Write
    DB-->>API: Success
    API-->>Frontend: "Budget successfully created!"
```

---

### India Tax Knowledge RAG & Weekly Proactive Cron Architecture

```mermaid
flowchart TD
    subgraph KnowledgeIngestion [India Tax Knowledge RAG Engine]
        A1[📄 Official Income Tax Docs incometax.gov.in] --> A2[Markdown Parser & YAML Front-Matter Validator]
        A2 --> A3[Paragraph Boundary Chunker ~900 chars + 150 char overlap]
        A3 --> A4[Gemini text-embedding-004 via Wrapper]
        A4 --> A5[(KnowledgeChunk Table in PostgreSQL)]
        
        Q1[User Tax Query] --> Q2[Embed Query]
        Q2 --> Q3[In-Memory Cosine Similarity Top-K Engine]
        A5 --> Q3
        Q3 --> Q4{Score >= 0.55?}
        Q4 -- Yes --> Q5[Synthesize Answer with Mandatory Front-Matter Citations]
        Q4 -- No / Empty KB --> Q6[Truthful Refusal: 'Knowledge base is empty / not found']
    end

    subgraph ProactiveDaemon [Weekly Proactive Autonomous Agent]
        W1[node-cron Scheduler / External Webhook Trigger] --> W2[Proactive Worker Loop]
        W2 --> W3[Deterministic Math: Budget Burn Rate vs Elapsed Days]
        W2 --> W4[Deterministic Math: Week-over-Week Category Shift]
        W2 --> W5[Hybrid Anomaly Engine: Modified Z-Score & Duplicates]
        W3 & W4 & W5 --> W6[Gemini Wrapper: Phrase Structured Human Summary]
        W6 --> W7[(Idempotent Notification Table: unique userId+type+weekKey)]
        W7 --> W8[Interactive Dashboard Notification Dropdown]
    end
```

---

### Fintech Subscription & Payment Verification Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Subscriber
    participant Client as 🖥️ React Settings Client
    participant Server as ⚙️ Express Backend
    participant Razorpay as 💳 Razorpay Gateway
    participant DB as 🐘 Supabase PostgreSQL

    User->>Client: Select Pro Copilot & Click "Pay via Razorpay"
    Client->>Server: POST /api/payment/create-order
    Server->>Razorpay: orders.create(amount, currency: "INR")
    Razorpay-->>Server: order_id (e.g. order_TniZaPUi2lU4f2)
    Server->>DB: Create SubscriptionPayment (Status: PENDING)
    Server-->>Client: { orderId, amount, keyId }
    Client->>Razorpay: Open Razorpay Standard Checkout Modal
    User->>Razorpay: Complete UPI / Card Payment
    Razorpay-->>Client: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
    Client->>Server: POST /api/payment/verify
    Note over Server: Compute HMAC-SHA256(order_id + "|" + payment_id, SECRET)<br/>Compare with razorpay_signature
    alt Signature Matches Authentic Secret
        Server->>DB: Update SubscriptionPayment (Status: SUCCESS)
        Server->>DB: Update User (Plan: PRO, ExpiresAt: +30/365 Days)
        Server-->>Client: { success: true, user: updatedUser }
        Client-->>User: 🎉 Plan Activated! Download Tax Invoice PDF!
    else Signature Verification Fails (Tampered)
        Server->>DB: Update SubscriptionPayment (Status: FAILED)
        Server-->>Client: 400 Bad Request (Fraudulent attempt blocked)
    end
```

---

## 🛠 Tech Stack

| Domain | Technologies | Details |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS | Single-page application, custom theme engine, responsive design |
| **Icons & UI** | Lucide React, Framer Motion, Canvas Confetti | Clean micro-interactions, collapsible tool execution visualizer, pending action cards |
| **Backend** | Node.js (v20+ LTS), Express.js (v5) | Modular REST architecture, custom AppError hierarchy, async handlers, zero unhandled rejections |
| **Database & ORM** | PostgreSQL 16 (Supabase), Prisma ORM v6 | Connection pooling via PgBouncer, strict relational schema |
| **AI / LLM** | `@google/genai` (v2.15.0 SDK), Gemini 3.8 Flash, text-embedding-004 | Native structured JSON outputs, function calling, deterministic cost tracking |
| **Math & Anomaly** | Pure JS Statistics | Modified Z-Score ($M_i = 0.6745 \cdot |x - \text{median}| / \text{MAD}$), IQR fallback, 24h exact window deduplication |
| **Payments** | Razorpay Node SDK, Razorpay Checkout.js | PCI-DSS Level 1 compliant, UPI, Cards, Netbanking |
| **Security** | Crypto (HMAC-SHA256), Helmet, CORS, Rate Limiting, JWT | Zero-trust authentication, cryptographic signature validation, CTE SQL sandboxing |
| **Scheduled Jobs**| Node-Cron | Automated subscription expiration daemon & weekly proactive financial report worker |
| **PDF Invoicing** | jsPDF, html2canvas | Client-side 18% GST tax invoice synthesis |
| **Testing** | Node.js Native Test Runner (`node --test`), Assert | 113 comprehensive automated unit & integration tests across 39 suites |

---

## 📡 Comprehensive API Reference

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/auth/register` | Register new user account with initial wallet | ❌ |
| `POST` | `/api/auth/login` | Authenticate credentials and receive signed JWT | ❌ |
| `POST` | `/api/auth/google` | OAuth 2.0 Google Sign-In verification | ❌ |

### 2. Multi-Agent AI Core & Observability (`/api/ai`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/ai/upload` | Ingest bank statement CSV & dispatch 5-agent parallel analysis with merchant memory caching | ✅ |
| `POST` | `/api/ai/ask` | Hardened Text-to-SQL query engine over user's transactions with CTE isolation | ✅ |
| `POST` | `/api/ai/chat` | Conversational financial copilot with contextual intent routing (fallback) | ✅ |
| `POST` | `/api/ai/agent` | Autonomous tool-calling financial assistant with execution steps and pending write actions | ✅ |
| `POST` | `/api/ai/agent/confirm` | Execute staged write actions (`add_transaction`, `create_budget`) with user verification | ✅ |
| `GET` | `/api/ai/metrics` | Observability metrics: token usage, latency percentiles (avg/p95), success rate, and dynamic cost | ✅ |
| `POST` | `/api/ai/proactive/run` | Protected manual/webhook trigger for weekly proactive report generation (`x-cron-secret`) | ❌ *(Secret)* |

### 3. Proactive Notifications (`/api/notifications`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/notifications` | Fetch paginated proactive notifications with optional unread filter (`?unread=true`) | ✅ |
| `PATCH`| `/api/notifications/:id/read` | Mark a proactive notification as read | ✅ |

### 4. Fintech Payment & Subscription (`/api/payment`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/payment/create-order` | Create Razorpay order & record pending transaction in database | ✅ |
| `POST` | `/api/payment/verify` | Cryptographically verify HMAC-SHA256 signature & activate plan | ✅ |
| `GET` | `/api/payment/subscription` | Fetch active plan, expiration countdown & full payment history | ✅ |
| `POST` | `/api/payment/cancel` | Immediately cancel Pro subscription and revert user to Starter tier | ✅ |
| `POST` | `/api/payment/webhook` | Server-to-server webhook endpoint with raw body signature check | ❌ *(Signed)* |

### 5. Transactions, Accounts & Budgets
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/transactions` | Paginated transactions with search, category filtering & sorting | ✅ |
| `POST` | `/api/transactions` | Create single manual transaction | ✅ |
| `PATCH`| `/api/transactions/:id` | Update transaction details (category update dynamically creates `USER` merchant rule) | ✅ |
| `GET` | `/api/accounts` | Retrieve user checking, savings, and investment accounts | ✅ |
| `POST` | `/api/accounts` | Provision new financial account with starting balance | ✅ |
| `GET` | `/api/budgets` | Fetch monthly envelope budgets with live actual-spend progress | ✅ |
| `POST` | `/api/budgets` | Set or update spending ceiling for specific categories | ✅ |
| `GET` | `/api/dashboard/summary`| Aggregated metrics (net cash flow, monthly burn rate, health score) | ✅ |

---

## 🧪 Automated Test Suite

CashFlow AI features an end-to-end, zero-dependency automated test suite executed via the native Node.js test runner (`node --test`), thoroughly asserting cryptographic verification, AI guardrails, merchant memory, statistical anomaly isolation, hardened SQL firewalling, evaluation scoring, and tax RAG retrieval:

```bash
cd backend
npm test
```

### Verified Test Suite Execution:
```text
TAP version 13
# tests 113
# suites 39
# pass 113
# fail 0
# cancelled 0
# skipped 0
# todo 0
```
*Includes: Statement Deduplication, Razorpay Signature Verification, Central Gemini Wrapper & Observability, Merchant Memory Normalization & Caching, Modified Z-Score & Anomaly Math, Hardened SQL Security & CTE Tenant Scoping, Multi-Turn Tool-Calling Loop, Evaluation Scoring Algorithms, Weekly Proactive Cron Idempotency, Observability Hygiene, and India Tax RAG Retrieval.*

---

## 💻 Local Setup & Development Guide

### Prerequisites
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- **PostgreSQL**: Local instance or Supabase account
- **Google AI Studio Key**: Free API key for Gemini 2.5 Flash
- **Razorpay Account**: Free Test Mode API Key & Secret

---

### Step 1: Clone Repository
```bash
git clone https://github.com/manan28076/CashFlow-AI.git
cd CashFlow-AI
```

---

### Step 2: Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
PORT=5000
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/postgres"
DATABASE_URL_EVAL="postgresql://user:password@host:5432/postgres_eval" # Isolated database for eval runner
JWT_SECRET="your_strong_jwt_secret_key"
GEMINI_API_KEY="your_google_gemini_api_key"
RAZORPAY_KEY_ID="rzp_test_YourKeyIdHere"
RAZORPAY_KEY_SECRET="YourRazorpaySecretHere"
RAZORPAY_WEBHOOK_SECRET="YourRazorpayWebhookSecretHere"

# AI Observability, Cost & Timeout
AI_PRICE_PER_1M_INPUT_TOKENS=0.15
AI_PRICE_PER_1M_OUTPUT_TOKENS=0.60
AI_CALL_TIMEOUT_MS=20000

# Proactive Weekly Report Agent
AI_PROACTIVE_ENABLED=false
AI_WEEKLY_CRON="0 9 * * 1"
AI_PROACTIVE_CRON_SECRET="your_cron_secret_or_admin_key"
```

Deploy database schema & seed initial categories:
```bash
npx prisma migrate deploy
npx prisma db seed
```

Start the backend server:
```bash
npm run dev
```
*Backend will run at `http://localhost:5000` with the automated subscription and proactive cron daemons initialized.*

---

### Step 3: Frontend Setup
In a new terminal window:
```bash
cd ../frontend
npm install
```

Create a `.env` file in `frontend/`:
```env
VITE_API_BASE_URL="http://localhost:5000/api"
```

Start the Vite development server:
```bash
npm run dev
```
*Frontend will run at `http://localhost:5173`.*

---

## ⚠️ Known Limitations & Operational Considerations

1. **Free-Tier In-Process Cron Inactivity**: Render free-tier containers automatically sleep after 15 minutes of inactivity. While sleeping, internal `node-cron` timers (`subscriptionCron`, `proactiveCron`) will not fire. For production or 24/7 reliability, configure an external scheduler (GitHub Actions, cron-job.org) to ping the protected endpoint:
   ```bash
   curl -X POST https://your-app.onrender.com/api/ai/proactive/run \
     -H "x-cron-secret: <AI_PROACTIVE_CRON_SECRET>"
   ```
2. **India Tax Knowledge RAG Base**: Under strict anti-hallucination guardrails, tax rules, limits, section slabs, and deadlines are **never generated from LLM memory**. Official documents must be placed into `backend/knowledge/in-tax/` with validated front-matter (`title`, `sourceUrl`, `financialYear`, `retrievedOn`). When the corpus directory is empty, the RAG tool truthfully responds that the knowledge base is empty and provides a disclaimer.
3. **Execution-Based Evaluation Database Separation**: The evaluation runner (`npm run eval`) asserts SQL query correctness against database state. To prevent polluting developer or production data, the eval runner refuses to execute unless `DATABASE_URL_EVAL` is explicitly configured and distinct from `DATABASE_URL`.
4. **Deterministic Math Principle**: All monetary arithmetic, modified z-score calculations, moving-average spending forecasts, and budget burn-rates are computed in deterministic TypeScript/JavaScript engines. LLMs only phrase structured human-readable explanations around pre-computed verified values.

---

## 🔐 Security & Data Governance

| Threat Model | Engineering Mitigation |
|---|---|
| **Cross-Tenant Data Exposure** | All Prisma queries are strictly scoped by verified JWT `userId`. The SQL engine wraps all allowed tables in bound Common Table Expressions (`WITH "Transaction" AS (SELECT * FROM "Transaction" WHERE "userId" = $1)`), structurally preventing cross-tenant leakage even if the model hallucinates a query. |
| **SQL Injection via AI** | Gemini-generated SQL is validated by a hardened AST/Regex firewall: single statement only, reject comments (`--`, `/*`), reject semicolons, word-boundary blocklist (`DROP`, `DELETE`, `ALTER`), function allowlist, and mandatory read-only transaction mode (`SET LOCAL statement_timeout = 5000ms`). |
| **Payment Signature Tampering** | Payment verifications recompute HMAC-SHA256 digests on the server using `RAZORPAY_KEY_SECRET`. Mock or altered IDs trigger immediate database rejection. |
| **Unauthorized Autonomous Actions** | The tool-calling financial agent cannot execute destructive writes (`add_transaction`, `create_budget`) on its own. All write tools return a staged `PendingAiAction` (10-minute TTL) requiring explicit user confirmation via `POST /api/ai/agent/confirm`. |
| **Card Data Security** | Zero credit card or banking credentials touch application servers. All payment transactions run inside Razorpay's PCI-DSS Level 1 iframe sandbox. |

---

## 📂 Project Structure

```
CashFlow-AI/
├── backend/
│   ├── evals/                    # Execution-based evaluation harness
│   │   ├── datasets/             # Benchmarks (text2sql, categorization, anomaly, agent)
│   │   ├── fixtures/             # Deterministic seed script (seedEval.js)
│   │   ├── runner.js             # CLI eval runner (npm run eval)
│   │   └── scoring.js            # Semantic result-set comparison & metric tracking
│   ├── knowledge/
│   │   └── in-tax/               # India tax knowledge base markdown corpus
│   ├── prisma/
│   │   ├── migrations/           # Version-controlled database migrations
│   │   ├── schema.prisma         # Models (User, Transaction, MerchantRule, AiCallLog, Notification, etc.)
│   │   └── seed.js               # Category and demographic seed data
│   ├── scripts/
│   │   └── ingestKnowledge.js    # Knowledge base chunking & embedding ingestion CLI
│   ├── src/
│   │   ├── config/               # Environment & database connection configs
│   │   ├── errors/               # Centralized AppError hierarchy
│   │   ├── jobs/                 # Cron workers (subscriptionCron, proactiveCron)
│   │   ├── middleware/           # Auth, rate-limiter, error-handler, validation
│   │   ├── modules/
│   │   │   ├── ai/               # AI Engine
│   │   │   │   ├── agents/       # Agents (finance, proactive, category, fraud, sql, etc.)
│   │   │   │   ├── services/     # Central Gemini wrapper & Tax RAG service
│   │   │   │   └── utils/        # Anomaly engine, normalizer, hardened SQL guard
│   │   │   ├── payment/          # Razorpay orders, HMAC verification & webhooks
│   │   │   ├── transaction/      # CRUD, pagination & SHA-256 deduplication
│   │   │   └── ...               # Account, budget, dashboard modules
│   │   └── server.js             # Express application entrypoint
│   └── tests/                    # 113 unit & integration tests across 39 suites
│
├── frontend/
│   ├── src/
│   │   ├── components/           # UI components (ChatBox, NotificationCard, FraudCard)
│   │   ├── pages/                # Views (Dashboard, Transactions, AIAssistant, Settings)
│   │   ├── services/             # Axios API client & Razorpay SDK loader
│   │   └── types/                # Strict TypeScript interfaces (ai.ts, etc.)
│   └── package.json
│
├── docs/
│   ├── AI_UPGRADE_NOTES.md       # Architectural audit, recon summary & verification log
│   └── EVAL_RESULTS.md           # Benchmark execution report & accuracy tracking
└── README.md                     # Comprehensive project documentation
```

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for full details.

---

<div align="center">

**Built with ❤️ for modern personal financial engineering.**

[⭐ Star this repository](https://github.com/manan28076/CashFlow-AI) • [🐛 Report a Bug](https://github.com/manan28076/CashFlow-AI/issues) • [💡 Request Feature](https://github.com/manan28076/CashFlow-AI/issues)

</div>