import type { Metadata } from "next";
import { getFinancialState, getVendorsWithMetrics, seededActions, vendors, REFERENCE_DATE } from "@/lib/store";
import { PageHeader } from "@/components/app/PageHeader";
import { DemoBadge } from "@/components/app/DemoBadge";
import { Card, CardHeader } from "@/components/ui/Card";
import { ActionBoard } from "@/components/app/ActionBoard";
import { FindSavings } from "@/components/app/FindSavings";

export const metadata: Metadata = { title: "Action Board" };

export default function ActionsPage() {
  const { expenses } = getFinancialState();
  const rows = getVendorsWithMetrics();
  const metricsEntries: [string, (typeof rows)[number]["metric"]][] = rows.map((r) => [r.vendor.id, r.metric]);

  return (
    <>
      <PageHeader
        eyebrow="Execution"
        title="Action Board"
        subtitle="Turn financial insight into operational work — and find the money to fund it."
        action={<DemoBadge />}
      />

      <div className="space-y-6">
        <ActionBoard initial={seededActions} referenceDate={REFERENCE_DATE} />

        <Card>
          <CardHeader
            title="Find Me Savings"
            subtitle="Ranked, explainable opportunities from your spending"
          />
          <FindSavings expenses={expenses} vendors={vendors} metrics={metricsEntries} />
        </Card>
      </div>
    </>
  );
}
