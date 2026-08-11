import { cn } from "@/lib/cn";
import {
  SEVERITY_META,
  VENDOR_CLASS_LABELS,
  type RiskLevel,
  type Severity,
  type VendorClass,
} from "@/lib/types";

/** Colored severity chip driven by design tokens. */
export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  const token = SEVERITY_META[severity].token;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider",
        className
      )}
      style={{
        color: `rgb(var(--${token}))`,
        backgroundColor: `rgb(var(--${token}) / 0.14)`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: `rgb(var(--${token}))` }}
      />
      {SEVERITY_META[severity].label}
    </span>
  );
}

const RISK_TOKEN: Record<RiskLevel, string> = {
  high: "critical",
  medium: "high",
  low: "info",
};

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const token = RISK_TOKEN[risk];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider"
      style={{
        color: `rgb(var(--${token}))`,
        backgroundColor: `rgb(var(--${token}) / 0.14)`,
      }}
    >
      {risk}
    </span>
  );
}

const CLASS_STYLES: Record<VendorClass, string> = {
  strategic: "bg-accent-50 text-accent-700 border-accent-200/60",
  critical: "bg-accent-50 text-accent-700 border-accent-200/60",
  standard: "bg-surface-2 text-ink-muted border-border",
  low: "bg-surface-2 text-ink-subtle border-border",
  disputed: "bg-critical/12 text-critical border-critical/25",
  cod: "bg-watch/14 text-watch border-watch/25",
  payment_plan: "bg-surface-2 text-ink-muted border-border",
};

export function VendorClassBadge({
  classification,
  className,
}: {
  classification: VendorClass;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-2xs font-medium",
        CLASS_STYLES[classification],
        className
      )}
    >
      {VENDOR_CLASS_LABELS[classification]}
    </span>
  );
}

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "positive" | "negative" | "accent";
  className?: string;
}) {
  const tones = {
    neutral: "bg-surface-2 text-ink-muted border-border",
    positive: "bg-positive-soft text-positive-strong border-positive/25",
    negative: "bg-negative-soft text-negative-strong border-negative/25",
    accent: "bg-accent-50 text-accent-700 border-accent-200/60",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-2xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
