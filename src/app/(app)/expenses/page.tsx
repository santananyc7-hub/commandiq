import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { getFinancialState } from "@/lib/store";
import { money, percent } from "@/lib/format";
import type { ExpenseStatus } from "@/lib/types";
import { PageHeader } from "@/components/app/PageHeader";
import { DemoBadge } from "@/components/app/DemoBadge";
import { Card, CardHeader } from "@/components/ui/Card";
import { Trend } from "@/components/ui/Trend";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Expense Watch" };

const STATUS_META: Record<ExpenseStatus, { label: string; token: string }> = {
  ok: { label: "On trend", token: "info" },
  watch: { label: "Watch", token: "watch" },
  elevated: { label: "Elevated", token: "high" },
  critical: { label: "Critical", token: "critical" },
};

export default function ExpensesPage() {
  const { expenses, revenueGrowthPct } = getFinancialState();
  const flagged = expenses.filter((e) => e.flag);
  const totalCurrent = expenses.reduce((s, e) => s + e.current, 0);
  const totalVariance = expenses.reduce((s, e) => s + e.varianceAbs, 0);

  return (
    <>
      <PageHeader
        eyebrow="Cost Control"
        title="Expense Watch"
        subtitle="Where is spend accelerating faster than the business?"
        action={<DemoBadge />}
      />

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Total This Month" value={money(totalCurrent)} />
          <Stat label="Net Variance vs Trend" value={money(totalVariance)} tone={totalVariance > 0 ? "negative" : "positive"} />
          <Stat label="Revenue Growth" value={percent(revenueGrowthPct)} tone="neutral" />
          <Stat label="Flagged Categories" value={String(flagged.length)} tone={flagged.length ? "watch" : "neutral"} />
        </div>

        {flagged.length > 0 && (
          <Card className="border-watch/30">
            <div className="flex items-start gap-3 p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-watch/12">
                <AlertTriangle className="h-4 w-4 text-watch" />
              </span>
              <div>
                <div className="text-sm font-semibold text-ink">Spending signals</div>
                <ul className="mt-2 space-y-1.5">
                  {flagged.map((e) => (
                    <li key={e.id} className="flex gap-2 text-[13px] text-ink-muted">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-watch" />
                      {e.flag}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <CardHeader title="Category Detail" subtitle="Current month vs prior and 3-month average" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
                  <th className="px-5 py-2.5">Category</th>
                  <th className="px-3 py-2.5 text-right">Current</th>
                  <th className="px-3 py-2.5 text-right">Prior</th>
                  <th className="px-3 py-2.5 text-right">3-Mo Avg</th>
                  <th className="px-3 py-2.5 text-right">Variance</th>
                  <th className="px-3 py-2.5 text-right">vs Trend</th>
                  <th className="px-5 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.map((e) => {
                  const meta = STATUS_META[e.status];
                  return (
                    <tr key={e.id} className="hover:bg-surface-2/40">
                      <td className="px-5 py-3">
                        <div className="font-medium text-ink">{e.name}</div>
                        {e.flag && <div className="mt-0.5 max-w-md text-2xs text-ink-subtle">{e.flag}</div>}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold tabular text-ink">{money(e.current)}</td>
                      <td className="px-3 py-3 text-right tabular text-ink-muted">{money(e.prior)}</td>
                      <td className="px-3 py-3 text-right tabular text-ink-muted">{money(e.threeMonthAvg)}</td>
                      <td className="px-3 py-3 text-right tabular text-ink-muted">{money(e.varianceAbs, { sign: true })}</td>
                      <td className="px-3 py-3 text-right">
                        <Trend value={e.variancePct} goodDirection="down" className="justify-end" />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-2xs font-semibold"
                          style={{ color: `rgb(var(--${meta.token}))`, backgroundColor: `rgb(var(--${meta.token}) / 0.14)` }}
                        >
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "negative" | "positive" | "watch";
}) {
  const toneClass = cn(
    "mt-1 text-xl font-semibold tabular",
    tone === "negative" && "text-negative-strong",
    tone === "positive" && "text-positive-strong",
    tone === "watch" && "text-watch",
    tone === "neutral" && "text-ink"
  );
  return (
    <Card className="p-4">
      <div className="text-2xs font-medium uppercase tracking-wide text-ink-subtle">{label}</div>
      <div className={toneClass}>{value}</div>
    </Card>
  );
}
