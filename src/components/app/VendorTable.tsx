"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Vendor, VendorMetric, VendorClass } from "@/lib/types";
import { VENDOR_CLASS_LABELS } from "@/lib/types";
import { money, moneyCompact, shortDate } from "@/lib/format";
import { VendorClassBadge, RiskBadge } from "@/components/ui/Badge";

export interface VendorRow {
  vendor: Vendor;
  metric: VendorMetric;
}

type SortKey = "outstanding" | "daysOutstanding" | "pctOfPurchases" | "trailingSpend";

export function VendorTable({ rows }: { rows: VendorRow[] }) {
  const [query, setQuery] = useState("");
  const [filterClass, setFilterClass] = useState<VendorClass | "all">("all");
  const [sort, setSort] = useState<SortKey>("outstanding");
  const [overrides, setOverrides] = useState<Record<string, VendorClass>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .map((r) => ({
        ...r,
        vendor: { ...r.vendor, classification: overrides[r.vendor.id] ?? r.vendor.classification },
      }))
      .filter((r) => (filterClass === "all" ? true : r.vendor.classification === filterClass))
      .filter((r) => (q ? r.vendor.name.toLowerCase().includes(q) || r.vendor.category.toLowerCase().includes(q) : true))
      .sort((a, b) => b.metric[sort] - a.metric[sort]);
  }, [rows, query, filterClass, sort, overrides]);

  const totalOut = rows.reduce((s, r) => s + r.metric.outstanding, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vendors…"
            className="h-9 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-subtle focus:border-accent-400 focus:bg-surface focus:outline-none"
          />
        </div>
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value as VendorClass | "all")}
          className="h-9 rounded-lg border border-border bg-surface-2 px-3 text-[13px] text-ink-muted focus:outline-none"
        >
          <option value="all">All classes</option>
          {Object.entries(VENDOR_CLASS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-9 rounded-lg border border-border bg-surface-2 px-3 text-[13px] text-ink-muted focus:outline-none"
        >
          <option value="outstanding">Sort: Balance</option>
          <option value="daysOutstanding">Sort: Days outstanding</option>
          <option value="pctOfPurchases">Sort: % of purchases</option>
          <option value="trailingSpend">Sort: Trailing spend</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
              <th className="px-5 py-2.5 font-semibold">Vendor</th>
              <th className="px-3 py-2.5 text-right font-semibold">Outstanding</th>
              <th className="px-3 py-2.5 text-right font-semibold">Oldest</th>
              <th className="px-3 py-2.5 text-right font-semibold">Days</th>
              <th className="px-3 py-2.5 text-right font-semibold">Trailing</th>
              <th className="px-3 py-2.5 text-right font-semibold">% Purch.</th>
              <th className="px-3 py-2.5 font-semibold">Class</th>
              <th className="px-5 py-2.5 text-right font-semibold">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(({ vendor, metric }) => (
              <tr key={vendor.id} className="group transition-colors hover:bg-surface-2/40">
                <td className="px-5 py-3">
                  <div className="font-medium text-ink">{vendor.name}</div>
                  <div className="text-2xs text-ink-subtle">
                    {vendor.category}
                    {vendor.lastPayment && ` · last paid ${shortDate(vendor.lastPayment)}`}
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-semibold tabular text-ink">{money(metric.outstanding)}</td>
                <td className="px-3 py-3 text-right text-2xs tabular text-ink-subtle">
                  {metric.oldestInvoice ? shortDate(metric.oldestInvoice) : "—"}
                </td>
                <td className="px-3 py-3 text-right tabular text-ink-muted">{metric.daysOutstanding}</td>
                <td className="px-3 py-3 text-right tabular text-ink-muted">{moneyCompact(metric.trailingSpend)}</td>
                <td className="px-3 py-3 text-right tabular text-ink-muted">{metric.pctOfPurchases.toFixed(1)}%</td>
                <td className="px-3 py-3">
                  <select
                    value={vendor.classification}
                    onChange={(e) => setOverrides((o) => ({ ...o, [vendor.id]: e.target.value as VendorClass }))}
                    className="max-w-[8.5rem] rounded-md border border-transparent bg-transparent py-0.5 text-2xs font-medium text-ink-muted hover:border-border focus:border-accent-400 focus:outline-none"
                  >
                    {Object.entries(VENDOR_CLASS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-3 text-right">
                  <RiskBadge risk={metric.risk} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border-strong">
              <td className="px-5 py-3 text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
                {filtered.length} vendors
              </td>
              <td className="px-3 py-3 text-right font-semibold tabular text-ink">{money(totalOut)}</td>
              <td colSpan={6} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
