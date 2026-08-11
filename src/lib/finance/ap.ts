import type {
  ApAging,
  Bill,
  RiskLevel,
  Vendor,
  VendorMetric,
} from "@/lib/types";
import { round2 } from "@/lib/format";
import { daysBetween, sum } from "./util";

/**
 * Accounts-payable aging (§9).
 *
 * A bill's age is measured from its due date to the reference date. Open
 * balance is bucketed into current / 1-30 / 31-60 / 61-90 / 90+.
 */
export function ageBills(bills: Bill[], referenceIso: string): ApAging {
  const buckets: ApAging = {
    current: 0,
    d1_30: 0,
    d31_60: 0,
    d61_90: 0,
    d90plus: 0,
    total: 0,
  };
  for (const b of bills) {
    if (b.balance <= 0) continue;
    const overdue = daysBetween(b.due, referenceIso); // + = past due
    if (overdue <= 0) buckets.current += b.balance;
    else if (overdue <= 30) buckets.d1_30 += b.balance;
    else if (overdue <= 60) buckets.d31_60 += b.balance;
    else if (overdue <= 90) buckets.d61_90 += b.balance;
    else buckets.d90plus += b.balance;
  }
  buckets.current = round2(buckets.current);
  buckets.d1_30 = round2(buckets.d1_30);
  buckets.d31_60 = round2(buckets.d31_60);
  buckets.d61_90 = round2(buckets.d61_90);
  buckets.d90plus = round2(buckets.d90plus);
  buckets.total = round2(
    buckets.current +
      buckets.d1_30 +
      buckets.d31_60 +
      buckets.d61_90 +
      buckets.d90plus
  );
  return buckets;
}

/** Portion of AP that is more than `days` past due. */
export function pastDue(aging: ApAging): number {
  return round2(aging.d1_30 + aging.d31_60 + aging.d61_90 + aging.d90plus);
}

export function over60(aging: ApAging): number {
  return round2(aging.d61_90 + aging.d90plus);
}

/**
 * Per-vendor rollups: outstanding balance, oldest invoice, days outstanding,
 * share of total purchases, and a derived risk level.
 */
export function vendorMetrics(
  vendors: Vendor[],
  bills: Bill[],
  referenceIso: string
): VendorMetric[] {
  const totalTrailing = sum(vendors.map((v) => v.trailingSpend)) || 1;

  return vendors.map((v) => {
    const vb = bills.filter((b) => b.vendorId === v.id && b.balance > 0);
    const outstanding = round2(sum(vb.map((b) => b.balance)));
    const aging = ageBills(vb, referenceIso);

    let oldestInvoice: string | null = null;
    for (const b of vb) {
      if (!oldestInvoice || b.issued < oldestInvoice) oldestInvoice = b.issued;
    }
    const daysOutstanding = oldestInvoice
      ? Math.max(0, daysBetween(oldestInvoice, referenceIso))
      : 0;

    const pctOfPurchases = round2((v.trailingSpend / totalTrailing) * 100);
    const risk = vendorRisk({
      aging,
      daysOutstanding,
      classification: v.classification,
      pctOfPurchases,
    });

    return {
      vendorId: v.id,
      outstanding,
      oldestInvoice,
      daysOutstanding,
      trailingSpend: v.trailingSpend,
      pctOfPurchases,
      risk,
      aging,
    };
  });
}

/** Risk blends aging severity, concentration and classification. */
export function vendorRisk(params: {
  aging: ApAging;
  daysOutstanding: number;
  classification: Vendor["classification"];
  pctOfPurchases: number;
}): RiskLevel {
  const { aging, daysOutstanding, classification, pctOfPurchases } = params;
  let score = 0;
  if (over60(aging) > 0) score += 2;
  else if (pastDue(aging) > 0) score += 1;
  if (daysOutstanding > 75) score += 2;
  else if (daysOutstanding > 45) score += 1;
  if (pctOfPurchases > 20) score += 2;
  else if (pctOfPurchases > 12) score += 1;
  if (classification === "disputed") score += 2;
  if (classification === "strategic" || classification === "critical") score += 1;

  if (score >= 5) return "high";
  if (score >= 3) return "medium";
  return "low";
}

/** Aggregate aging across every open bill. */
export function totalAging(bills: Bill[], referenceIso: string): ApAging {
  return ageBills(
    bills.filter((b) => b.balance > 0),
    referenceIso
  );
}
