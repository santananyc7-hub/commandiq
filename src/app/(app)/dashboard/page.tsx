import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDashboardData } from "@/lib/dashboard";
import { seededActions, organization, REFERENCE_DATE } from "@/lib/store";
import { shortDate, money, moneyCompact } from "@/lib/format";
import { PageHeader } from "@/components/app/PageHeader";
import { DemoBadge } from "@/components/app/DemoBadge";
import { ScorePanel } from "@/components/app/ScorePanel";
import { MetricCard } from "@/components/app/MetricCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { AttentionFeed } from "@/components/app/AttentionFeed";
import { CashSummary } from "@/components/app/CashSummary";
import { WeeklyBrief } from "@/components/app/WeeklyBrief";
import { WhatChanged } from "@/components/app/WhatChanged";
import { RecentActions } from "@/components/app/RecentActions";
import { LineChart } from "@/components/charts/LineChart";
import { AgingBar } from "@/components/charts/AgingBar";

export const metadata: Metadata = { title: "Command Center" };

export default function DashboardPage() {
  const { state, marginTrend, cumulativePace, changes, revenueSpark, marginSpark } = getDashboardData();
  const { kpis, score, alerts, cash, aging, revenue, targets } = state;

  const sparkFor: Record<string, number[]> = {
    revmtd: revenueSpark,
    margin: marginSpark,
  };

  return (
    <>
      <PageHeader
        eyebrow={`${organization.name} · ${shortDate(REFERENCE_DATE)}`}
        title="Command Center"
        subtitle="The health of the business at a glance — what changed, what matters, and what needs action."
        action={<DemoBadge />}
      />

      <div className="space-y-5">
        {/* Score */}
        <ScorePanel score={score} />

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {kpis.map((m) => (
            <MetricCard key={m.key} metric={m} spark={sparkFor[m.key]} />
          ))}
        </div>

        {/* Attention + weekly brief */}
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Needs Attention"
              subtitle="Prioritized by severity and financial impact"
              action={
                <Link href="/actions" className="inline-flex items-center gap-1 text-[13px] font-medium text-accent-600 hover:text-accent-500">
                  Action board <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <div className="px-4">
              <AttentionFeed alerts={alerts} />
            </div>
          </Card>

          <Card glow>
            <WeeklyBrief state={state} />
          </Card>
        </div>

        {/* Cash + pace */}
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Cash Position"
              subtitle="How much can we safely use?"
              action={
                <Link href="/cash" className="text-[13px] font-medium text-accent-600 hover:text-accent-500">
                  Details
                </Link>
              }
            />
            <CashSummary cash={cash} />
          </Card>

          <Card>
            <CardHeader
              title="Revenue Pace"
              subtitle={`${moneyCompact(revenue.revenueMTD)} MTD · projecting ${moneyCompact(revenue.projectedMonthEnd)}`}
              action={
                <Link href="/performance" className="text-[13px] font-medium text-accent-600 hover:text-accent-500">
                  Details
                </Link>
              }
            />
            <div className="p-5 pt-4">
              <LineChart
                points={cumulativePace}
                goal={targets.monthlyRevenueGoal}
                goalLabel={`Goal ${moneyCompact(targets.monthlyRevenueGoal)}`}
                tone="accent"
              />
            </div>
          </Card>
        </div>

        {/* AP aging + margin trend */}
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="AP Aging"
              subtitle={`${money(aging.total)} outstanding`}
              action={
                <Link href="/vendors" className="text-[13px] font-medium text-accent-600 hover:text-accent-500">
                  Vendors
                </Link>
              }
            />
            <div className="p-5">
              <AgingBar aging={aging} />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Gross Margin Trend"
              subtitle={`${(revenue.grossMarginPct * 100).toFixed(1)}% MTD · ${(targets.grossMarginPct * 100).toFixed(0)}% target`}
            />
            <div className="p-5 pt-4">
              <LineChart
                points={marginTrend}
                goal={targets.grossMarginPct * 100}
                goalLabel={`Target ${(targets.grossMarginPct * 100).toFixed(0)}%`}
                tone="positive"
                valueFormat={(n) => `${n.toFixed(0)}%`}
              />
            </div>
          </Card>
        </div>

        {/* What changed + recent actions */}
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="What Changed" subtitle="Financially material moves, ranked by impact" />
            <WhatChanged data={changes} />
          </Card>

          <Card>
            <CardHeader
              title="Recent Actions"
              subtitle="Insight converted into operational work"
              action={
                <Link href="/actions" className="text-[13px] font-medium text-accent-600 hover:text-accent-500">
                  View all
                </Link>
              }
            />
            <RecentActions actions={seededActions} />
          </Card>
        </div>
      </div>
    </>
  );
}
