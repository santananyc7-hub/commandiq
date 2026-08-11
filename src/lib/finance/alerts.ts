import type {
  Alert,
  ApAging,
  CashPosition,
  ExpenseRow,
  RevenuePerformance,
  Targets,
  Vendor,
  VendorMetric,
} from "@/lib/types";
import { SEVERITY_ORDER } from "@/lib/types";
import { money, percent } from "@/lib/format";
import { over60, pastDue } from "./ap";

/**
 * Daily Attention Feed (§6).
 *
 * Deterministically derives prioritized, financially material issues from the
 * computed metric set. Each alert carries severity, impact, reason and a
 * suggested next action — never a raw ledger dump.
 */
export interface AlertContext {
  revenue: RevenuePerformance;
  aging: ApAging;
  vendors: Vendor[];
  vendorMetrics: VendorMetric[];
  expenses: ExpenseRow[];
  cash: CashPosition;
  payrollShare: number;
  targets: Targets;
}

export function generateAlerts(ctx: AlertContext): Alert[] {
  const out: Alert[] = [];
  const {
    revenue,
    aging,
    vendorMetrics,
    vendors,
    expenses,
    cash,
    payrollShare,
    targets,
  } = ctx;

  // Gross margin compression
  const marginDeltaPts = (revenue.grossMarginPct - revenue.grossMarginPriorPct) * 100;
  if (marginDeltaPts <= -1) {
    const monthlyImpact = Math.abs(marginDeltaPts / 100) * revenue.projectedMonthEnd;
    out.push({
      id: "al-margin",
      title: `Gross margin declined ${Math.abs(marginDeltaPts).toFixed(1)} points`,
      detail: `Margin is ${(revenue.grossMarginPct * 100).toFixed(1)}% MTD vs ${(revenue.grossMarginPriorPct * 100).toFixed(1)}% last month.`,
      reason: "Rising product cost or discount mix is compressing gross profit.",
      severity: marginDeltaPts <= -2.5 ? "high" : "watch",
      impact: monthlyImpact,
      impactCadence: "month",
      suggestedAction: "Review supplier pricing and discounting on top-selling SKUs.",
      module: "Performance",
      href: "/performance",
      status: "open",
    });
  }

  // Payroll above target
  const payrollDeltaPts = (payrollShare - targets.payrollPct) * 100;
  if (payrollDeltaPts >= 1) {
    const weeklyImpact = (payrollDeltaPts / 100) * (revenue.projectedMonthEnd / 4.33);
    out.push({
      id: "al-payroll",
      title: `Payroll at ${(payrollShare * 100).toFixed(1)}% of revenue`,
      detail: `Target is ${(targets.payrollPct * 100).toFixed(0)}%. Running ${payrollDeltaPts.toFixed(1)} points hot.`,
      reason: "Overtime and weekend coverage are outpacing sales.",
      severity: payrollDeltaPts >= 3 ? "high" : "watch",
      impact: weeklyImpact,
      impactCadence: "week",
      suggestedAction: "Review overtime and weekend scheduling across both stores.",
      owner: "Marcus Lee",
      module: "Expenses",
      href: "/expenses",
      status: "open",
    });
  }

  // Vendor concentration
  const sortedByOut = [...vendorMetrics].sort((a, b) => b.outstanding - a.outstanding);
  const totalOut = sortedByOut.reduce((s, m) => s + m.outstanding, 0);
  const top3 = sortedByOut.slice(0, 3);
  const top3Out = top3.reduce((s, m) => s + m.outstanding, 0);
  const top3Share = totalOut > 0 ? top3Out / totalOut : 0;
  if (top3Share >= 0.4) {
    out.push({
      id: "al-concentration",
      title: `Three vendors hold ${(top3Share * 100).toFixed(0)}% of outstanding AP`,
      detail: `${money(top3Out)} of ${money(totalOut)} is concentrated in your top three suppliers.`,
      reason: "Supplier concentration increases negotiating and continuity risk.",
      severity: top3Share >= 0.55 ? "high" : "watch",
      impact: top3Out,
      impactCadence: "one_time",
      suggestedAction: "Diversify sourcing on core inventory and formalize terms.",
      module: "Vendors",
      href: "/vendors",
      status: "open",
    });
  }

  // Expense acceleration (from expense watch flags)
  for (const e of expenses) {
    if (e.status === "critical" || (e.flag && e.status !== "ok")) {
      out.push({
        id: `al-exp-${e.id}`,
        title: e.flag ?? `${e.name} spending is elevated`,
        detail: `${e.name}: ${money(e.current)} this month vs ${money(e.threeMonthAvg)} 3-month average (${percent(e.variancePct)}).`,
        reason: "Category is growing materially faster than revenue.",
        severity: e.status === "critical" ? "high" : "watch",
        impact: Math.max(0, e.varianceAbs),
        impactCadence: "month",
        suggestedAction: `Audit ${e.name.toLowerCase()} line items and pause the weakest spend.`,
        module: "Expenses",
        href: "/expenses",
        status: "open",
      });
    }
  }

  // AP over 60 days
  const over60Total = over60(aging);
  if (over60Total > 5_000) {
    out.push({
      id: "al-ap60",
      title: `${money(over60Total)} of AP is more than 60 days overdue`,
      detail: `${money(aging.d90plus)} of that is past 90 days.`,
      reason: "Aged payables risk supply interruption and late fees.",
      severity: aging.d90plus > 10_000 ? "high" : "watch",
      impact: over60Total,
      impactCadence: "one_time",
      suggestedAction: "Prioritize aged balances in the next vendor payment run.",
      module: "Vendors",
      href: "/vendors",
      status: "open",
    });
  }

  // Revenue pace
  if (revenue.pacePct <= -3) {
    const gap = (Math.abs(revenue.pacePct) / 100) * revenue.monthlyGoal;
    out.push({
      id: "al-pace",
      title: `Revenue pace is ${Math.abs(revenue.pacePct).toFixed(1)}% below goal`,
      detail: `MTD ${money(revenue.revenueMTD)} vs ${money((revenue.monthlyGoal / revenue.daysInMonth) * revenue.daysElapsed)} goal pace.`,
      reason: "Daily average is trailing the run-rate needed to hit the monthly goal.",
      severity: revenue.pacePct <= -8 ? "high" : "watch",
      impact: gap,
      impactCadence: "month",
      suggestedAction: "Add a mid-week promotion or extend peak-hour staffing.",
      module: "Performance",
      href: "/performance",
      status: "open",
    });
  }

  // Available cash below reserve
  if (cash.estimatedAvailable < 0) {
    out.push({
      id: "al-cash",
      title: "Estimated available cash is below the reserve target",
      detail: `${money(cash.estimatedAvailable)} available after committed obligations and reserve.`,
      reason: "Near-term obligations exceed comfortable liquidity.",
      severity: "critical",
      impact: Math.abs(cash.estimatedAvailable),
      impactCadence: "one_time",
      suggestedAction: "Stagger non-essential vendor payments and defer flexible obligations.",
      module: "Cash",
      href: "/cash",
      status: "open",
    });
  }

  // A positive signal to balance the feed
  if (revenue.pacePct > -3 && revenue.momPct > 3) {
    out.push({
      id: "al-positive",
      title: `Revenue is up ${percent(revenue.momPct)} vs last month`,
      detail: `On pace for ${money(revenue.projectedMonthEnd)} — ${revenue.projectedMonthEnd >= revenue.monthlyGoal ? "ahead of" : "near"} the ${money(revenue.monthlyGoal)} goal.`,
      reason: "Sustained pace supports the monthly target.",
      severity: "positive",
      impact: revenue.projectedMonthEnd - revenue.monthlyGoal,
      impactCadence: "month",
      suggestedAction: "Hold current staffing and marketing; protect gross margin.",
      module: "Performance",
      href: "/performance",
      status: "open",
    });
  }

  return out.sort((a, b) => {
    const s = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (s !== 0) return s;
    return b.impact - a.impact;
  });
}
