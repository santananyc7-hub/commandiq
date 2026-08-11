import { Info } from "lucide-react";
import type { CashPosition } from "@/lib/types";
import { money } from "@/lib/format";
import { cn } from "@/lib/cn";

/** The available-cash waterfall (§7): book − committed − reserve = available. */
export function CashSummary({ cash }: { cash: CashPosition }) {
  const rows = [
    { label: "Book Cash", value: cash.bookCash, note: cash.source, op: "" },
    { label: "Committed Next 30 Days", value: -cash.committed30d, note: "active obligations", op: "−" },
    { label: "Recommended Reserve", value: -cash.recommendedReserve, note: "safety buffer", op: "−" },
  ];
  const negative = cash.estimatedAvailable < 0;

  return (
    <div>
      <div className="divide-y divide-border">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between px-5 py-3">
            <div>
              <div className="text-sm text-ink">{r.label}</div>
              <div className="text-2xs text-ink-subtle">{r.note}</div>
            </div>
            <div className="text-sm font-semibold tabular text-ink">
              {r.op && <span className="mr-1 text-ink-subtle">{r.op}</span>}
              {money(Math.abs(r.value))}
            </div>
          </div>
        ))}
      </div>
      <div
        className={cn(
          "flex items-center justify-between border-t-2 px-5 py-4",
          negative ? "border-negative/40 bg-negative-soft/40" : "border-accent-500/40 bg-accent-50/40"
        )}
      >
        <div>
          <div className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
            Estimated Available Cash
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-2xs text-ink-subtle">
            <Info className="h-3 w-3" />
            Accounting cash — not a live bank balance
          </div>
        </div>
        <div className={cn("text-2xl font-semibold tabular", negative ? "text-negative-strong" : "text-ink")}>
          {money(cash.estimatedAvailable)}
        </div>
      </div>
    </div>
  );
}
