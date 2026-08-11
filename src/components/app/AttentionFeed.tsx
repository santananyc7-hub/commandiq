"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Check,
  Clock,
  X,
  ArrowUpRight,
  UserPlus,
  CircleCheck,
} from "lucide-react";
import type { Alert } from "@/lib/types";
import { money } from "@/lib/format";
import { SeverityBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type LocalStatus = "open" | "snoozed" | "dismissed" | "actioned";

function cadence(a: Alert): string {
  if (a.impactCadence === "week") return "/wk";
  if (a.impactCadence === "month") return "/mo";
  return "";
}

export function AttentionFeed({ alerts }: { alerts: Alert[] }) {
  const [state, setState] = useState<Record<string, LocalStatus>>({});
  const [expanded, setExpanded] = useState<string | null>(alerts[0]?.id ?? null);

  const visible = alerts.filter((a) => {
    const s = state[a.id] ?? "open";
    return s === "open" || s === "actioned";
  });

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <CircleCheck className="h-8 w-8 text-positive" />
        <p className="text-sm font-medium text-ink">Nothing needs attention</p>
        <p className="text-[13px] text-ink-subtle">You’ve cleared the feed. New issues will surface here.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {visible.map((a) => {
        const open = expanded === a.id;
        const actioned = (state[a.id] ?? "open") === "actioned";
        return (
          <div key={a.id} className="px-1">
            <button
              onClick={() => setExpanded(open ? null : a.id)}
              className="flex w-full items-start gap-3 py-3.5 text-left"
            >
              <span className="mt-0.5">
                <SeverityBadge severity={a.severity} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className={cn("truncate text-sm font-medium text-ink", actioned && "line-through opacity-60")}>
                    {a.title}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[13px] text-ink-subtle">{a.detail}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {a.severity !== "positive" && a.impact > 0 && (
                  <span className="hidden text-right text-[13px] font-semibold tabular text-ink sm:block">
                    {money(a.impact)}
                    <span className="text-2xs font-normal text-ink-subtle">{cadence(a)}</span>
                  </span>
                )}
                <ChevronRight className={cn("h-4 w-4 text-ink-subtle transition-transform", open && "rotate-90")} />
              </span>
            </button>

            {open && (
              <div className="animate-fade-up space-y-3 pb-4 pl-[4.5rem] pr-1">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Why it matters">{a.reason}</Field>
                  <Field label="Suggested next action">{a.suggestedAction}</Field>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {actioned ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-positive-soft px-2.5 py-1 text-[13px] font-medium text-positive-strong">
                      <Check className="h-3.5 w-3.5" /> Converted to action
                    </span>
                  ) : (
                    <button
                      onClick={() => setState((s) => ({ ...s, [a.id]: "actioned" }))}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-2.5 py-1 text-[13px] font-medium text-white hover:bg-accent-500"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" /> Convert to action
                    </button>
                  )}
                  <ActionBtn icon={UserPlus} label={a.owner ? `Assigned · ${a.owner}` : "Assign"} onClick={() => {}} />
                  <ActionBtn icon={Clock} label="Snooze" onClick={() => setState((s) => ({ ...s, [a.id]: "snoozed" }))} />
                  <ActionBtn icon={X} label="Dismiss" onClick={() => setState((s) => ({ ...s, [a.id]: "dismissed" }))} />
                  <Link
                    href={a.href}
                    className="ml-auto inline-flex items-center gap-1 text-[13px] font-medium text-accent-600 hover:text-accent-500"
                  >
                    Open {a.module}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2/40 px-3 py-2">
      <div className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle">{label}</div>
      <div className="mt-0.5 text-[13px] text-ink-muted">{children}</div>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-[13px] font-medium text-ink-muted transition-colors hover:border-border-strong hover:text-ink"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
