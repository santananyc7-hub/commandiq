import type { DailyRevenue, RevenuePerformance } from "@/lib/types";
import { round2 } from "@/lib/format";
import { dayOfMonth, daysInMonth, pctChange, sum } from "./util";

/**
 * Revenue pace, projection and margin (§11, docs/FINANCIAL_LOGIC.md).
 *
 * All inputs are the raw daily revenue/COGS series for the current month plus
 * the same-period-prior and prior-year totals. Every figure is derived — there
 * are no stored aggregates — so the numbers are reproducible from the ledger.
 */
export function computeRevenue(params: {
  referenceIso: string;
  monthlyGoal: number;
  currentMonth: DailyRevenue[];
  /** Same day-count window one month prior, for MoM. */
  priorMonthSamePeriod: number;
  /** Same month one year prior (full month), for YoY. */
  priorYearFullMonth: number;
  /** Prior full-month gross margin ratio (0–1) for trend. */
  priorGrossMarginPct: number;
}): RevenuePerformance {
  const {
    referenceIso,
    monthlyGoal,
    currentMonth,
    priorMonthSamePeriod,
    priorYearFullMonth,
    priorGrossMarginPct,
  } = params;

  const daysElapsed = dayOfMonth(referenceIso);
  const totalDays = daysInMonth(referenceIso);

  const revenueMTD = round2(sum(currentMonth.map((d) => d.revenue)));
  const cogsMTD = round2(sum(currentMonth.map((d) => d.cogs)));
  const grossProfitMTD = round2(revenueMTD - cogsMTD);
  const grossMarginPct = revenueMTD > 0 ? grossProfitMTD / revenueMTD : 0;

  const currentDailyAverage = daysElapsed > 0 ? round2(revenueMTD / daysElapsed) : 0;
  const remainingDays = Math.max(0, totalDays - daysElapsed);

  // Projection: run-rate the current daily average across the whole month.
  const projectedMonthEnd = round2(currentDailyAverage * totalDays);

  // What we'd need per remaining day to still hit the monthly goal.
  const requiredDailyAverage =
    remainingDays > 0
      ? round2(Math.max(0, monthlyGoal - revenueMTD) / remainingDays)
      : 0;

  // Pace: actual MTD vs. the linear goal pace for the days elapsed.
  const goalPaceToDate = (monthlyGoal / totalDays) * daysElapsed;
  const pacePct = goalPaceToDate > 0 ? pctChange(revenueMTD, goalPaceToDate) : 0;

  return {
    monthlyGoal,
    revenueMTD,
    projectedMonthEnd,
    requiredDailyAverage,
    currentDailyAverage,
    pacePct: round2(pacePct),
    grossProfitMTD,
    grossMarginPct,
    grossMarginPriorPct: priorGrossMarginPct,
    momPct: round2(pctChange(revenueMTD, priorMonthSamePeriod)),
    yoyPct: round2(pctChange(projectedMonthEnd, priorYearFullMonth)),
    daysElapsed,
    daysInMonth: totalDays,
  };
}

/** Convenience: gross margin (0–1) for an arbitrary daily series. */
export function grossMargin(series: DailyRevenue[]): number {
  const rev = sum(series.map((d) => d.revenue));
  const cogs = sum(series.map((d) => d.cogs));
  return rev > 0 ? round2((rev - cogs) / rev) : 0;
}
