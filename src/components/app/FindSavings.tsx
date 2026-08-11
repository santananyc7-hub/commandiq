"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import type { ExpenseRow, Vendor, VendorMetric, Confidence } from "@/lib/types";
import { findSavings } from "@/lib/finance/savings";
import { money, moneyCompact } from "@/lib/format";
import { cn } from "@/lib/cn";

const PRESETS = [5_000, 10_000, 25_000];
const CONF_META: Record<Confidence, { label: string; token: string }> = {
  high: { label: "High confidence", token: "positive" },
  medium: { label: "Medium confidence", token: "watch" },
  review: { label: "Needs review", token: "info" },
};

export function FindSavings({
  expenses,
  vendors,
  metrics,
}: {
  expenses: ExpenseRow[];
  vendors: Vendor[];
  metrics: [string, VendorMetric][];
}) {
  const [target, setTarget] = useState(10_000);
  const metricMap = useMemo(() => new Map(metrics), [metrics]);
  const result = useMemo(
    () => findSavings(target, expenses, vendors, metricMap),
    [target, expenses, vendors, metricMap]
  );

  const pctToTarget = Math.min(100, (result.monthlyTotal / target) * 100);

  return (
    <div>
      <div className="border-b border-border p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-50 shadow-glow">
            <Sparkles className="h-4 w-4 text-accent-500" />
          </span>
          <span className="text-sm font-semibold text-ink">Find me savings</span>
        </div>
        <p className="mb-3 text-[13px] text-ink-muted">How much do you want to find per month?</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setTarget(p)}
              className={cn(
                "rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors",
                target === p ? "border-accent-500/50 bg-accent-50 text-accent-700" : "border-border text-ink-muted hover:bg-surface-2"
              )}
            >
              {moneyCompact(p)}
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-border p-5">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xs font-medium uppercase tracking-wide text-ink-subtle">Potential monthly savings</div>
            <div className="mt-0.5 text-2xl font-semibold tabular text-ink">{money(result.monthlyTotal)}</div>
          </div>
          <div className="text-right text-2xs text-ink-subtle">
            {result.monthlyTotal >= target ? "Target reachable" : `${((result.monthlyTotal / target) * 100).toFixed(0)}% of target`}
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-accent-500" style={{ width: `${pctToTarget}%` }} />
        </div>
        <div className="mt-3 flex gap-4">
          {(["high", "medium", "review"] as Confidence[]).map((c) => (
            <div key={c} className="text-2xs">
              <span className="font-semibold tabular text-ink">{moneyCompact(result.byConfidence[c])}</span>{" "}
              <span className="text-ink-subtle">{CONF_META[c].label.split(" ")[0].toLowerCase()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="divide-y divide-border">
        {result.opportunities.map((o) => {
          const meta = CONF_META[o.confidence];
          return (
            <div key={o.id} className="px-5 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{o.title}</span>
                  </div>
                  <div className="mt-0.5 text-2xs text-ink-subtle">{o.area}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular text-ink">{money(o.monthly)}</div>
                  <span
                    className="mt-0.5 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: `rgb(var(--${meta.token}))`, backgroundColor: `rgb(var(--${meta.token}) / 0.14)` }}
                  >
                    {meta.label}
                  </span>
                </div>
              </div>
              <p className="mt-1.5 text-2xs leading-relaxed text-ink-subtle">{o.rationale}</p>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-3 text-2xs text-ink-subtle">
        These are <span className="text-ink-muted">potential opportunities</span>, not confirmed waste. Review each
        before acting — legitimate spend is never auto-classified.
      </div>
    </div>
  );
}
