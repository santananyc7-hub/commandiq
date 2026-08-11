import { ACTION_STATUS_LABELS, type ActionStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

const STYLES: Record<ActionStatus, string> = {
  open: "bg-surface-2 text-ink-muted border-border",
  in_progress: "bg-accent-50 text-accent-700 border-accent-200/60",
  waiting: "bg-watch/12 text-watch border-watch/25",
  resolved: "bg-positive-soft text-positive-strong border-positive/25",
};

export function ActionStatusBadge({
  status,
  className,
}: {
  status: ActionStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-2xs font-medium",
        STYLES[status],
        className
      )}
    >
      {ACTION_STATUS_LABELS[status]}
    </span>
  );
}
