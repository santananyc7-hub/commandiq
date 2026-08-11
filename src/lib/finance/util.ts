/** Shared, dependency-free math for the CommandIQ financial engine. */

export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Percentage change from `prior` to `current`, in percent units. */
export function pctChange(current: number, prior: number): number {
  if (prior === 0) return current === 0 ? 0 : 100;
  return ((current - prior) / Math.abs(prior)) * 100;
}

/** Whole days between two ISO dates (b − a), UTC, positive if b is later. */
export function daysBetween(aIso: string, bIso: string): number {
  const a = Date.parse(aIso);
  const b = Date.parse(bIso);
  return Math.round((b - a) / 86_400_000);
}

/** Number of days in the calendar month of an ISO date (UTC). */
export function daysInMonth(iso: string): number {
  const d = new Date(iso);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}

/** 1-indexed day-of-month for an ISO date (UTC). */
export function dayOfMonth(iso: string): number {
  return new Date(iso).getUTCDate();
}

export function sum(ns: number[]): number {
  return ns.reduce((s, n) => s + n, 0);
}

export function mean(ns: number[]): number {
  return ns.length ? sum(ns) / ns.length : 0;
}

/**
 * Map a value to a 0–1 health score using a lower/upper band.
 * At or above `good` → 1; at or below `bad` → 0; linear in between.
 * Set `good` < `bad` to invert (lower is better).
 */
export function bandHealth(value: number, good: number, bad: number): number {
  if (good === bad) return value >= good ? 1 : 0;
  return clamp01((value - bad) / (good - bad));
}
