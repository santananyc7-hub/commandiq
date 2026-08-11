"use client";

import { useState } from "react";
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Plug,
  Check,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import type { QuickBooksConnection, Targets, User, Role, SyncStatus } from "@/lib/types";
import { money, ratioPct, shortDate, relativeFrom } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

type Tab = "targets" | "integrations" | "team";

const TABS: { key: Tab; label: string }[] = [
  { key: "targets", label: "Targets" },
  { key: "integrations", label: "Integrations" },
  { key: "team", label: "Team & Roles" },
];

export function SettingsView({
  targets,
  connection,
  team,
  qboConfigured,
  referenceDate,
  initialTab = "targets",
}: {
  targets: Targets;
  connection: QuickBooksConnection;
  team: User[];
  qboConfigured: boolean;
  referenceDate: string;
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div>
      <div className="mb-5 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === t.key ? "border-accent-500 text-ink" : "border-transparent text-ink-subtle hover:text-ink-muted"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "targets" && <TargetsForm targets={targets} />}
      {tab === "integrations" && (
        <IntegrationsPanel connection={connection} qboConfigured={qboConfigured} referenceDate={referenceDate} />
      )}
      {tab === "team" && <TeamPanel team={team} />}
    </div>
  );
}

// ── Targets ───────────────────────────────────────────────────────────────
function TargetsForm({ targets }: { targets: Targets }) {
  const [t, setT] = useState(targets);
  const [saved, setSaved] = useState(false);

  const fields: { key: keyof Targets; label: string; kind: "money" | "pct" | "days"; hint: string }[] = [
    { key: "monthlyRevenueGoal", label: "Monthly Revenue Goal", kind: "money", hint: "Drives pace and projection alerts" },
    { key: "cashReserve", label: "Cash Reserve Target", kind: "money", hint: "Safety buffer in available-cash math" },
    { key: "payrollPct", label: "Payroll Target", kind: "pct", hint: "Share of revenue" },
    { key: "marketingPct", label: "Marketing Target", kind: "pct", hint: "Share of revenue" },
    { key: "grossMarginPct", label: "Gross Margin Target", kind: "pct", hint: "Powers the margin pillar" },
    { key: "expenseVariancePct", label: "Expense Variance Threshold", kind: "pct", hint: "Trips expense warnings" },
  ];

  function update(key: keyof Targets, raw: string, kind: string) {
    const num = parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
    setT((prev) => ({ ...prev, [key]: kind === "pct" ? num / 100 : num }));
    setSaved(false);
  }

  return (
    <Card>
      <CardHeader title="Financial Targets" subtitle="These power every dashboard alert and the CommandIQ Score" />
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-2xs font-medium uppercase tracking-wide text-ink-subtle">{f.label}</label>
            <div className="relative">
              {f.kind === "money" && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle">$</span>}
              <input
                defaultValue={
                  f.kind === "pct" ? (t[f.key] * 100).toFixed(f.key === "expenseVariancePct" ? 0 : 1) : String(t[f.key])
                }
                onChange={(e) => update(f.key, e.target.value, f.kind)}
                className={cn("field", f.kind === "money" && "pl-7", f.kind === "pct" && "pr-8")}
              />
              {f.kind === "pct" && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle">%</span>}
            </div>
            <p className="mt-1 text-2xs text-ink-subtle">{f.hint}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 border-t border-border px-5 py-4">
        <button
          onClick={() => setSaved(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-500"
        >
          {saved ? <Check className="h-4 w-4" /> : null}
          {saved ? "Saved" : "Save targets"}
        </button>
        <span className="text-2xs text-ink-subtle">
          Current preview — revenue goal {money(t.monthlyRevenueGoal)}, margin {ratioPct(t.grossMarginPct)}, payroll {ratioPct(t.payrollPct)}
        </span>
      </div>
    </Card>
  );
}

// ── Integrations ──────────────────────────────────────────────────────────
const STATUS_META: Record<SyncStatus, { label: string; token: string; icon: React.ElementType }> = {
  connected: { label: "Connected", token: "positive", icon: CheckCircle2 },
  syncing: { label: "Syncing", token: "accent-500", icon: Loader2 },
  error: { label: "Error", token: "critical", icon: AlertCircle },
  disconnected: { label: "Not connected", token: "info", icon: Plug },
};

function IntegrationsPanel({
  connection,
  qboConfigured,
  referenceDate,
}: {
  connection: QuickBooksConnection;
  qboConfigured: boolean;
  referenceDate: string;
}) {
  const [status, setStatus] = useState<SyncStatus>(connection.status);
  const [lastSync, setLastSync] = useState(connection.lastSync);
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  function syncNow() {
    // Demo build: simulate a sync client-side (a live deployment with a server
    // would call the QuickBooks sync endpoint here).
    setStatus("syncing");
    setTimeout(() => {
      setLastSync(new Date().toISOString());
      setStatus("connected");
    }, 900);
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-2">
            <span className="text-lg font-bold text-[#2ca01c]">qb</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink">QuickBooks Online</span>
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-2xs font-semibold"
                style={{ color: `rgb(var(--${meta.token}))`, backgroundColor: `rgb(var(--${meta.token}) / 0.14)` }}
              >
                <Icon className={cn("h-3 w-3", status === "syncing" && "animate-spin")} />
                {meta.label}
              </span>
            </div>
            <div className="mt-0.5 text-2xs text-ink-subtle">
              {connection.companyName ?? "Your accounting source of truth"}
              {lastSync && ` · synced ${relativeFrom(lastSync, `${referenceDate}T14:00:00Z`)}`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status === "disconnected" ? (
              <a
                href="/onboarding"
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-500"
              >
                <Plug className="h-4 w-4" /> Connect QuickBooks
              </a>
            ) : (
              <button
                onClick={syncNow}
                disabled={status === "syncing"}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong bg-surface-2 px-3.5 py-2 text-sm font-medium text-ink hover:bg-surface-3 disabled:opacity-60"
              >
                <RefreshCw className={cn("h-4 w-4", status === "syncing" && "animate-spin")} />
                Sync now
              </button>
            )}
          </div>
        </div>

        {!qboConfigured && (
          <div className="border-t border-border bg-surface-2/40 px-5 py-3 text-2xs text-ink-subtle">
            Running in <span className="font-medium text-ink-muted">demo mode</span> — set{" "}
            <code className="rounded bg-surface px-1 py-0.5 text-[11px]">QUICKBOOKS_CLIENT_ID</code> and secret in your
            environment to enable the live OAuth connection.
          </div>
        )}
      </Card>

      {connection.entities.length > 0 && (
        <Card>
          <CardHeader title="Synced Data" subtitle="Entities normalized into CommandIQ" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
                  <th className="px-5 py-2.5">Entity</th>
                  <th className="px-3 py-2.5 text-right">Records</th>
                  <th className="px-5 py-2.5 text-right">Last Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {connection.entities.map((e) => (
                  <tr key={e.name} className="hover:bg-surface-2/40">
                    <td className="px-5 py-2.5 font-medium text-ink">{e.name}</td>
                    <td className="px-3 py-2.5 text-right tabular text-ink-muted">{e.count}</td>
                    <td className="px-5 py-2.5 text-right text-2xs tabular text-ink-subtle">
                      {e.lastSync ? shortDate(e.lastSync) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Team ──────────────────────────────────────────────────────────────────
const ROLE_ACCESS: Record<Role, string> = {
  owner: "Full access — all modules, targets, integrations and team",
  finance: "Financial data, obligations, vendors and payment tools",
  manager: "Dashboard, actions and limited financial views",
  viewer: "Read-only across permitted screens",
};

const PERMISSION_MATRIX: { area: string; roles: Record<Role, boolean> }[] = [
  { area: "Executive dashboard", roles: { owner: true, finance: true, manager: true, viewer: true } },
  { area: "Cash & obligations", roles: { owner: true, finance: true, manager: false, viewer: true } },
  { area: "Vendor payment planner", roles: { owner: true, finance: true, manager: false, viewer: false } },
  { area: "Edit targets", roles: { owner: true, finance: true, manager: false, viewer: false } },
  { area: "Manage integrations", roles: { owner: true, finance: false, manager: false, viewer: false } },
  { area: "Manage team", roles: { owner: true, finance: false, manager: false, viewer: false } },
];

const ROLES: Role[] = ["owner", "finance", "manager", "viewer"];

function TeamPanel({ team }: { team: User[] }) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Team" subtitle="Who has access to CommandIQ" />
        <div className="divide-y divide-border">
          {team.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-700 text-[13px] font-semibold text-white">
                {u.initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink">{u.name}</div>
                <div className="text-2xs text-ink-subtle">{u.email}</div>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-medium capitalize text-ink">{u.role}</div>
                <div className="hidden max-w-xs text-2xs text-ink-subtle sm:block">{ROLE_ACCESS[u.role]}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Permissions"
          subtitle="Server-enforced, least-privilege access"
          action={<ShieldCheck className="h-4 w-4 text-positive" />}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
                <th className="px-5 py-2.5">Capability</th>
                {ROLES.map((r) => (
                  <th key={r} className="px-3 py-2.5 text-center capitalize">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PERMISSION_MATRIX.map((row) => (
                <tr key={row.area} className="hover:bg-surface-2/40">
                  <td className="px-5 py-2.5 font-medium text-ink">{row.area}</td>
                  {ROLES.map((r) => (
                    <td key={r} className="px-3 py-2.5 text-center">
                      {row.roles[r] ? (
                        <Check className="mx-auto h-4 w-4 text-positive" />
                      ) : (
                        <span className="text-ink-subtle">·</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
