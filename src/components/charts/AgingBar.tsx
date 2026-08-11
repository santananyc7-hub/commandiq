import type { ApAging } from "@/lib/types";
import { money, moneyCompact } from "@/lib/format";

const BUCKETS: { key: keyof ApAging; label: string; token: string }[] = [
  { key: "current", label: "Current", token: "--positive" },
  { key: "d1_30", label: "1–30", token: "--accent-500" },
  { key: "d31_60", label: "31–60", token: "--watch" },
  { key: "d61_90", label: "61–90", token: "--high" },
  { key: "d90plus", label: "90+", token: "--critical" },
];

/** Horizontal stacked AP-aging bar with a bucket legend (§9, §23). */
export function AgingBar({ aging }: { aging: ApAging }) {
  const total = aging.total || 1;
  return (
    <div className="space-y-4">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-2">
        {BUCKETS.map((b) => {
          const v = aging[b.key];
          const pct = (v / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={b.key}
              style={{ width: `${pct}%`, backgroundColor: `rgb(var(${b.token}))` }}
              className="h-full first:rounded-l-full last:rounded-r-full"
              title={`${b.label}: ${money(v)}`}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-5">
        {BUCKETS.map((b) => (
          <div key={b.key} className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `rgb(var(${b.token}))` }} />
              <span className="text-2xs font-medium uppercase tracking-wide text-ink-subtle">{b.label}</span>
            </div>
            <div className="mt-0.5 text-sm font-semibold tabular text-ink">{moneyCompact(aging[b.key])}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
