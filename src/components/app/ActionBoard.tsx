"use client";

import { useState } from "react";
import { Plus, X, Sparkles, Bell, PenLine } from "lucide-react";
import type { ActionItem, ActionSource, ActionStatus } from "@/lib/types";
import { ACTION_STATUS_LABELS } from "@/lib/types";
import { money, shortDate } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { ActionStatusBadge } from "@/components/app/ActionStatusBadge";
import { cn } from "@/lib/cn";

const COLUMNS: ActionStatus[] = ["open", "in_progress", "waiting", "resolved"];
const SOURCE_ICON: Record<ActionSource, React.ElementType> = {
  ai: Sparkles,
  alert: Bell,
  manual: PenLine,
};

let uid = 5000;

export function ActionBoard({
  initial,
  referenceDate,
}: {
  initial: ActionItem[];
  referenceDate: string;
}) {
  const [items, setItems] = useState<ActionItem[]>(initial);
  const [showForm, setShowForm] = useState(false);

  function setStatus(id: string, status: ActionStatus) {
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }
  function add(item: ActionItem) {
    setItems((prev) => [item, ...prev]);
    setShowForm(false);
  }

  const open = items.filter((a) => a.status !== "resolved");
  const totalImpact = open.reduce((s, a) => s + a.impact, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Open items" value={String(open.length)} />
          <MiniStat label="Impact at stake" value={money(totalImpact)} tone="accent" />
          <MiniStat label="Resolved" value={String(items.filter((a) => a.status === "resolved").length)} tone="positive" />
          <MiniStat label="Total" value={String(items.length)} />
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-accent-600 px-3.5 text-sm font-medium text-white hover:bg-accent-500"
        >
          <Plus className="h-4 w-4" /> New action
        </button>
      </div>

      {showForm && <ActionForm onAdd={add} onCancel={() => setShowForm(false)} />}

      <div className="grid gap-4 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const colItems = items.filter((a) => a.status === col);
          return (
            <div key={col} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
                  {ACTION_STATUS_LABELS[col]}
                </span>
                <span className="text-2xs tabular text-ink-subtle">{colItems.length}</span>
              </div>
              {colItems.length === 0 && (
                <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-2xs text-ink-subtle">
                  Nothing here
                </div>
              )}
              {colItems.map((a) => {
                const Icon = SOURCE_ICON[a.source];
                const cadence = a.impactCadence === "week" ? "/wk" : a.impactCadence === "month" ? "/mo" : "";
                return (
                  <Card key={a.id} className="p-3.5">
                    <div className="flex items-start gap-2">
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-500" />
                      <span className="text-[13px] font-medium leading-snug text-ink">{a.issue}</span>
                    </div>
                    <p className="mt-1.5 text-2xs leading-relaxed text-ink-subtle">{a.recommendedAction}</p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-2xs text-ink-subtle">{a.owner}</span>
                      <span className="text-[13px] font-semibold tabular text-ink">
                        {money(a.impact)}
                        <span className="text-2xs font-normal text-ink-subtle">{cadence}</span>
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-2xs text-ink-subtle">{a.due ? `Due ${shortDate(a.due)}` : "No due date"}</span>
                    </div>
                    <select
                      value={a.status}
                      onChange={(e) => setStatus(a.id, e.target.value as ActionStatus)}
                      className="mt-2.5 w-full rounded-md border border-border bg-surface-2 px-2 py-1 text-2xs font-medium text-ink-muted focus:border-accent-400 focus:outline-none"
                    >
                      {COLUMNS.map((c) => (
                        <option key={c} value={c}>{ACTION_STATUS_LABELS[c]}</option>
                      ))}
                    </select>
                  </Card>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "accent" | "positive" }) {
  const toneClass = tone === "accent" ? "text-accent-600" : tone === "positive" ? "text-positive-strong" : "text-ink";
  return (
    <Card className="p-3">
      <div className="text-2xs font-medium uppercase tracking-wide text-ink-subtle">{label}</div>
      <div className={cn("mt-0.5 text-lg font-semibold tabular", toneClass)}>{value}</div>
    </Card>
  );
}

function ActionForm({ onAdd, onCancel }: { onAdd: (a: ActionItem) => void; onCancel: () => void }) {
  const [issue, setIssue] = useState("");
  const [owner, setOwner] = useState("");
  const [action, setAction] = useState("");
  const [impact, setImpact] = useState("");
  const [due, setDue] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!issue.trim()) return;
    onAdd({
      id: `a-new-${uid++}`,
      issue: issue.trim(),
      owner: owner.trim() || "Unassigned",
      recommendedAction: action.trim() || "—",
      impact: parseFloat(impact.replace(/[^0-9.]/g, "")) || 0,
      impactCadence: "month",
      due: due || null,
      status: "open",
      source: "manual",
      createdAt: new Date().toISOString().slice(0, 10),
    });
  }

  return (
    <Card>
      <form onSubmit={submit} className="grid gap-3 p-5 sm:grid-cols-2">
        <div className="flex items-center justify-between sm:col-span-2">
          <span className="text-sm font-medium text-ink">New action</span>
          <button type="button" onClick={onCancel} className="text-ink-subtle hover:text-ink"><X className="h-4 w-4" /></button>
        </div>
        <Field label="Issue" value={issue} onChange={setIssue} placeholder="What's the problem?" span2 />
        <Field label="Owner" value={owner} onChange={setOwner} placeholder="Who owns it?" />
        <Field label="Estimated impact" value={impact} onChange={setImpact} placeholder="$0 / month" />
        <Field label="Recommended action" value={action} onChange={setAction} placeholder="What should happen?" span2 />
        <div>
          <label className="mb-1 block text-2xs font-medium uppercase tracking-wide text-ink-subtle">Due date</label>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="field" />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-3 py-2 text-sm font-medium text-white hover:bg-accent-500">
            <Plus className="h-4 w-4" /> Create
          </button>
        </div>
      </form>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  span2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  span2?: boolean;
}) {
  return (
    <div className={span2 ? "sm:col-span-2" : undefined}>
      <label className="mb-1 block text-2xs font-medium uppercase tracking-wide text-ink-subtle">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="field" />
    </div>
  );
}
