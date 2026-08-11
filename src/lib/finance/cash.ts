import type { CashPosition, Obligation } from "@/lib/types";
import { round2 } from "@/lib/format";
import { daysBetween } from "./util";

/**
 * Estimated available cash (§7).
 *
 *   Book Cash − Committed Next 30 Days − Recommended Reserve = Available
 *
 * Book cash is QuickBooks accounting cash, clearly labeled as such — not a live
 * bank feed. Committed obligations are the active obligations coming due inside
 * the horizon, expanded by recurrence.
 */
export function computeCash(params: {
  bookCash: number;
  obligations: Obligation[];
  recommendedReserve: number;
  referenceIso: string;
  horizonDays?: number;
  source?: string;
}): CashPosition {
  const {
    bookCash,
    obligations,
    recommendedReserve,
    referenceIso,
    horizonDays = 30,
    source = "QuickBooks Cash Balance",
  } = params;

  const committed30d = round2(
    committedWithin(obligations, referenceIso, horizonDays)
  );
  const estimatedAvailable = round2(
    bookCash - committed30d - recommendedReserve
  );

  return {
    bookCash: round2(bookCash),
    committed30d,
    recommendedReserve: round2(recommendedReserve),
    estimatedAvailable,
    source,
    asOf: referenceIso,
  };
}

/**
 * Total obligation cash due within `horizonDays` of the reference date,
 * expanding recurring obligations across the horizon.
 */
export function committedWithin(
  obligations: Obligation[],
  referenceIso: string,
  horizonDays: number
): number {
  let total = 0;
  for (const o of obligations) {
    if (!o.active) continue;
    for (const due of occurrences(o, referenceIso, horizonDays)) {
      if (due >= 0 && due <= horizonDays) total += o.amount;
    }
  }
  return total;
}

/** Cadence length in days (approximate, for horizon expansion). */
const CADENCE_DAYS: Record<Obligation["recurrence"], number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 91,
  annual: 365,
  one_time: Infinity,
};

/**
 * Day offsets (relative to reference) at which an obligation comes due within
 * the horizon. Starts at its next due date and steps by cadence.
 */
export function occurrences(
  o: Obligation,
  referenceIso: string,
  horizonDays: number
): number[] {
  const first = daysBetween(referenceIso, o.dueDate); // + = future
  const step = CADENCE_DAYS[o.recurrence];
  const endBound = o.endDate ? daysBetween(referenceIso, o.endDate) : Infinity;
  const out: number[] = [];
  if (!isFinite(step)) {
    if (first <= endBound) out.push(first);
    return out;
  }
  // Roll a past next-due forward to the first upcoming occurrence.
  let d = first;
  while (d < 0) d += step;
  for (; d <= horizonDays; d += step) {
    if (d > endBound) break;
    out.push(d);
  }
  return out;
}

/** Obligations sorted by their next due date (ascending). */
export function upcomingObligations(
  obligations: Obligation[],
  referenceIso: string
): { obligation: Obligation; dueInDays: number }[] {
  return obligations
    .filter((o) => o.active)
    .map((o) => {
      const first = daysBetween(referenceIso, o.dueDate);
      const step = CADENCE_DAYS[o.recurrence];
      let dueInDays = first;
      if (isFinite(step)) while (dueInDays < 0) dueInDays += step;
      return { obligation: o, dueInDays };
    })
    .sort((a, b) => a.dueInDays - b.dueInDays);
}
