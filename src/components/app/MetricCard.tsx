"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { KpiMetric } from "@/lib/store";
import { money, percent } from "@/lib/format";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Trend } from "@/components/ui/Trend";
import { Sparkline } from "@/components/charts/Sparkline";
import { cn } from "@/lib/cn";

function formatValue(m: KpiMetric): (n: number) => string {
  switch (m.format) {
    case "percent":
      return (n) => percent(n);
    case "ratio":
      return (n) => `${n.toFixed(1)}%`;
    case "moneyCompact":
    case "money":
    default:
      return (n) => money(Math.round(n));
  }
}

const STATUS_ACCENT: Record<KpiMetric["status"], string> = {
  positive: "before:bg-positive",
  negative: "before:bg-negative",
  neutral: "before:bg-border-strong",
};

/** Executive KPI card (§5). Value + comparison + trend + status accent. */
export function MetricCard({ metric, spark }: { metric: KpiMetric; spark?: number[] }) {
  const fmt = formatValue(metric);
  const goodDir = metric.key === "ap60" ? "down" : "up";

  const body = (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-card transition-colors",
        "before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:rounded-l-xl",
        STATUS_ACCENT[metric.status],
        metric.href && "hover:border-border-strong"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-medium text-ink-muted">{metric.label}</span>
        {metric.href && (
          <ArrowUpRight className="h-4 w-4 text-ink-subtle opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <AnimatedNumber
          value={metric.value}
          format={fmt}
          className="text-[26px] font-semibold leading-none tracking-tight tabular text-ink"
        />
        {spark && spark.length > 1 && (
          <Sparkline
            data={spark}
            tone={metric.status === "negative" ? "negative" : metric.status === "positive" ? "positive" : "muted"}
          />
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        {metric.trendPct !== undefined && (
          <Trend value={metric.trendPct} goodDirection={goodDir} suffix={metric.format === "ratio" ? "pts" : undefined} />
        )}
        {metric.comparison && (
          <span className="truncate text-2xs text-ink-subtle">{metric.comparison}</span>
        )}
      </div>
    </div>
  );

  return metric.href ? (
    <Link href={metric.href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}
