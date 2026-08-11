import Link from "next/link";
import {
  ArrowRight,
  Wallet,
  Building2,
  TrendingUp,
  Receipt,
  Sparkles,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";

const QUESTIONS = [
  "How much cash do we actually have available?",
  "Which vendors are creating risk?",
  "What changed financially this week?",
  "Are we on pace to hit our revenue goal?",
  "Where are expenses accelerating?",
  "Can we afford this purchase right now?",
];

const MODULES = [
  { icon: Activity, title: "Command Center", body: "A single CommandIQ Score and a prioritized feed of what needs attention today." },
  { icon: Wallet, title: "Cash & Obligations", body: "Know exactly how much cash you can safely use after every commitment." },
  { icon: Building2, title: "Vendors & AP", body: "Aging, vendor risk, and an explainable plan for who to pay first." },
  { icon: TrendingUp, title: "Performance", body: "Revenue pace, projections and margin — is the growth actually healthy?" },
  { icon: Receipt, title: "Expense Watch", body: "Catch spend accelerating faster than the business, before it compounds." },
  { icon: Sparkles, title: "AI CFO", body: "Ask anything. Every answer is grounded in your real financial data." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-border bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <div className="flex items-center gap-3">
            <Link href="/onboarding" className="hidden text-sm font-medium text-ink-muted hover:text-ink sm:block">
              Onboarding
            </Link>
            <ButtonLink href="/dashboard" size="sm">
              Enter Command Center
            </ButtonLink>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Higgsfield-generated financial-intelligence environment */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-50"
          style={{ backgroundImage: "url(/hero.png)" }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgb(var(--canvas)) 4%, transparent 60%), linear-gradient(to right, rgb(var(--canvas) / 0.92), rgb(var(--canvas) / 0.35) 45%, transparent 75%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(1100px 500px at 70% -10%, rgb(var(--accent-500) / 0.14), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-500/30 bg-accent-50/50 px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-accent-700 shadow-glow">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500 animate-pulse-glow" />
              Financial Operating System
            </span>
            <h1 className="mt-5 text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              Your business.
              <br />
              <span className="text-accent-500">Under control.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">
              CommandIQ turns your financial data into decisions. See what changed, know what matters,
              and act before it becomes a problem.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href="/dashboard" size="lg" className="group">
                Enter Command Center
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </ButtonLink>
              <ButtonLink href="/onboarding" size="lg" variant="secondary">
                Connect QuickBooks
              </ButtonLink>
            </div>
            <div className="mt-6 flex items-center gap-2 text-2xs text-ink-subtle">
              <ShieldCheck className="h-3.5 w-3.5 text-positive" />
              Bank-grade security · QuickBooks-native · No contract uploads to get started
            </div>
          </div>
        </div>
      </section>

      {/* Questions it answers */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-accent-500">The questions it answers</p>
        <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-ink">
          The distinction is the entire product.
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          CommandIQ doesn&rsquo;t just show your financial data. It tells you what changed, why it
          matters, what to look at, and what happens if you do nothing.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUESTIONS.map((q) => (
            <div key={q} className="rounded-xl border border-border bg-surface p-4 text-[15px] font-medium text-ink">
              &ldquo;{q}&rdquo;
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section className="border-t border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.title} className="rounded-xl border border-border bg-surface p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-50">
                    <Icon className="h-[18px] w-[18px] text-accent-500" />
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-ink">{m.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{m.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink">
          See what changed. Know what matters.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-ink-muted">
          Act before it becomes a problem. The command center for ownership and management.
        </p>
        <div className="mt-7 flex justify-center">
          <ButtonLink href="/dashboard" size="lg" className="group">
            Enter Command Center
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </ButtonLink>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 sm:flex-row">
          <Logo />
          <p className="text-2xs text-ink-subtle">
            © 2026 Revenue Labs · CommandIQ · First deployment: Torches NYC
          </p>
        </div>
      </footer>
    </div>
  );
}
