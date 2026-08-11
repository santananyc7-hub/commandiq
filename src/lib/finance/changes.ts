import type { ChangeItem, ExpenseRow, RevenuePerformance } from "@/lib/types";
import { money, percent } from "@/lib/format";
import { over60 } from "./ap";
import type { ApAging } from "@/lib/types";

export type ChangePeriod = "yesterday" | "7d" | "30d" | "mtd";

export const CHANGE_PERIODS: { key: ChangePeriod; label: string }[] = [
  { key: "yesterday", label: "Since yesterday" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "mtd", label: "Month-to-date" },
];

/**
 * "What changed?" (§13).
 *
 * Summarizes financially material changes, ranked by impact — not every ledger
 * movement. The demo derives period-scaled deltas from the same metric set the
 * rest of the app uses, so the narrative always agrees with the numbers.
 */
export function whatChanged(
  period: ChangePeriod,
  ctx: {
    revenue: RevenuePerformance;
    expenses: ExpenseRow[];
    aging: ApAging;
    payrollShare: number;
  }
): { headline: string; items: ChangeItem[] } {
  const { revenue, expenses, aging, payrollShare } = ctx;
  // Period scale relative to a 30-day window.
  const scale =
    period === "yesterday" ? 1 / 30 : period === "7d" ? 7 / 30 : period === "mtd" ? revenue.daysElapsed / 30 : 1;

  const marketing = expenses.find((e) => e.id === "e-marketing");
  const items: ChangeItem[] = [];

  // Revenue
  const revChange = revenue.momPct * scale * (period === "yesterday" ? 30 : 1);
  const revDisplay = period === "30d" || period === "mtd" ? revenue.momPct : revenue.momPct * (period === "7d" ? 0.9 : 1);
  items.push({
    label: "Revenue",
    detail: `Revenue ${revDisplay >= 0 ? "increased" : "decreased"} ${percent(Math.abs(revDisplay))} — MTD ${money(revenue.revenueMTD)}.`,
    direction: revDisplay >= 0 ? "positive" : "negative",
    magnitude: Math.abs(revChange) * 3 + 40,
  });

  // Gross margin
  const marginPts = (revenue.grossMarginPct - revenue.grossMarginPriorPct) * 100;
  items.push({
    label: "Gross margin",
    detail: `Gross margin ${marginPts >= 0 ? "improved" : "declined"} ${Math.abs(marginPts).toFixed(1)} points to ${(revenue.grossMarginPct * 100).toFixed(1)}%.`,
    direction: marginPts >= 0 ? "positive" : "negative",
    magnitude: Math.abs(marginPts) * 12 + 20,
  });

  // AP over 60
  const over60Total = over60(aging);
  items.push({
    label: "AP aging",
    detail: `${money(over60Total)} of AP now sits past 60 days.`,
    direction: over60Total > 20_000 ? "negative" : "positive",
    magnitude: over60Total / 1000 + 10,
  });

  // Marketing spend
  if (marketing) {
    items.push({
      label: "Marketing spend",
      detail: `Marketing ${marketing.variancePct >= 0 ? "increased" : "decreased"} ${money(Math.abs(marketing.varianceAbs))} vs trend (${percent(marketing.variancePct)}).`,
      direction: marketing.variancePct > 8 ? "negative" : "neutral",
      magnitude: Math.abs(marketing.variancePct) + 15,
    });
  }

  // Payroll
  items.push({
    label: "Payroll",
    detail: `Payroll ${payrollShare > 0.13 ? "remains elevated" : "held stable"} at ${(payrollShare * 100).toFixed(1)}% of revenue.`,
    direction: payrollShare > 0.13 ? "negative" : "neutral",
    magnitude: Math.abs(payrollShare - 0.12) * 300 + 8,
  });

  const ranked = items.sort((a, b) => b.magnitude - a.magnitude).slice(0, 5);
  const label = CHANGE_PERIODS.find((p) => p.key === period)?.label.toLowerCase() ?? "this period";
  return {
    headline: `Your business changed in ${ranked.length} meaningful ways ${label}.`,
    items: ranked,
  };
}
