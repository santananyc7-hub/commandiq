"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import type { Vendor, VendorMetric } from "@/lib/types";
import { buildPaymentPlan, DEFAULT_PLANNER_WEIGHTS } from "@/lib/finance/planner";
import { money, moneyCompact } from "@/lib/format";
import { VendorClassBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

const PRESETS = [50_000, 75_000, 100_000];

export function PaymentPlanner({
  vendors,
  metrics,
  suggested = 75_000,
}: {
  vendors: Vendor[];
  metrics: [string, VendorMetric][];
  suggested?: number;
}) {
  const [budget, setBudget] = useState(suggested);
  const [input, setInput] = useState(String(suggested));

  const metricMap = useMemo(() => new Map(metrics), [metrics]);
  const plan = useMemo(
    () => buildPaymentPlan(budget, vendors, metricMap, DEFAULT_PLANNER_WEIGHTS),
    [budget, vendors, metricMap]
  );

  const funded = plan.allocations.filter((a) => a.recommended > 0);
  const deferred = plan.allocations.filter((a) => a.recommended === 0);

  function apply(v: number) {
    setBudget(v);
    setInput(String(v));
  }

  return (
    <div>
      <div className="border-b border-border p-5">
        <label className="mb-1.5 block text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
          Cash available for vendor payments
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle">$</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onBlur={() => apply(Math.max(0, parseFloat(input.replace(/[^0-9.]/g, "")) || 0))}
              onKeyDown={(e) => e.key === "Enter" && apply(Math.max(0, parseFloat(input.replace(/[^0-9.]/g, "")) || 0))}
              className="h-10 w-40 rounded-lg border border-border bg-surface-2 pl-7 pr-3 text-sm font-semibold tabular text-ink focus:border-accent-400 focus:bg-surface focus:outline-none"
            />
          </div>
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => apply(p)}
              className={cn(
                "rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors",
                budget === p
                  ? "border-accent-500/50 bg-accent-50 text-accent-700"
                  : "border-border text-ink-muted hover:bg-surface-2"
              )}
            >
              {moneyCompact(p)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <Stat label="Budget" value={money(plan.budget)} />
        <Stat label="Allocated" value={money(plan.allocated)} tone="accent" />
        <Stat label="Remaining" value={money(plan.remaining)} tone={plan.remaining > 0 ? "positive" : "neutral"} />
      </div>

      <div className="divide-y divide-border">
        {funded.map((a) => {
          const pct = a.balance > 0 ? (a.recommended / a.balance) * 100 : 0;
          return (
            <div key={a.vendorId} className="px-5 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-ink">{a.vendorName}</span>
                    <VendorClassBadge classification={a.classification} />
                  </div>
                  <div className="mt-0.5 text-2xs text-ink-subtle">{a.reason}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular text-ink">{money(a.recommended)}</div>
                  <div className="text-2xs text-ink-subtle">of {moneyCompact(a.balance)}</div>
                </div>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-accent-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {deferred.length > 0 && (
        <div className="border-t border-border bg-surface-2/30 px-5 py-3">
          <div className="mb-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-subtle">Deferred this run</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {deferred.map((a) => (
              <span key={a.vendorId} className="text-2xs text-ink-subtle">
                {a.vendorName} · {moneyCompact(a.balance)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 border-t border-border px-5 py-3 text-2xs text-ink-subtle">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Recommendations weigh aging, criticality, COD status and concentration. They are advisory —
        adjust before you pay. Disputed balances are never auto-allocated.
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "accent" | "positive" }) {
  const toneClass = tone === "accent" ? "text-accent-600" : tone === "positive" ? "text-positive-strong" : "text-ink";
  return (
    <div className="px-5 py-3 text-center">
      <div className="text-2xs font-medium uppercase tracking-wide text-ink-subtle">{label}</div>
      <div className={cn("mt-0.5 text-lg font-semibold tabular", toneClass)}>{value}</div>
    </div>
  );
}
