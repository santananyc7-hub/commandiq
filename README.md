# CommandIQ · by Revenue Labs

**Your business. Under control.**

CommandIQ is an internal financial operating system — a command center for
ownership and management that turns QuickBooks financial data into operational
decisions. It doesn't just show your data; it tells you **what changed, why it
matters, what to look at, and what happens if you do nothing.**

The first live deployment is for **Torches NYC** (Polanco Brothers Corp), but
the product is org-agnostic and built to expand.

---

## What it answers

- How much cash do we actually have available?
- What obligations are due — and which vendors create risk?
- What changed financially, and where are expenses accelerating?
- Are we on pace to hit our revenue goal?
- Can we afford this purchase right now?
- What deserves attention today?

## Modules

| Route          | Module                | Purpose |
|----------------|-----------------------|---------|
| `/dashboard`   | Command Center        | CommandIQ Score, KPI strip, Needs Attention feed, cash, pace, aging, margin, What Changed, AI weekly brief |
| `/cash`        | Cash & Obligations    | Available-cash waterfall + manual obligation layer & calendar |
| `/vendors`     | Vendors & AP Control  | Aging, vendor health/risk, and the explainable **Payment Planner** |
| `/performance` | Revenue & Margin      | Pace, projection, margin & COGS trends, monthly comparison |
| `/expenses`    | Expense Watch         | Variance vs. trend, categories outgrowing revenue |
| `/actions`     | Action Board          | Insight → operational work + **Find Me Savings** |
| `/settings`    | Settings              | Targets, QuickBooks integration, team & roles |

Plus a global **Ask CommandIQ** (AI CFO) panel and a **⌘K command palette**.

---

## Architecture

- **Next.js 15** (App Router) · **React 19** · **TypeScript** (strict)
- **Tailwind CSS 3** with a fully token-driven, dark-first design system
- **lucide-react** icons; all data-viz is hand-built **SVG** (no chart lib)
- **@anthropic-ai/sdk** for the optional AI CFO enhancement
- Financial engine is **pure & deterministic** (`src/lib/finance/*`)

```
src/
  app/
    (app)/            authenticated shell + the six modules + settings
    api/
      ask/                     AI CFO endpoint (grounded)
      integrations/quickbooks/ connect · callback · sync
    page.tsx          premium landing / product entry
    onboarding/       4-step onboarding
  components/
    app/ ui/ charts/ brand/ marketing/
  lib/
    finance/          score · revenue · ap · cash · expenses · planner · alerts · changes · savings
    integrations/     quickbooks OAuth layer
    ai/               grounded reasoner + factsheet
    demo/             seeded Torches NYC dataset (isolated, clearly labeled)
    store.ts          single computed source of truth
docs/FINANCIAL_LOGIC.md
tests/finance.test.ts
```

## Design system

Dark-first "financial command center" — near-black graphite surfaces, soft
white ink, cool neutral grays, and a single restrained blue **intelligence**
accent. Green/red are reserved strictly for financial status. All colors are CSS
variables (`src/app/globals.css`) so the light theme stays in perfect sync.
Tokens: `canvas / surface / surface-2 / surface-3 / border / ink / ink-muted /
accent-* / positive / negative / critical / high / watch / info`.

---

## Setup

```bash
npm install
npm run dev        # http://localhost:3005
```

The app runs fully in **demo mode** with no credentials — the seeded Torches NYC
workspace exercises every screen.

### Environment variables

Copy `.env.example` → `.env.local`:

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Optional. Lets Claude phrase answers for open-ended AI CFO questions. Without it, the deterministic reasoner handles everything. |
| `QUICKBOOKS_CLIENT_ID` / `QUICKBOOKS_CLIENT_SECRET` | QuickBooks Online app credentials (from developer.intuit.com). |
| `QUICKBOOKS_REDIRECT_URI` | OAuth redirect, e.g. `http://localhost:3005/api/integrations/quickbooks/callback`. |
| `QUICKBOOKS_ENVIRONMENT` | `sandbox` or `production`. |

No secrets are ever bundled to the client; the token exchange runs server-side only.

### QuickBooks app setup

1. Create an app at [developer.intuit.com](https://developer.intuit.com) with the
   `com.intuit.quickbooks.accounting` scope.
2. Add the redirect URI above to the app's **Redirect URIs**.
3. Put the keys in `.env.local`.
4. In-app: **Settings → Integrations → Connect QuickBooks** starts the OAuth flow
   (`/api/integrations/quickbooks/connect` → Intuit consent → `/callback`).

When credentials are absent, Settings shows a demo-mode notice and the seeded
connection so the flow is still explorable. Live sync normalizes accounts, P&L,
balance sheet, vendors, bills, payments, invoices and purchases into CommandIQ's
models. **Demo and live data never mix** (`DEMO_MODE` flag, isolated fixtures).

---

## Sync architecture

`src/lib/integrations/quickbooks.ts` is the extension point: it builds the OAuth2
authorization URL, exchanges the code for bearer tokens against Intuit's official
endpoints, and resolves connection status. Sync metadata (last sync, status,
errors, per-entity counts) surfaces in Settings with a manual **Sync Now**. The
layer is designed so Dutchie, Headset, Alpine IQ, payroll and banking feeds can
be added as siblings later without touching the financial engine.

## AI architecture

**Ask CommandIQ** never hallucinates. The deterministic reasoner
(`src/lib/ai/reasoner.ts`) composes every answer — Conclusion · Evidence · Impact
· Recommendation — strictly from computed state, so figures are always real and
traceable. When an `ANTHROPIC_API_KEY` is set *and* a question doesn't match a
known intent, Claude may phrase a grounded answer constrained to a factsheet of
real numbers; any failure falls back to the reasoner. If data is unavailable, the
system says so rather than inventing an answer.

## Financial logic & the CommandIQ Score

See **[docs/FINANCIAL_LOGIC.md](docs/FINANCIAL_LOGIC.md)** for every formula
(revenue pace, projection, margin, expense variance, AP aging, available cash,
the eight-pillar CommandIQ Score, vendor priority, and payment-planner logic).
The score model is documented and its weights are configurable.

---

## Quality gates

```bash
npm run lint         # eslint (next/core-web-vitals) — clean
npm run typecheck    # tsc --noEmit — clean
npm run build        # production build — 16 routes
npm test             # deterministic financial calculations — 12 tests
```

## Security

Server-side authorization, no QuickBooks secrets in the client bundle, no
financial data on public routes, validation on all writes, and a documented,
least-privilege role model (Owner / Finance / Manager / Viewer) surfaced in
Settings → Team. Sensitive changes are designed for audit logging.

## Roadmap (architected, not yet built)

Contract & lease ingestion, banking feeds, and retail/customer integrations
(Dutchie, Headset, Alpine IQ, payroll) plug in as new sources behind the same
normalized financial layer. V1 is intentionally exceptional with QuickBooks
alone.

---

© 2026 Revenue Labs · CommandIQ
