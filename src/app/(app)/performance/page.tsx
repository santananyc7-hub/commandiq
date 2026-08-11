import type { Metadata } from "next";
import { getFinancialState, monthlyHistory } from "@/lib/store";
import { money, moneyCompact, percent } from "@/lib/format";
import { PageHeader } from "@/components/app/PageHeader";
import { DemoBadge } from "@/components/app/DemoBadge";
import { Card, CardHeader } from "@/components/ui/Card";
import { LineChart, type LinePoint } from "@/components/charts/LineChart";
import { Trend } from "@/components/ui/Trend";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Performance" };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ml = (ym: string) => MONTHS[parseInt(ym.slice(5, 7), 10) - 1] ?? ym;

export default function PerformancePage() {
  const { revenue, targets } = getFinancialState();

  const revenueTrend: LinePoint[] = [
    ...monthlyHistory.map((m) => ({ label: ml(m.month), value: m.revenue })),
    { label: "Aug*", value: revenue.projectedMonthEnd },
  ];
  const marginTrend: LinePoint[] = [
    ...monthlyHistory.map((m) => ({ label: ml(m.month), value: Math.round((m.grossProfit / m.revenue) * 1000) / 10 })),
    { label: "Aug*", value: Math.round(revenue.grossMarginPct * 1000) / 10 },
  ];
  const cogsTrend: LinePoint[] = monthlyHistory.map((m) => ({ label: ml(m.month), value: m.revenue - m.grossProfit }));

  const goalGap = revenue.projectedMonthEnd - revenue.monthlyGoal;

  return (
    <>
      <PageHeader
        eyebrow="Revenue & Margin"
        title="Performance"
        subtitle="Are we on pace — and is the revenue healthy?"
        action={<DemoBadge />}
      />

      <div className="space-y-5">
        {/* Pace summary */}
        <Card>
          <CardHeader
            title="Monthly Pace"
            subtitle={`Day ${revenue.daysElapsed} of ${revenue.daysInMonth}`}
            action={
              <span className={cn("text-[13px] font-semibold", revenue.pacePct >= 0 ? "text-positive-strong" : "text-negative-strong")}>
                {percent(revenue.pacePct)} vs goal pace
              </span>
            }
          />
          <div className="grid grid-cols-2 divide-border md:grid-cols-3 lg:grid-cols-6 lg:divide-x">
            <Figure label="Revenue MTD" value={money(revenue.revenueMTD)} trend={revenue.momPct} trendLabel="MoM" />
            <Figure label="Monthly Goal" value={money(revenue.monthlyGoal)} />
            <Figure
              label="Projected"
              value={money(revenue.projectedMonthEnd)}
              sub={`${goalGap >= 0 ? "+" : ""}${moneyCompact(goalGap)} vs goal`}
              subTone={goalGap >= 0 ? "positive" : "negative"}
            />
            <Figure label="Required / Day" value={money(revenue.requiredDailyAverage)} sub="to hit goal" />
            <Figure label="Actual / Day" value={money(revenue.currentDailyAverage)} sub="month to date" />
            <Figure label="YoY" value={percent(revenue.yoyPct)} valueTone={revenue.yoyPct >= 0 ? "positive" : "negative"} />
          </div>
        </Card>

        {/* Revenue trend */}
        <Card>
          <CardHeader title="Revenue Trend" subtitle="Trailing 12 months + current projection" />
          <div className="p-5 pt-4">
            <LineChart points={revenueTrend} goal={targets.monthlyRevenueGoal} goalLabel={`Goal ${moneyCompact(targets.monthlyRevenueGoal)}`} tone="accent" />
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Gross Margin"
              subtitle={`${(revenue.grossMarginPct * 100).toFixed(1)}% MTD · ${(revenue.grossMarginPriorPct * 100).toFixed(1)}% prior month`}
            />
            <div className="p-5 pt-4">
              <LineChart
                points={marginTrend}
                goal={targets.grossMarginPct * 100}
                goalLabel={`Target ${(targets.grossMarginPct * 100).toFixed(0)}%`}
                tone="positive"
                valueFormat={(n) => `${n.toFixed(0)}%`}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="COGS Trend" subtitle="Cost of goods sold, monthly" />
            <div className="p-5 pt-4">
              <LineChart points={cogsTrend} tone="negative" />
            </div>
          </Card>
        </div>

        {/* Monthly comparison table */}
        <Card>
          <CardHeader title="Monthly Comparison" subtitle="Revenue, gross profit and margin by month" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
                  <th className="px-5 py-2.5">Month</th>
                  <th className="px-3 py-2.5 text-right">Revenue</th>
                  <th className="px-3 py-2.5 text-right">Gross Profit</th>
                  <th className="px-3 py-2.5 text-right">Margin</th>
                  <th className="px-5 py-2.5 text-right">MoM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monthlyHistory.map((m, i) => {
                  const prev = monthlyHistory[i - 1];
                  const mom = prev ? ((m.revenue - prev.revenue) / prev.revenue) * 100 : 0;
                  const margin = (m.grossProfit / m.revenue) * 100;
                  return (
                    <tr key={m.month} className="hover:bg-surface-2/40">
                      <td className="px-5 py-2.5 font-medium text-ink">{ml(m.month)} {m.month.slice(0, 4)}</td>
                      <td className="px-3 py-2.5 text-right tabular text-ink">{money(m.revenue)}</td>
                      <td className="px-3 py-2.5 text-right tabular text-ink-muted">{money(m.grossProfit)}</td>
                      <td className="px-3 py-2.5 text-right tabular text-ink-muted">{margin.toFixed(1)}%</td>
                      <td className="px-5 py-2.5 text-right">
                        {i > 0 ? <Trend value={mom} className="justify-end" /> : <span className="text-ink-subtle">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <p className="text-2xs text-ink-subtle">
          * Current month is a projection from month-to-date pace. In production, live QuickBooks data
          drives every figure; demo fixtures are isolated and clearly marked.
        </p>
      </div>
    </>
  );
}

function Figure({
  label,
  value,
  sub,
  subTone,
  valueTone,
  trend,
  trendLabel,
}: {
  label: string;
  value: string;
  sub?: string;
  subTone?: "positive" | "negative";
  valueTone?: "positive" | "negative";
  trend?: number;
  trendLabel?: string;
}) {
  return (
    <div className="px-5 py-4">
      <div className="text-2xs font-medium uppercase tracking-wide text-ink-subtle">{label}</div>
      <div className={cn("mt-1 text-lg font-semibold tabular", valueTone === "positive" ? "text-positive-strong" : valueTone === "negative" ? "text-negative-strong" : "text-ink")}>
        {value}
      </div>
      {trend !== undefined && <Trend value={trend} suffix={trendLabel} className="mt-0.5" />}
      {sub && (
        <div className={cn("mt-0.5 text-2xs", subTone === "positive" ? "text-positive-strong" : subTone === "negative" ? "text-negative-strong" : "text-ink-subtle")}>
          {sub}
        </div>
      )}
    </div>
  );
}
