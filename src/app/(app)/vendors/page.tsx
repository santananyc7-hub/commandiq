import type { Metadata } from "next";
import { getFinancialState, getVendorsWithMetrics, vendors } from "@/lib/store";
import { money } from "@/lib/format";
import { PageHeader } from "@/components/app/PageHeader";
import { DemoBadge } from "@/components/app/DemoBadge";
import { Card, CardHeader } from "@/components/ui/Card";
import { AgingBar } from "@/components/charts/AgingBar";
import { BarChart, type BarDatum } from "@/components/charts/BarChart";
import { VendorTable } from "@/components/app/VendorTable";
import { PaymentPlanner } from "@/components/app/PaymentPlanner";

export const metadata: Metadata = { title: "Vendors & AP" };

export default function VendorsPage() {
  const state = getFinancialState();
  const { aging, apPastDue, apOver60, vendorConcentration } = state;
  const rows = getVendorsWithMetrics();

  const concentration: BarDatum[] = rows.slice(0, 6).map((r) => ({
    label: r.vendor.name,
    value: r.metric.outstanding,
    tone: r.metric.risk === "high" ? "negative" : r.metric.risk === "medium" ? "watch" : "accent",
  }));

  const metricsEntries: [string, (typeof rows)[number]["metric"]][] = rows.map((r) => [r.vendor.id, r.metric]);

  return (
    <>
      <PageHeader
        eyebrow="Payables"
        title="Vendors & AP Control"
        subtitle="Aging, vendor risk, and an explainable payment plan."
        action={<DemoBadge />}
      />

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Total AP" value={money(aging.total)} />
          <Stat label="Past Due" value={money(apPastDue)} tone="negative" />
          <Stat label="Over 60 Days" value={money(apOver60)} tone="negative" />
          <Stat label="Top-3 Concentration" value={`${(vendorConcentration.top3Share * 100).toFixed(0)}%`} tone="watch" />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="AP Aging" subtitle={`${money(aging.total)} across ${vendors.length} vendors`} />
            <div className="p-5">
              <AgingBar aging={aging} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Outstanding by Vendor" subtitle="Where the exposure is concentrated" />
            <div className="p-5">
              <BarChart data={concentration} />
            </div>
          </Card>
        </div>

        <div id="planner" className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <Card>
            <CardHeader title="Vendor Health" subtitle="Classify, sort and assess risk" />
            <VendorTable rows={rows} />
          </Card>

          <Card>
            <CardHeader title="Payment Planner" subtitle="Allocate a cash pool across vendors" />
            <PaymentPlanner vendors={vendors} metrics={metricsEntries} suggested={75_000} />
          </Card>
        </div>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "negative" | "watch";
}) {
  const toneClass =
    tone === "negative" ? "text-negative-strong" : tone === "watch" ? "text-watch" : "text-ink";
  return (
    <Card className="p-4">
      <div className="text-2xs font-medium uppercase tracking-wide text-ink-subtle">{label}</div>
      <div className={`mt-1 text-xl font-semibold tabular ${toneClass}`}>{value}</div>
    </Card>
  );
}
