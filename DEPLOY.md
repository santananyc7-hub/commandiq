# Deploying CommandIQ

CommandIQ is a standard Next.js 15 app and runs fully in **demo mode with no
environment variables**, so it deploys as-is to any Next.js host.

## Fastest demo — Vercel from your machine (no GitHub needed)

```bash
cd CommandIQ
npx vercel          # first run: log in, accept defaults → preview URL
npx vercel --prod   # production URL you can share/demo
```

That gives you a live `https://<project>.vercel.app` in about a minute.

## Via GitHub + Vercel dashboard

1. Push this repo to GitHub (see below).
2. Go to [vercel.com/new](https://vercel.com/new), **Import** the repo.
3. Framework preset auto-detects **Next.js** — no config needed. Deploy.

## Push to GitHub

```bash
# From the CommandIQ folder (already git-initialized with a first commit):

# Option A — GitHub CLI (installs once, then browser login):
gh auth login
gh repo create commandiq --private --source . --remote origin --push

# Option B — create an empty repo on github.com, then:
git remote add origin https://github.com/<you>/commandiq.git
git branch -M main
git push -u origin main
```

## Optional environment variables

None are required for the demo. To enable the live integrations, set these in
the host's project settings (see `.env.example`):

| Variable | Enables |
|----------|---------|
| `ANTHROPIC_API_KEY` | Claude phrasing for open-ended AI CFO questions |
| `QUICKBOOKS_CLIENT_ID` / `QUICKBOOKS_CLIENT_SECRET` | Live QuickBooks OAuth |
| `QUICKBOOKS_REDIRECT_URI` | `https://<your-domain>/api/integrations/quickbooks/callback` |
| `QUICKBOOKS_ENVIRONMENT` | `sandbox` or `production` |
| `APP_URL` | Your deployed origin (used by the OAuth redirects) |
