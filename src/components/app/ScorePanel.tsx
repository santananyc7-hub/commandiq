import { Plus, Minus } from "lucide-react";
import type { CommandScore } from "@/lib/types";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { cn } from "@/lib/cn";

const STATUS_LABEL: Record<CommandScore["status"], string> = {
  strong: "Strong",
  stable: "Stable",
  attention: "Attention Needed",
  critical: "Critical",
};

const STATUS_TOKEN: Record<CommandScore["status"], string> = {
  strong: "--positive",
  stable: "--accent-500",
  attention: "--watch",
  critical: "--critical",
};

/** The CommandIQ Score — the first thing management sees (§5). */
export function ScorePanel({ score }: { score: CommandScore }) {
  const token = STATUS_TOKEN[score.status];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
      <div className="grid-texture pointer-events-none absolute inset-0 opacity-[0.35]" />
      <div className="relative grid gap-6 p-6 lg:grid-cols-[auto_1fr] lg:gap-8 lg:p-7">
        <div className="flex flex-col items-center gap-3">
          <div className="text-2xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">
            CommandIQ Score
          </div>
          <ScoreGauge score={score.score} status={score.status} />
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold"
            style={{ color: `rgb(var(${token}))`, backgroundColor: `rgb(var(${token}) / 0.14)` }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `rgb(var(${token}))` }} />
            {STATUS_LABEL[score.status]}
          </span>
        </div>

        <div className="flex flex-col justify-center">
          <h2 className="text-balance text-xl font-semibold tracking-tight text-ink">
            {score.headline}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            A weighted read of revenue, margin, liquidity, payables and expense control.
          </p>

          <div className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {score.drivers.map((d) => (
              <div key={d.label} className="flex items-start gap-2">
                <span
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded",
                    d.direction === "positive"
                      ? "bg-positive-soft text-positive-strong"
                      : "bg-negative-soft text-negative-strong"
                  )}
                >
                  {d.direction === "positive" ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                </span>
                <span className="min-w-0 text-[13px]">
                  <span className="font-medium text-ink">{d.label}</span>
                  <span className="text-ink-subtle"> — {d.detail}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
