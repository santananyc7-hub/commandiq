import type { Metadata } from "next";
import { getFinancialState, obligations, REFERENCE_DATE } from "@/lib/store";
import { money } from "@/lib/format";
import { PageHeader } from "@/components/app/PageHeader";
import { DemoBadge } from "@/components/app/DemoBadge";
import { Card, CardHeader } from "@/components/ui/Card";
import { CashSummary } from "@/components/app/CashSummary";
import { ObligationManager } from "@/components/app/ObligationManager";

export const metadata: Metadata = { title: "Cash & Obligations" };

export default function CashPage() {
  const state = getFinancialState();
  const { cash, cashCoverageMonths } = state;

  return (
    <>
      <PageHeader
        eyebrow="Liquidity"
        title="Cash & Obligations"
        subtitle="How much cash can we safely use right now?"
        action={<DemoBadge />}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Available Cash" subtitle="Book cash, less commitments and reserve" />
            <CashSummary cash={cash} />
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="text-2xs font-medium uppercase tracking-wide text-ink-subtle">Cash Coverage</div>
              <div className="mt-1 text-xl font-semibold tabular text-ink">{cashCoverageMonths.toFixed(1)} mo</div>
              <div className="mt-0.5 text-2xs text-ink-subtle">of committed obligations</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xs font-medium uppercase tracking-wide text-ink-subtle">Recommended Reserve</div>
              <div className="mt-1 text-xl font-semibold tabular text-ink">{money(cash.recommendedReserve)}</div>
              <div className="mt-0.5 text-2xs text-ink-subtle">safety buffer target</div>
            </Card>
          </div>

          <Card className="p-5">
            <p className="text-[13px] leading-relaxed text-ink-muted">
              <span className="font-medium text-ink">Source note.</span> This figure is your{" "}
              <span className="text-ink">QuickBooks Cash Balance</span> — an accounting figure, not a live
              bank feed. Connect a bank feed later for real-time available balances.
            </p>
          </Card>
        </div>

        <ObligationManager initial={obligations} referenceDate={REFERENCE_DATE} />
      </div>
    </>
  );
}
