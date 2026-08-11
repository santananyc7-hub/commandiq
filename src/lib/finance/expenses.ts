import type { ExpenseCategory, ExpenseRow, ExpenseStatus } from "@/lib/types";
import { round2 } from "@/lib/format";
import { pctChange } from "./util";

/**
 * Expense watch (§12).
 *
 * For each category we compute variance vs. the 3-month average and compare its
 * growth against revenue growth. Categories that scale with revenue (marketing,
 * COGS-like) are flagged when they grow materially faster than the top line.
 */
export function analyzeExpenses(
  categories: ExpenseCategory[],
  revenueGrowthPct: number,
  variancePctThreshold: number // e.g. 0.2 → 20%
): ExpenseRow[] {
  const threshold = variancePctThreshold * 100;

  return categories
    .map((c): ExpenseRow => {
      const varianceAbs = round2(c.current - c.threeMonthAvg);
      const variancePct = round2(pctChange(c.current, c.threeMonthAvg));

      const outpacesRevenue =
        c.scaleWithRevenue &&
        variancePct > 0 &&
        revenueGrowthPct >= 0 &&
        variancePct > revenueGrowthPct + threshold;

      let status: ExpenseStatus = "ok";
      if (variancePct >= threshold * 2) status = "critical";
      else if (variancePct >= threshold) status = "elevated";
      else if (variancePct >= threshold / 2) status = "watch";
      if (outpacesRevenue && status === "ok") status = "watch";

      let flag: string | undefined;
      if (outpacesRevenue && revenueGrowthPct > 0) {
        const ratio = variancePct / revenueGrowthPct;
        if (ratio >= 1.5) {
          flag = `${c.name} is growing ${ratio.toFixed(1)}× faster than revenue.`;
        }
      } else if (status === "critical") {
        flag = `${c.name} jumped ${variancePct.toFixed(1)}% over its 3-month average.`;
      } else if (status === "elevated") {
        flag = `${c.name} is running ${variancePct.toFixed(1)}% above trend.`;
      }

      return {
        id: c.id,
        name: c.name,
        current: round2(c.current),
        prior: round2(c.prior),
        threeMonthAvg: round2(c.threeMonthAvg),
        varianceAbs,
        variancePct,
        revenueGrowthPct: round2(revenueGrowthPct),
        status,
        flag,
      };
    })
    .sort((a, b) => b.variancePct - a.variancePct);
}
