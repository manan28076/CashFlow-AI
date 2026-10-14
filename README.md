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
| **Icons & UI** | Lucide React, Framer Motion, Canvas Confetti | Clean micro-interactions and smooth transitions |
| **Backend** | Node.js (v20+ LTS), Express.js | Modular REST architecture, custom AppError hierarchy, async handlers |
| **Database & ORM** | PostgreSQL 16 (Supabase), Prisma ORM v6 | Connection pooling via PgBouncer, strict relational schema |
| **AI / LLM** | Google Gemini 2.5 Flash API | Multi-agent analysis, structured JSON outputs, Text-to-SQL |
| **Payments** | Razorpay Node SDK, Razorpay Checkout.js | PCI-DSS Level 1 compliant, UPI, Cards, Netbanking |
| **Security** | Crypto (HMAC-SHA256), Helmet, CORS, Rate Limiting, JWT | Zero-trust authentication, cryptographic signature validation |
| **Scheduled Jobs**| Node-Cron | Hourly automated subscription lifecycle worker |
| **PDF Invoicing** | jsPDF, html2canvas | Client-side 18% GST tax invoice synthesis |
| **Testing** | Node.js Native Test Runner, Assert | Automated unit test suites for payment fraud protection & deduplication |

---

## 📡 Comprehensive API Reference

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/auth/register` | Register new user account with initial wallet | ❌ |
| `POST` | `/api/auth/login` | Authenticate credentials and receive signed JWT | ❌ |
| `POST` | `/api/auth/google` | OAuth 2.0 Google Sign-In verification | ❌ |

### 2. Multi-Agent AI Core (`/api/ai`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/ai/upload` | Ingest bank statement CSV & dispatch 5-agent parallel analysis | ✅ |
| `POST` | `/api/ai/ask` | Natural language Text-to-SQL query engine over user's transactions | ✅ |
| `POST` | `/api/ai/chat` | Conversational financial copilot with contextual intent routing | ✅ |

### 3. Fintech Payment & Subscription (`/api/payment`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/payment/create-order` | Create Razorpay order & record pending transaction in database | ✅ |
| `POST` | `/api/payment/verify` | Cryptographically verify HMAC-SHA256 signature & activate plan | ✅ |
| `GET` | `/api/payment/subscription` | Fetch active plan, expiration countdown & full payment history | ✅ |
| `POST` | `/api/payment/cancel` | Immediately cancel Pro subscription and revert user to Starter tier | ✅ |
| `POST` | `/api/payment/webhook` | Server-to-server webhook endpoint with raw body signature check | ❌ *(Signed)* |

### 4. Transactions, Accounts & Budgets
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/transactions` | Paginated transactions with search, category filtering & sorting | ✅ |
| `POST` | `/api/transactions` | Create single manual transaction | ✅ |
| `GET` | `/api/accounts` | Retrieve user checking, savings, and investment accounts | ✅ |
| `POST` | `/api/accounts` | Provision new financial account with starting balance | ✅ |
| `GET` | `/api/budgets` | Fetch monthly envelope budgets with live actual-spend progress | ✅ |
| `POST` | `/api/budgets` | Set or update spending ceiling for specific categories | ✅ |
| `GET` | `/api/dashboard/summary`| Aggregated metrics (net cash flow, monthly burn rate, health score) | ✅ |

---

## 🧪 Automated Test Suite

CashFlow AI includes automated fintech unit tests verifying cryptographic integrity, fraud resistance, and statement deduplication:

```bash
cd backend
npm test
```

### Test Suite Output:
```text
TAP version 13
# Subtest: Zero-Duplicate Transaction Engine & Cryptographic Deduplication
    ok 1 - should generate identical hash for duplicate bank statement transactions
    ok 2 - should generate distinct hashes for legitimate repeated charges on different days
    ok 3 - should generate distinct hashes for different amounts with same merchant on same day
ok 1 - Zero-Duplicate Transaction Engine & Cryptographic Deduplication (13ms)

# Subtest: Fintech Payment Security & Razorpay Cryptographic Verification
    ok 1 - should generate and verify authentic HMAC-SHA256 signature for client checkout
    ok 2 - should strictly reject tampered payment IDs or modified order IDs (Fraud Protection)
    ok 3 - should calculate accurate subscription duration (30 days vs 365 days)
    ok 4 - should verify server-to-server webhook raw body signature matching Razorpay specification
ok 2 - Fintech Payment Security & Razorpay Cryptographic Verification (7ms)

1..2
# tests 7
# suites 2
# pass 7
# fail 0
```

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
JWT_SECRET="your_strong_jwt_secret_key"
GEMINI_API_KEY="your_google_gemini_api_key"
RAZORPAY_KEY_ID="rzp_test_YourKeyIdHere"
RAZORPAY_KEY_SECRET="YourRazorpaySecretHere"
RAZORPAY_WEBHOOK_SECRET="YourRazorpayWebhookSecretHere"
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
*Backend will run at `http://localhost:5000` with the automated subscription cron daemon initialized.*

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

## 🔐 Security & Data Governance

| Threat Model | Engineering Mitigation |
|---|---|
| **Cross-Tenant Data Exposure** | All Prisma queries are strictly scoped by verified JWT `userId`. No endpoint allows foreign key substitution. |
| **SQL Injection via AI** | Gemini-generated SQL is validated by a strict parser: must start with `SELECT`, blocklists all write keywords (`DROP`, `INSERT`, `UPDATE`), and enforces `userId` scoping literals. |
| **Payment Signature Tampering** | Payment verifications recompute HMAC-SHA256 digests on the server using `RAZORPAY_KEY_SECRET`. Mock or altered IDs trigger immediate database rejection. |
| **Webhook Replay Attacks** | Webhook listener validates Razorpay header signatures against raw request bodies before processing state updates. |
| **Card Data Security** | Zero credit card or banking credentials touch our application servers. All payment transactions run inside Razorpay's PCI-DSS Level 1 iframe sandbox. |

---

## 📂 Project Structure

```
CashFlow-AI/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema (User, Transaction, Account, SubscriptionPayment)
│   │   └── seed.js               # Seed script for initial categories & demo data
│   ├── src/
│   │   ├── config/               # Environment & database connection configs
│   │   ├── errors/               # Centralized AppError and exception handling
│   │   ├── jobs/                 # Cron workers (subscription expiration daemon)
│   │   ├── middleware/           # Auth, rate-limiter, error-handler, validation
│   │   ├── modules/
│   │   │   ├── account/          # Account balances & provisioning
│   │   │   ├── ai/               # 5-Agent ingestion pipeline & Text-to-SQL engine
│   │   │   ├── auth/             # JWT auth & Google OAuth
│   │   │   ├── budget/           # Category envelope budget tracking
│   │   │   ├── dashboard/        # Financial health metrics & trend aggregation
│   │   │   ├── payment/          # Razorpay orders, HMAC verification & webhooks
│   │   │   └── transaction/      # CRUD, pagination & SHA-256 deduplication
│   │   └── server.js             # Express application entrypoint
│   └── tests/
│       ├── deduplication.test.js # Statement deduplication test suite
│       └── payment.test.js       # Fintech security & signature verification suite
│
├── frontend/
│   ├── public/                   # Static assets & favicon
│   ├── src/
│   │   ├── components/           # Reusable UI components (Card, Button, Modal, Nav)
│   │   ├── context/              # AuthContext & ThemeContext (Midnight Sapphire)
│   │   ├── pages/                # App views (Dashboard, Transactions, Accounts, Settings, AIAssistant)
│   │   ├── services/             # Axios API client & Razorpay SDK loader
│   │   └── utils/
│   │       ├── cn.ts             # Tailwind class merging utility
│   │       └── invoiceGenerator.ts # Client-side GST Tax Invoice PDF synthesizer
│   ├── index.html                # Pre-loaded Razorpay checkout script
│   └── package.json
│
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