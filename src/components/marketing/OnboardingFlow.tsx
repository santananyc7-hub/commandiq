"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Plug, Target, Loader2, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const STEPS = ["Welcome", "Connect", "Targets", "Analyze"];

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [targets, setTargets] = useState<Record<string, string>>({
    monthlyRevenueGoal: "1,000,000",
    cashReserve: "75,000",
    payrollPct: "12",
    marketingPct: "5",
    grossMarginPct: "45",
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      <div className="grid-texture pointer-events-none absolute inset-0 opacity-30" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(900px 500px at 50% -10%, rgb(var(--accent-500) / 0.14), transparent 60%)" }}
      />
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col px-5 py-10">
        <div className="flex items-center justify-between">
          <Logo />
          <button onClick={() => router.push("/dashboard")} className="text-2xs text-ink-subtle hover:text-ink">
            Skip
          </button>
        </div>

        {/* Progress */}
        <div className="mt-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-2xs font-semibold transition-colors",
                  i < step ? "bg-positive text-white" : i === step ? "bg-accent-600 text-white" : "bg-surface-2 text-ink-subtle"
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("h-px flex-1", i < step ? "bg-positive" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 flex-1">
          {step === 0 && <Welcome onNext={() => setStep(1)} />}
          {step === 1 && <Connect onNext={() => setStep(2)} />}
          {step === 2 && <Targets targets={targets} setTargets={setTargets} onNext={() => setStep(3)} />}
          {step === 3 && <Analyze onDone={() => router.push("/dashboard")} />}
        </div>
      </div>
    </div>
  );
}

function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="animate-fade-up">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Welcome to CommandIQ</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
        Your financial command center. In under a minute we&rsquo;ll connect your data and set the
        targets that power every alert. No contract uploads. No rebuilding your chart of accounts.
      </p>
      <div className="mt-8">
        <Button onClick={onNext} size="lg" className="group">
          Get started <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </div>
  );
}

function Connect({ onNext }: { onNext: () => void }) {
  return (
    <div className="animate-fade-up">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 shadow-glow">
        <Plug className="h-5 w-5 text-accent-500" />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Connect QuickBooks</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
        CommandIQ reads your accounts, P&amp;L, vendors, bills and payments — and normalizes them into
        one live financial picture. This is the only connection you need to start.
      </p>
      <div className="mt-6 space-y-2">
        <a
          href="/api/integrations/quickbooks/connect"
          className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent-500/40"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-2 text-sm font-bold text-[#2ca01c]">qb</span>
          <span className="flex-1">
            <span className="block text-sm font-medium text-ink">QuickBooks Online</span>
            <span className="block text-2xs text-ink-subtle">Secure OAuth — we never see your password</span>
          </span>
          <ArrowRight className="h-4 w-4 text-ink-subtle" />
        </a>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={onNext} size="lg">Continue</Button>
        <button onClick={onNext} className="text-sm text-ink-subtle hover:text-ink">
          Explore in demo mode
        </button>
      </div>
    </div>
  );
}

function Targets({
  targets,
  setTargets,
  onNext,
}: {
  targets: Record<string, string>;
  setTargets: (t: Record<string, string>) => void;
  onNext: () => void;
}) {
  const fields = [
    { key: "monthlyRevenueGoal", label: "Monthly Revenue Goal", prefix: "$" },
    { key: "cashReserve", label: "Cash Reserve", prefix: "$" },
    { key: "payrollPct", label: "Payroll Target", suffix: "%" },
    { key: "marketingPct", label: "Marketing Target", suffix: "%" },
    { key: "grossMarginPct", label: "Gross Margin Target", suffix: "%" },
  ];
  return (
    <div className="animate-fade-up">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 shadow-glow">
        <Target className="h-5 w-5 text-accent-500" />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Set your targets</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
        These drive the CommandIQ Score and every alert. You can change them anytime in Settings.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-2xs font-medium uppercase tracking-wide text-ink-subtle">{f.label}</label>
            <div className="relative">
              {f.prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle">{f.prefix}</span>}
              <input
                value={targets[f.key]}
                onChange={(e) => setTargets({ ...targets, [f.key]: e.target.value })}
                className={cn("field", f.prefix && "pl-7", f.suffix && "pr-8")}
              />
              {f.suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle">{f.suffix}</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Button onClick={onNext} size="lg" className="group">
          Analyze my business <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </div>
  );
}

function Analyze({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0);
  const phases = [
    "Syncing accounts & balances",
    "Aging your payables",
    "Computing revenue pace & margin",
    "Scanning expenses for acceleration",
    "Building your CommandIQ Score",
  ];

  useEffect(() => {
    if (phase < phases.length) {
      const t = setTimeout(() => setPhase((p) => p + 1), 620);
      return () => clearTimeout(t);
    }
    const t = setTimeout(onDone, 700);
    return () => clearTimeout(t);
  }, [phase, phases.length, onDone]);

  return (
    <div className="animate-fade-up">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 shadow-glow">
        <Sparkles className="h-5 w-5 text-accent-500" />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Analyzing your business</h1>
      <p className="mt-2 text-[15px] text-ink-muted">Building your command center…</p>
      <div className="mt-6 space-y-2.5">
        {phases.map((p, i) => (
          <div key={p} className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full",
                i < phase ? "bg-positive text-white" : i === phase ? "bg-accent-50" : "bg-surface-2"
              )}
            >
              {i < phase ? (
                <Check className="h-3.5 w-3.5" />
              ) : i === phase ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-500" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-ink-subtle" />
              )}
            </span>
            <span className={cn("text-sm", i <= phase ? "text-ink" : "text-ink-subtle")}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
