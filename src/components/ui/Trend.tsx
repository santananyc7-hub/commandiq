import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/cn";
import { percent } from "@/lib/format";

/**
 * Directional trend pill. `goodDirection` lets a metric where "down is good"
 * (e.g. expenses) still render green when it falls.
 */
export function Trend({
  value,
  goodDirection = "up",
  suffix,
  className,
}: {
  value: number;
  goodDirection?: "up" | "down";
  suffix?: string;
  className?: string;
}) {
  const flat = Math.abs(value) < 0.05;
  const isGood = goodDirection === "up" ? value > 0 : value < 0;
  const tone = flat
    ? "text-ink-subtle"
    : isGood
      ? "text-positive-strong"
      : "text-negative-strong";
  const Icon = flat ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[13px] font-medium tabular",
        tone,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {percent(Math.abs(value))}
      {suffix && <span className="ml-0.5 text-ink-subtle font-normal">{suffix}</span>}
    </span>
  );
}
