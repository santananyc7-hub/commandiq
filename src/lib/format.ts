/** Formatting helpers for financial, human-readable output. */

export function money(value: number, opts?: { cents?: boolean; sign?: boolean }): string {
  const sign = opts?.sign && value > 0 ? "+" : "";
  return (
    sign +
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: opts?.cents ? 2 : 0,
      maximumFractionDigits: opts?.cents ? 2 : 0,
    }).format(value)
  );
}

/** Compact money for tight spaces, e.g. "$8.7K". */
export function moneyCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  })
    .format(value)
    .replace(/([km])$/i, (m) => m.toUpperCase());
}

/** Signed percentage, e.g. "+8.2%". Input is already in percent units. */
export function percent(value: number, digits = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

/** Unsigned percentage from a 0–1 ratio, e.g. 0.124 → "12.4%". */
export function ratioPct(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function number(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Deterministic date formatting (avoids locale/timezone drift in SSR). */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function monthDay(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function monthName(iso: string): string {
  return MONTHS_LONG[new Date(iso).getUTCMonth()];
}

/** "3 days ago" style relative time against a fixed reference date. */
export function relativeFrom(iso: string, referenceIso: string): string {
  const then = new Date(iso).getTime();
  const now = new Date(referenceIso).getTime();
  const mins = Math.round((now - then) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

/** "in 4 days" / "3 days overdue" against a fixed reference date. */
export function dueFrom(iso: string, referenceIso: string): string {
  const then = new Date(iso).getTime();
  const now = new Date(referenceIso).getTime();
  const days = Math.round((then - now) / 86_400_000);
  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  if (days > 1) return `in ${days} days`;
  if (days === -1) return "1 day overdue";
  return `${Math.abs(days)} days overdue`;
}

/** Round to cents to keep computed impacts clean. */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Round to whole dollars. */
export function round0(n: number): number {
  return Math.round(n);
}
