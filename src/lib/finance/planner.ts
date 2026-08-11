import type {
  PaymentAllocation,
  PaymentPlan,
  Vendor,
  VendorClass,
  VendorMetric,
} from "@/lib/types";
import { round2 } from "@/lib/format";
import { clamp01 } from "./util";

/**
 * Vendor payment planner (§10, docs/FINANCIAL_LOGIC.md).
 *
 * Given a pool of cash, recommend an explainable allocation across vendors.
 * Each vendor earns a 0–1 priority from configurable weighted signals; the
 * budget is then distributed greedily by priority, capped at each balance.
 * The recommendation is advisory — never presented as mandatory.
 */
export interface PlannerWeights {
  aging: number; // reward overdue balances
  criticality: number; // reward strategic/critical vendors
  cod: number; // COD vendors must be paid to keep supply
  concentration: number; // dependence on the vendor
  risk: number; // derived risk level
  manual: number; // manual priority classification
}

export const DEFAULT_PLANNER_WEIGHTS: PlannerWeights = {
  aging: 0.28,
  criticality: 0.2,
  cod: 0.18,
  concentration: 0.12,
  risk: 0.12,
  manual: 0.1,
};

const CLASS_WEIGHT: Record<VendorClass, number> = {
  strategic: 1,
  critical: 0.9,
  payment_plan: 0.7,
  cod: 0.65,
  standard: 0.45,
  low: 0.2,
  disputed: 0.05,
};

function agingSignal(m: VendorMetric): number {
  const a = m.aging;
  if (a.total <= 0) return 0;
  // Weight later buckets far more heavily.
  const weighted =
    a.d1_30 * 0.35 + a.d31_60 * 0.7 + a.d61_90 * 0.9 + a.d90plus * 1;
  return clamp01(weighted / a.total);
}

function riskSignal(m: VendorMetric): number {
  return m.risk === "high" ? 1 : m.risk === "medium" ? 0.55 : 0.2;
}

export function priorityFor(
  v: Vendor,
  m: VendorMetric,
  weights: PlannerWeights
): number {
  const signals = {
    aging: agingSignal(m),
    criticality: CLASS_WEIGHT[v.classification],
    cod: v.classification === "cod" ? 1 : 0,
    concentration: clamp01(m.pctOfPurchases / 25),
    risk: riskSignal(m),
    manual: CLASS_WEIGHT[v.classification],
  };
  const raw =
    signals.aging * weights.aging +
    signals.criticality * weights.criticality +
    signals.cod * weights.cod +
    signals.concentration * weights.concentration +
    signals.risk * weights.risk +
    signals.manual * weights.manual;
  const totalWeight =
    weights.aging +
    weights.criticality +
    weights.cod +
    weights.concentration +
    weights.risk +
    weights.manual;
  return totalWeight > 0 ? raw / totalWeight : 0;
}

function reasonFor(v: Vendor, m: VendorMetric): string {
  const parts: string[] = [];
  if (v.classification === "cod") parts.push("COD — pay to keep supply flowing");
  if (v.classification === "strategic") parts.push("strategic supplier");
  else if (v.classification === "critical") parts.push("critical to operations");
  if (m.aging.d90plus > 0) parts.push("balance 90+ days past due");
  else if (m.aging.d61_90 > 0) parts.push("balance 60+ days past due");
  else if (m.aging.d31_60 > 0) parts.push("balance 30+ days past due");
  if (m.pctOfPurchases > 15)
    parts.push(`${m.pctOfPurchases.toFixed(0)}% of purchases`);
  if (v.classification === "disputed") parts.push("disputed — hold pending review");
  if (v.classification === "low") parts.push("low priority — defer if needed");
  return parts.length ? parts.join(", ") : "standard terms, no aging pressure";
}

export function buildPaymentPlan(
  budget: number,
  vendors: Vendor[],
  metrics: Map<string, VendorMetric>,
  weights: PlannerWeights = DEFAULT_PLANNER_WEIGHTS
): PaymentPlan {
  const scored = vendors
    .map((v) => {
      const m = metrics.get(v.id);
      if (!m || m.outstanding <= 0) return null;
      // Disputed vendors are surfaced but never auto-allocated.
      const eligible = v.classification !== "disputed";
      return {
        v,
        m,
        priority: priorityFor(v, m, weights),
        eligible,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.priority - a.priority);

  let remaining = budget;
  const allocations: PaymentAllocation[] = scored.map((s) => {
    let recommended = 0;
    if (s.eligible && remaining > 0) {
      recommended = Math.min(s.m.outstanding, remaining);
      remaining = round2(remaining - recommended);
    }
    return {
      vendorId: s.v.id,
      vendorName: s.v.name,
      balance: s.m.outstanding,
      recommended: round2(recommended),
      classification: s.v.classification,
      reason: reasonFor(s.v, s.m),
      priority: round2(s.priority * 100),
    };
  });

  const allocated = round2(budget - remaining);
  return {
    budget: round2(budget),
    allocations,
    allocated,
    remaining: round2(remaining),
  };
}
