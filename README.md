# CashFlow AI

A full-stack personal finance copilot that combines standard transaction/budget management with an AI decision layer — automatic categorization, fraud detection, financial health scoring, and natural-language querying over your own data.

**Live app:** https://cash-flow-ai-rose.vercel.app
**Live API:** https://cashflow-ai-oz1i.onrender.com

> Note: the backend is on Render's free tier, which spins down after inactivity — the first request after a while may take 30-60s to wake up.

---

## What it does

- Upload a bank statement CSV → 5 AI agents run in parallel to categorize transactions, flag anomalous charges, generate spending insights, budget advice, and a financial health score
- Ask questions in plain English ("how much did I spend on food last month?") → a router agent decides whether the question needs real data (converts it to a safe, sandboxed SQL query against your own transactions) or is general advice (answered directly)
- Full CRUD for accounts, transactions (with search/filter/sort/pagination), categories, and budgets (with live progress tracking against actual spend)
- Duplicate-safe re-uploads — re-uploading the same statement won't create duplicate transactions

## Tech stack

**Backend:** Node.js, Express, PostgreSQL, Prisma ORM, JWT auth, Zod validation, Google Gemini API
**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, Recharts, Axios
**Infra:** Supabase (Postgres), Render (API), Vercel (frontend)

## Architecture — the AI layer

This is the part worth reading if you're evaluating the project rather than just running it.

```
CSV upload
   │
   ▼
Parse → 5 agents run in parallel (Promise.all)
   ├── Category agent   → classifies each transaction against real seeded categories
   ├── Fraud agent       → flags suspicious/duplicate transactions by index
   ├── Insight agent      → summarizes spending patterns
   ├── Budget agent       → advice against current budgets
   └── Health agent       → 0–100 financial health score
   │
   ▼
Results merged back onto transactions by index → deduped against existing DB rows → persisted
```

```
Chat message
   │
   ▼
Router agent classifies intent
   ├── DATA_QUERY   → SQL agent generates a constrained, read-only SELECT
   │                   (schema-scoped, user-scoped, keyword-blocklisted)
   │                   → executed → answer agent phrases the result in plain English
   └── GENERAL_ADVICE → answered directly, no DB access
```

Design decisions worth knowing:
- The category/fraud agents key results by transaction **index**, not merchant name — merchant-name keying breaks when the same merchant appears multiple times with different context.
- AI-generated SQL is never trusted blindly: it's checked against a keyword blocklist (no `INSERT`/`DROP`/etc.), must start with `SELECT`, and must contain the requesting user's ID literal to prevent cross-user data leaks.
- This is intentionally **not** a fully agentic system (no tool-calling loops, no persistent agent memory) — it's LLM-driven routing and analysis. That distinction is deliberate, not a limitation I'm unaware of.

## Local setup

### Backend
```bash
cd backend
npm install
# fill in .env — see .env.example
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
# set VITE_API_BASE_URL in .env to your backend URL
npm run dev
```

### Environment variables (backend)
```
DATABASE_URL=        # Postgres connection string (pooled)
DIRECT_URL=          # Postgres connection string (direct, for migrations)
JWT_SECRET=
GEMINI_API_KEY=
PORT=5000
```

## API overview

| Module | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Accounts | `GET/POST /api/accounts`, `PUT/DELETE /api/accounts/:id` |
| Categories | `GET/POST /api/categories`, `DELETE /api/categories/:id` |
| Transactions | `GET/POST /api/transactions` (search/filter/sort/pagination), `PUT/DELETE /api/transactions/:id` |
| Budgets | `GET/POST /api/budgets` (with live progress), `PUT/DELETE /api/budgets/:id` |
| Dashboard | `GET /api/dashboard/summary`, `/category-breakdown`, `/monthly-trend`, `/recent-transactions` |
| AI | `POST /api/ai/upload` (statement analysis), `POST /api/ai/ask` (text-to-SQL), `POST /api/ai/chat` (intent-routed assistant) |

All routes except auth require `Authorization: Bearer <token>`.

## Known limitations

- Statement upload runs synchronously (5 sequential/parallel Gemini calls) — no background job queue yet, so large statements will feel slow
- No automated test suite yet
- Free-tier hosting means cold starts on the backend

## Roadmap

- [ ] Background job queue (BullMQ) for async statement processing
- [ ] Dynamic agent selection (skip irrelevant agents based on what's actually in the upload)
- [ ] Unit/integration test coverage