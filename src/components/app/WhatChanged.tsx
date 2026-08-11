"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ChangeItem } from "@/lib/types";
import { CHANGE_PERIODS, type ChangePeriod } from "@/lib/finance/changes";
import { cn } from "@/lib/cn";

/** "What changed?" module (§13). Period selector over precomputed change sets. */
export function WhatChanged({
  data,
}: {
  data: Record<ChangePeriod, { headline: string; items: ChangeItem[] }>;
}) {
  const [period, setPeriod] = useState<ChangePeriod>("7d");
  const current = useMemo(() => data[period], [data, period]);

  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-border px-5 py-3">
        {CHANGE_PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[13px] font-medium transition-colors",
              period === p.key
                ? "bg-surface-2 text-ink"
                : "text-ink-subtle hover:text-ink-muted"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="px-5 py-4">
        <p className="mb-3 text-sm font-medium text-ink">{current.headline}</p>
        <ol className="space-y-2.5">
          {current.items.map((item, i) => {
            const Icon =
              item.direction === "positive"
                ? ArrowUpRight
                : item.direction === "negative"
                  ? ArrowDownRight
                  : Minus;
            const tone =
              item.direction === "positive"
                ? "text-positive-strong bg-positive-soft"
                : item.direction === "negative"
                  ? "text-negative-strong bg-negative-soft"
                  : "text-ink-subtle bg-surface-2";
            return (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 text-2xs font-semibold tabular text-ink-subtle">{i + 1}</span>
                <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md", tone)}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 text-[13px] text-ink-muted">
                  <span className="font-medium text-ink">{item.label}.</span> {item.detail}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
