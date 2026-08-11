import {
  arPastDue,
  arTotal,
  bills,
  bookCash,
  cashSource,
  currentMonthDaily,
  currentUser,
  defaultTargets,
  expenseCategories,
  lastCompleteMonthRevenue,
  monthlyHistory,
  obligations,
  organization,
  payrollMonthly,
  priorGrossMarginPct,
  priorMonthSamePeriod,
  priorYearFullMonth,
  quickBooksDemo,
  REFERENCE_DATE,
  seededActions,
  team,
  vendors,
} from "@/lib/demo/data";
import type {
  Alert,
  ApAging,
  CashPosition,
  CommandScore,
  ExpenseRow,
  PaymentPlan,
  RevenuePerformance,
  Targets,
  Vendor,
  VendorMetric,
} from "@/lib/types";
import { round2 } from "@/lib/format";
import { computeRevenue } from "@/lib/finance/revenue";
import { totalAging, vendorMetrics, pastDue, over60 } from "@/lib/finance/ap";
import { analyzeExpenses } from "@/lib/finance/expenses";
import { computeCash, committedWithin } from "@/lib/finance/cash";
import { computeScore, DEFAULT_SCORE_WEIGHTS, type ScoreInputs } from "@/lib/finance/score";
import { generateAlerts } from "@/lib/finance/alerts";
import { buildPaymentPlan, DEFAULT_PLANNER_WEIGHTS, type PlannerWeights } from "@/lib/finance/planner";
import { pctChange } from "@/lib/finance/util";

export interface KpiMetric {
  key: string;
  label: string;
  value: number;
  format: "money" | "moneyCompact" | "percent" | "ratio";
  comparison?: string;
  trendPct?: number;
  status: "positive" | "negative" | "neutral";
  href?: string;
}

export interface FinancialState {
  referenceDate: string;
  targets: Targets;
  revenue: RevenuePerformance;
  aging: ApAging;
  vendorMetricList: VendorMetric[];
  vendorMetricMap: Map<string, VendorMetric>;
  expenses: ExpenseRow[];
  cash: CashPosition;
  score: CommandScore;
  alerts: Alert[];
  kpis: KpiMetric[];
  payrollShare: number;
  revenueGrowthPct: number;
  apPastDue: number;
  apOver60: number;
  apPastDueShare: number;
  vendorConcentration: { top3Share: number; top3: { name: string; outstanding: number }[] };
  cashCoverageMonths: number;
}

/**
 * The single source of computed truth for CommandIQ (demo mode).
 *
 * Everything the UI renders flows from these deterministic derivations of the
 * seeded ledger — there are no hand-set dashboard numbers.
 */
export function getFinancialState(targets: Targets = defaultTargets): FinancialState {
  const revenue = computeRevenue({
    referenceIso: REFERENCE_DATE,
    monthlyGoal: targets.monthlyRevenueGoal,
    currentMonth: currentMonthDaily,
    priorMonthSamePeriod,
    priorYearFullMonth,
    priorGrossMarginPct,
  });

  const aging = totalAging(bills, REFERENCE_DATE);
  const vmList = vendorMetrics(vendors, bills, REFERENCE_DATE);
  const vmMap = new Map(vmList.map((m) => [m.vendorId, m]));

  const revenueGrowthPct = round2(
    pctChange(revenue.projectedMonthEnd, lastCompleteMonthRevenue)
  );
  const expenses = analyzeExpenses(
    expenseCategories,
    revenueGrowthPct,
    targets.expenseVariancePct
  );

  const committed30d = committedWithin(obligations, REFERENCE_DATE, 30);
  const cash = computeCash({
    bookCash,
    obligations,
    recommendedReserve: targets.cashReserve,
    referenceIso: REFERENCE_DATE,
    source: cashSource,
  });

  const payrollShare = round2(payrollMonthly / revenue.projectedMonthEnd);
  const apPastDueTotal = pastDue(aging);
  const apOver60 = over60(aging);
  const apPastDueShare = aging.total > 0 ? round2(apPastDueTotal / aging.total) : 0;
  const arPastDueShare = arTotal > 0 ? round2(arPastDue / arTotal) : 0;

  const cashCoverageMonths =
    committed30d > 0 ? round2(bookCash / committed30d) : 0;

  // Fastest-growing scaling expense excess vs. revenue growth.
  const expenseExcessPct = Math.max(
    0,
    ...expenses
      .filter((e) => expenseCategories.find((c) => c.id === e.id)?.scaleWithRevenue)
      .map((e) => e.variancePct - revenueGrowthPct)
  );

  const scoreInputs: ScoreInputs = {
    pacePct: revenue.pacePct,
    grossMarginPct: revenue.grossMarginPct,
    grossMarginTarget: targets.grossMarginPct,
    estimatedAvailable: cash.estimatedAvailable,
    reserveTarget: targets.cashReserve,
    apPastDueShare,
    arPastDueShare,
    expenseExcessPct,
    cashCoverageMonths,
    payrollShare,
    payrollTarget: targets.payrollPct,
  };
  const score = computeScore(scoreInputs, DEFAULT_SCORE_WEIGHTS);

  const alerts = generateAlerts({
    revenue,
    aging,
    vendors,
    vendorMetrics: vmList,
    expenses,
    cash,
    payrollShare,
    targets,
  });

  // Vendor concentration
  const byOut = [...vmList].sort((a, b) => b.outstanding - a.outstanding);
  const totalOut = byOut.reduce((s, m) => s + m.outstanding, 0) || 1;
  const top3 = byOut.slice(0, 3).map((m) => ({
    name: vendors.find((v) => v.id === m.vendorId)?.name ?? m.vendorId,
    outstanding: m.outstanding,
  }));
  const top3Share = round2(byOut.slice(0, 3).reduce((s, m) => s + m.outstanding, 0) / totalOut);

  const kpis: KpiMetric[] = [
    {
      key: "cash",
      label: "Current Cash",
      value: cash.bookCash,
      format: "money",
      comparison: cash.source,
      status: "neutral",
      href: "/cash",
    },
    {
      key: "available",
      label: "Estimated Available Cash",
      value: cash.estimatedAvailable,
      format: "money",
      comparison: "after obligations + reserve",
      status: cash.estimatedAvailable >= targets.cashReserve ? "positive" : cash.estimatedAvailable >= 0 ? "neutral" : "negative",
      href: "/cash",
    },
    {
      key: "revmtd",
      label: "Revenue MTD",
      value: revenue.revenueMTD,
      format: "money",
      comparison: `vs same period last month`,
      trendPct: revenue.momPct,
      status: revenue.momPct >= 0 ? "positive" : "negative",
      href: "/performance",
    },
    {
      key: "goal",
      label: "Monthly Revenue Goal",
      value: revenue.monthlyGoal,
      format: "money",
      comparison: `${money0(revenue.projectedMonthEnd)} projected`,
      status: revenue.projectedMonthEnd >= revenue.monthlyGoal ? "positive" : "neutral",
      href: "/performance",
    },
    {
      key: "pace",
      label: "Revenue Pace",
      value: revenue.pacePct,
      format: "percent",
      comparison: "vs goal pace to date",
      status: revenue.pacePct >= 0 ? "positive" : revenue.pacePct >= -5 ? "neutral" : "negative",
      href: "/performance",
    },
    {
      key: "margin",
      label: "Gross Margin",
      value: revenue.grossMarginPct * 100,
      format: "ratio",
      comparison: `${(revenue.grossMarginPriorPct * 100).toFixed(1)}% prior`,
      trendPct: round2((revenue.grossMarginPct - revenue.grossMarginPriorPct) * 100),
      status: revenue.grossMarginPct >= targets.grossMarginPct ? "positive" : "negative",
      href: "/performance",
    },
    {
      key: "ap",
      label: "Total AP",
      value: aging.total,
      format: "money",
      comparison: `${money0(apPastDueTotal)} past due`,
      status: "neutral",
      href: "/vendors",
    },
    {
      key: "ap60",
      label: "Past Due AP",
      value: apPastDueTotal,
      format: "money",
      comparison: `${money0(apOver60)} over 60 days`,
      status: apOver60 > 10_000 ? "negative" : "neutral",
      href: "/vendors",
    },
  ];

  return {
    referenceDate: REFERENCE_DATE,
    targets,
    revenue,
    aging,
    vendorMetricList: vmList,
    vendorMetricMap: vmMap,
    expenses,
    cash,
    score,
    alerts,
    kpis,
    payrollShare,
    revenueGrowthPct,
    apPastDue: apPastDueTotal,
    apOver60,
    apPastDueShare,
    vendorConcentration: { top3Share, top3 },
    cashCoverageMonths,
  };
}

function money0(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

// ── Convenience getters used across pages ─────────────────────────────────
export function getVendorsWithMetrics(targets?: Targets) {
  const state = getFinancialState(targets);
  return vendors
    .map((v) => ({ vendor: v, metric: state.vendorMetricMap.get(v.id)! }))
    .sort((a, b) => b.metric.outstanding - a.metric.outstanding);
}

export function getPaymentPlan(
  budget: number,
  weights: PlannerWeights = DEFAULT_PLANNER_WEIGHTS
): PaymentPlan {
  const state = getFinancialState();
  return buildPaymentPlan(budget, vendors, state.vendorMetricMap, weights);
}

export {
  organization,
  team,
  currentUser,
  obligations,
  seededActions,
  monthlyHistory,
  vendors,
  bills,
  quickBooksDemo,
  defaultTargets,
  arTotal,
  arPastDue,
  REFERENCE_DATE,
};

export type { Vendor, VendorMetric };
