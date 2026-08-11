import { getFinancialState, type FinancialState } from "@/lib/store";
import { monthlyHistory } from "@/lib/demo/data";
import { currentMonthDaily } from "@/lib/demo/data";
import type { LinePoint } from "@/components/charts/LineChart";
import { whatChanged, type ChangePeriod } from "@/lib/finance/changes";
import type { ChangeItem } from "@/lib/types";
import { monthDay } from "@/lib/format";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(ym: string): string {
  const m = parseInt(ym.slice(5, 7), 10) - 1;
  return MONTH_LABELS[m] ?? ym;
}

export interface DashboardData {
  state: FinancialState;
  revenueTrend: LinePoint[];
  marginTrend: LinePoint[];
  cumulativePace: LinePoint[];
  changes: Record<ChangePeriod, { headline: string; items: ChangeItem[] }>;
  revenueSpark: number[];
  marginSpark: number[];
}

export function getDashboardData(): DashboardData {
  const state = getFinancialState();

  const revenueTrend: LinePoint[] = monthlyHistory.map((m) => ({
    label: monthLabel(m.month),
    value: m.revenue,
  }));
  // Append the current month's projection as the trailing point.
  revenueTrend.push({ label: "Aug*", value: state.revenue.projectedMonthEnd });

  const marginTrend: LinePoint[] = monthlyHistory.map((m) => ({
    label: monthLabel(m.month),
    value: Math.round((m.grossProfit / m.revenue) * 1000) / 10,
  }));
  marginTrend.push({ label: "Aug*", value: Math.round(state.revenue.grossMarginPct * 1000) / 10 });

  // Cumulative revenue this month, building toward goal.
  let running = 0;
  const cumulativePace: LinePoint[] = currentMonthDaily.map((d) => {
    running += d.revenue;
    return { label: monthDay(d.date), value: running };
  });

  const ctx = {
    revenue: state.revenue,
    expenses: state.expenses,
    aging: state.aging,
    payrollShare: state.payrollShare,
  };
  const changes = {
    yesterday: whatChanged("yesterday", ctx),
    "7d": whatChanged("7d", ctx),
    "30d": whatChanged("30d", ctx),
    mtd: whatChanged("mtd", ctx),
  } as Record<ChangePeriod, { headline: string; items: ChangeItem[] }>;

  return {
    state,
    revenueTrend,
    marginTrend,
    cumulativePace,
    changes,
    revenueSpark: monthlyHistory.slice(-8).map((m) => m.revenue),
    marginSpark: monthlyHistory.slice(-8).map((m) => Math.round((m.grossProfit / m.revenue) * 1000) / 10),
  };
}
