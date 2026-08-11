# Deploying CommandIQ

CommandIQ ships as a **static export** (`output: "export"`) and deploys to
**GitHub Pages** — no server required. It runs fully in demo mode (Torches NYC
data) with no environment variables.

## GitHub Pages (primary — automatic)

A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the static
`out/` folder and publishes it on every push to `main`.

Live URL: **https://santananyc7-hub.github.io/commandiq/**

One-time setup (already done for this repo): the repo is public and Pages is set
to **Build and deployment → Source: GitHub Actions**. After that, every
`git push` to `main` redeploys automatically. Trigger a manual run anytime from
the repo's **Actions → Deploy to GitHub Pages → Run workflow**.

### How the static build works
- `output: "export"` emits a fully static `out/` (no Node server).
- `basePath`/`assetPrefix` are set to `/commandiq` in production so it serves
  correctly from the project subpath.
- **Ask CommandIQ** runs its deterministic reasoner in the browser (the same
  computed financial state) — no API needed.
- QuickBooks OAuth is demo-only in the static build; a live server deployment
  (below) re-enables it.

## Alternative — Vercel (adds the server back)

For live QuickBooks OAuth and optional Claude phrasing, deploy to a Node host.
Remove `output: "export"` from `next.config.ts`, then:

```bash
npx vercel --prod
```

Set env vars from `.env.example` in the project settings (`ANTHROPIC_API_KEY`,
`QUICKBOOKS_*`, `APP_URL`).

## Local development

```bash
npm install
npm run dev        # http://localhost:3005 — basePath is empty locally
npm run build      # produces ./out
npm test           # deterministic financial tests
```
