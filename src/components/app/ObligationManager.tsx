"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, CalendarClock, X } from "lucide-react";
import type { Obligation, ObligationPriority, Recurrence } from "@/lib/types";
import { RECURRENCE_LABELS } from "@/lib/types";
import { committedWithin, upcomingObligations } from "@/lib/finance/cash";
import { money, moneyCompact, dueFrom } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

const PRIORITY_TONE: Record<ObligationPriority, "negative" | "accent" | "neutral"> = {
  essential: "negative",
  important: "accent",
  flexible: "neutral",
};

let uid = 1000;

export function ObligationManager({
  initial,
  referenceDate,
  startOpen = false,
}: {
  initial: Obligation[];
  referenceDate: string;
  startOpen?: boolean;
}) {
  const [items, setItems] = useState<Obligation[]>(initial);
  const [showForm, setShowForm] = useState(startOpen);

  const committed = useMemo(
    () => ({
      d30: committedWithin(items, referenceDate, 30),
      d60: committedWithin(items, referenceDate, 60),
      d90: committedWithin(items, referenceDate, 90),
    }),
    [items, referenceDate]
  );

  const upcoming = useMemo(
    () => upcomingObligations(items, referenceDate).filter((u) => u.dueInDays <= 60),
    [items, referenceDate]
  );

  function addItem(o: Obligation) {
    setItems((prev) => [...prev, o]);
    setShowForm(false);
  }
  function toggle(id: string) {
    setItems((prev) => prev.map((o) => (o.id === id ? { ...o, active: !o.active } : o)));
  }
  function remove(id: string) {
    setItems((prev) => prev.filter((o) => o.id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Committed · 30 days", value: committed.d30 },
          { label: "Committed · 60 days", value: committed.d60 },
          { label: "Committed · 90 days", value: committed.d90 },
        ].map((c) => (
          <Card key={c.label} className="p-4">
            <div className="text-2xs font-medium uppercase tracking-wide text-ink-subtle">{c.label}</div>
            <div className="mt-1 text-xl font-semibold tabular text-ink">{moneyCompact(c.value)}</div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Obligations"
          subtitle="Recurring commitments — no contract upload required"
          action={
            <button
              onClick={() => setShowForm((s) => !s)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-2.5 py-1.5 text-[13px] font-medium text-white hover:bg-accent-500"
            >
              <Plus className="h-3.5 w-3.5" /> Add obligation
            </button>
          }
        />

        {showForm && <ObligationForm onAdd={addItem} onCancel={() => setShowForm(false)} referenceDate={referenceDate} />}

        <div className="divide-y divide-border">
          {items.map((o) => (
            <div key={o.id} className={cn("flex items-center gap-3 px-5 py-3", !o.active && "opacity-50")}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-ink">{o.name}</span>
                  <Chip tone={PRIORITY_TONE[o.priority]}>{o.priority}</Chip>
                </div>
                <div className="mt-0.5 truncate text-2xs text-ink-subtle">
                  {o.counterparty} · {RECURRENCE_LABELS[o.recurrence]} · {o.category}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold tabular text-ink">{money(o.amount)}</div>
                <div className="text-2xs text-ink-subtle">{dueFrom(o.dueDate, referenceDate)}</div>
              </div>
              <button
                onClick={() => toggle(o.id)}
                className="rounded-md border border-border px-2 py-1 text-2xs font-medium text-ink-muted hover:bg-surface-2"
              >
                {o.active ? "Active" : "Paused"}
              </button>
              <button
                onClick={() => remove(o.id)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-subtle hover:bg-critical/10 hover:text-critical"
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Obligation Calendar" subtitle="Next 60 days" />
        <div className="p-5">
          {upcoming.length === 0 ? (
            <p className="text-sm text-ink-subtle">No obligations due in the next 60 days.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((u, i) => {
                const maxAmt = Math.max(...upcoming.map((x) => x.obligation.amount));
                const pct = (u.obligation.amount / maxAmt) * 100;
                return (
                  <div key={`${u.obligation.id}-${i}`} className="flex items-center gap-3">
                    <div className="flex w-24 shrink-0 items-center gap-1.5 text-2xs text-ink-subtle">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {u.dueInDays === 0 ? "today" : `${u.dueInDays}d`}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] text-ink-muted">{u.obligation.name}</span>
                        <span className="text-[13px] font-semibold tabular text-ink">{moneyCompact(u.obligation.amount)}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-accent-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function ObligationForm({
  onAdd,
  onCancel,
  referenceDate,
}: {
  onAdd: (o: Obligation) => void;
  onCancel: () => void;
  referenceDate: string;
}) {
  const [name, setName] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(referenceDate);
  const [recurrence, setRecurrence] = useState<Recurrence>("monthly");
  const [category, setCategory] = useState("Vendor");
  const [priority, setPriority] = useState<ObligationPriority>("important");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount.replace(/[^0-9.]/g, ""));
    if (!name.trim() || !amt) return;
    onAdd({
      id: `o-new-${uid++}`,
      name: name.trim(),
      counterparty: counterparty.trim() || "—",
      amount: amt,
      dueDate,
      recurrence,
      category,
      priority,
      active: true,
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-3 border-b border-border bg-surface-2/40 p-5 sm:grid-cols-2">
      <div className="flex items-center justify-between sm:col-span-2">
        <span className="text-sm font-medium text-ink">New obligation</span>
        <button type="button" onClick={onCancel} className="text-ink-subtle hover:text-ink" aria-label="Cancel">
          <X className="h-4 w-4" />
        </button>
      </div>
      <Input label="Name" value={name} onChange={setName} placeholder="e.g. Equipment lease" />
      <Input label="Counterparty" value={counterparty} onChange={setCounterparty} placeholder="e.g. LeaseCorp" />
      <Input label="Amount" value={amount} onChange={setAmount} placeholder="$0" />
      <div>
        <Label>Next due date</Label>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="field" />
      </div>
      <div>
        <Label>Recurrence</Label>
        <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as Recurrence)} className="field">
          {Object.entries(RECURRENCE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div>
        <Label>Priority</Label>
        <select value={priority} onChange={(e) => setPriority(e.target.value as ObligationPriority)} className="field">
          <option value="essential">Essential</option>
          <option value="important">Important</option>
          <option value="flexible">Flexible</option>
        </select>
      </div>
      <div className="flex items-end gap-2 sm:col-span-2">
        <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-3 py-2 text-sm font-medium text-white hover:bg-accent-500">
          <Plus className="h-4 w-4" /> Add obligation
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-border px-3 py-2 text-sm text-ink-muted hover:bg-surface-2">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-2xs font-medium uppercase tracking-wide text-ink-subtle">{children}</label>;
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="field" />
    </div>
  );
}
