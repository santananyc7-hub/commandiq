import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ActionItem } from "@/lib/types";
import { money } from "@/lib/format";
import { ActionStatusBadge } from "@/components/app/ActionStatusBadge";

function impactLabel(a: ActionItem): string {
  const suffix = a.impactCadence === "week" ? "/wk" : a.impactCadence === "month" ? "/mo" : "";
  return `${money(a.impact)}${suffix}`;
}

export function RecentActions({ actions }: { actions: ActionItem[] }) {
  return (
    <div className="divide-y divide-border">
      {actions.map((a) => (
        <Link
          key={a.id}
          href="/actions"
          className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2/40"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-ink">{a.issue}</span>
            </div>
            <div className="mt-0.5 truncate text-2xs text-ink-subtle">
              {a.owner} · {impactLabel(a)}
            </div>
          </div>
          <ActionStatusBadge status={a.status} />
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-subtle" />
        </Link>
      ))}
    </div>
  );
}
