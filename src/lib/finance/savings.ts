import type {
  Confidence,
  ExpenseRow,
  SavingsOpportunity,
  Vendor,
  VendorMetric,
} from "@/lib/types";
import { round2 } from "@/lib/format";

/**
 * "Find Me Savings" (§16).
 *
 * Ranks potential monthly savings from expense and vendor patterns toward a
 * user target. Every opportunity is framed as a *potential* opportunity with a
 * confidence level — legitimate expenses are never auto-classified as waste.
 */
export function findSavings(
  target: number,
  expenses: ExpenseRow[],
  vendors: Vendor[],
  vendorMetrics: Map<string, VendorMetric>
): {
  target: number;
  opportunities: SavingsOpportunity[];
  monthlyTotal: number;
  byConfidence: Record<Confidence, number>;
} {
  const ops: SavingsOpportunity[] = [];

  const marketing = expenses.find((e) => e.id === "e-marketing");
  if (marketing && marketing.variancePct > 15) {
    ops.push({
      id: "s-marketing",
      area: "Marketing",
      title: "Trim underperforming ad spend to trend",
      monthly: round2(Math.min(marketing.varianceAbs, marketing.current * 0.4)),
      confidence: "high",
      rationale: `Marketing is ${marketing.variancePct.toFixed(0)}% above its 3-month average while revenue grew ${marketing.revenueGrowthPct.toFixed(1)}%. Returning to trend recovers spend without cutting proven channels.`,
    });
  }

  const software = expenses.find((e) => e.id === "e-software");
  if (software && software.variancePct > 10) {
    ops.push({
      id: "s-software",
      area: "Software & Subscriptions",
      title: "Audit subscription creep",
      monthly: round2(software.varianceAbs + software.threeMonthAvg * 0.15),
      confidence: "medium",
      rationale: `Subscriptions rose ${software.variancePct.toFixed(0)}% vs trend. Consolidating overlapping tools and cancelling unused seats typically recovers 15–25%.`,
    });
  }

  const prof = expenses.find((e) => e.id === "e-prof");
  if (prof && prof.variancePct > 25) {
    ops.push({
      id: "s-prof",
      area: "Professional Services",
      title: "Review professional services engagement",
      monthly: round2(prof.varianceAbs * 0.6),
      confidence: "review",
      rationale: `Professional services jumped ${prof.variancePct.toFixed(0)}% this month. Confirm the work is one-time before assuming a recurring cut.`,
    });
  }

  // Overtime / payroll
  const payroll = expenses.find((e) => e.id === "e-payroll");
  if (payroll && payroll.variancePct > 3) {
    ops.push({
      id: "s-overtime",
      area: "Overtime",
      title: "Tighten weekend and overtime coverage",
      monthly: round2(payroll.varianceAbs * 0.45),
      confidence: "medium",
      rationale: `Payroll is ${payroll.variancePct.toFixed(1)}% above trend. Right-sizing overtime to demand recovers a portion without affecting core staffing.`,
    });
  }

  // Vendor price drift — strategic vendors with rising trailing spend
  const topVendor = vendors
    .map((v) => ({ v, m: vendorMetrics.get(v.id) }))
    .filter((x) => x.m && x.v.classification !== "disputed")
    .sort((a, b) => (b.m!.trailingSpend ?? 0) - (a.m!.trailingSpend ?? 0))[0];
  if (topVendor?.m) {
    ops.push({
      id: "s-vendor",
      area: "Recurring Vendors",
      title: `Renegotiate terms with ${topVendor.v.name}`,
      monthly: round2(topVendor.m.trailingSpend / 3 * 0.03),
      confidence: "review",
      rationale: `${topVendor.v.name} is ${topVendor.m.pctOfPurchases.toFixed(0)}% of purchases. A 3% volume discount at this spend is a realistic ask given the relationship.`,
    });
  }

  const ranked = ops.sort((a, b) => b.monthly - a.monthly);
  const monthlyTotal = round2(ranked.reduce((s, o) => s + o.monthly, 0));
  const byConfidence: Record<Confidence, number> = {
    high: round2(ranked.filter((o) => o.confidence === "high").reduce((s, o) => s + o.monthly, 0)),
    medium: round2(ranked.filter((o) => o.confidence === "medium").reduce((s, o) => s + o.monthly, 0)),
    review: round2(ranked.filter((o) => o.confidence === "review").reduce((s, o) => s + o.monthly, 0)),
  };

  return { target, opportunities: ranked, monthlyTotal, byConfidence };
}
