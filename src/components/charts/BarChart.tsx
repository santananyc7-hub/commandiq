import { moneyCompact } from "@/lib/format";

export interface BarDatum {
  label: string;
  value: number;
  tone?: "accent" | "positive" | "negative" | "watch" | "muted";
}

const TONE_VAR: Record<NonNullable<BarDatum["tone"]>, string> = {
  accent: "--accent-500",
  positive: "--positive",
  negative: "--negative",
  watch: "--watch",
  muted: "--ink-subtle",
};

/** Horizontal bar list — for expense variance / concentration (§23). */
export function BarChart({
  data,
  valueFormat = (n) => moneyCompact(n),
}: {
  data: BarDatum[];
  valueFormat?: (n: number) => string;
}) {
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  return (
    <div className="space-y-3">
      {data.map((d) => {
        const pct = (Math.abs(d.value) / max) * 100;
        const varName = TONE_VAR[d.tone ?? "accent"];
        return (
          <div key={d.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-[13px] text-ink-muted">{d.label}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: `rgb(var(${varName}))` }}
                />
              </div>
            </div>
            <span className="w-20 text-right text-[13px] font-semibold tabular text-ink">
              {valueFormat(d.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
