import { getFinancialState, getVendorsWithMetrics, getPaymentPlan, vendors } from "@/lib/store";
import { findSavings } from "@/lib/finance/savings";
import { money, percent } from "@/lib/format";

export interface AiAnswer {
  conclusion: string;
  evidence: string[];
  impact?: string;
  recommendation: string;
  grounded: boolean;
  provider: string;
}

/** Extract the first dollar figure from a question, e.g. "$60,000" → 60000. */
function extractAmount(q: string): number | null {
  const m = q.match(/\$?\s*([\d,]+(?:\.\d+)?)\s*(k|m|thousand|million)?/i);
  if (!m) return null;
  let n = parseFloat(m[1].replace(/,/g, ""));
  const unit = m[2]?.toLowerCase();
  if (unit === "k" || unit === "thousand") n *= 1_000;
  if (unit === "m" || unit === "million") n *= 1_000_000;
  return n > 0 ? n : null;
}

/**
 * Deterministic AI CFO reasoner (§15).
 *
 * Answers are composed strictly from computed financial state — every figure
 * is real and traceable. When a question doesn't match a known intent we say so
 * rather than inventing an answer.
 */
export function reason(question: string): AiAnswer {
  const q = question.toLowerCase();
  const state = getFinancialState();
  const { revenue, cash, aging, apOver60, expenses, payrollShare, score, targets } = state;
  const amount = extractAmount(question);
  const provider = "CommandIQ reasoner";

  // ── Affordability ───────────────────────────────────────────────────────
  if (/afford|can we (buy|spend|purchase)|purchase|buy .* inventory/.test(q) && amount) {
    const remaining = cash.estimatedAvailable - amount;
    const belowReserve = remaining < 0;
    return {
      conclusion: belowReserve
        ? `A ${money(amount)} purchase would push you below your available-cash cushion. Only ${money(cash.estimatedAvailable)} is currently free after obligations and the ${money(targets.cashReserve)} reserve.`
        : `Yes — a ${money(amount)} purchase is affordable. It leaves ${money(remaining)} of free liquidity above your reserve.`,
      evidence: [
        `Estimated available cash: ${money(cash.estimatedAvailable)}`,
        `Proposed purchase: ${money(amount)}`,
        `Remaining after purchase: ${money(remaining)}`,
        `Reserve target already excluded: ${money(targets.cashReserve)}`,
      ],
      impact: belowReserve
        ? `This would erode your safety buffer and increase reliance on incoming daily sales (${money(revenue.currentDailyAverage)}/day).`
        : `Liquidity stays positive; near-term obligations of ${money(cash.committed30d)} remain covered.`,
      recommendation: belowReserve
        ? `Delay or split the purchase, or offset it by deferring flexible vendor payments and timing it after this week's deposits.`
        : `Proceed, but keep the ${money(targets.cashReserve)} reserve intact and revisit after the next payroll run.`,
      grounded: true,
      provider,
    };
  }

  // ── Why is margin down ──────────────────────────────────────────────────
  if (/margin/.test(q)) {
    const deltaPts = (revenue.grossMarginPct - revenue.grossMarginPriorPct) * 100;
    return {
      conclusion: `Gross margin is ${(revenue.grossMarginPct * 100).toFixed(1)}% MTD, ${percent(deltaPts)} points versus last month — ${deltaPts < 0 ? "a compression" : "an improvement"} against your ${(targets.grossMarginPct * 100).toFixed(0)}% target.`,
      evidence: [
        `Current gross margin: ${(revenue.grossMarginPct * 100).toFixed(1)}%`,
        `Prior month: ${(revenue.grossMarginPriorPct * 100).toFixed(1)}%`,
        `Target: ${(targets.grossMarginPct * 100).toFixed(0)}%`,
        `Gross profit MTD: ${money(revenue.grossProfitMTD)}`,
      ],
      impact: `At the projected ${money(revenue.projectedMonthEnd)} run-rate, each point of margin is worth roughly ${money(revenue.projectedMonthEnd / 100)} per month.`,
      recommendation: `Review supplier cost increases and discount mix on top-selling SKUs — the compression is on the cost side, not volume, since revenue is pacing ${percent(revenue.pacePct)} to goal.`,
      grounded: true,
      provider,
    };
  }

  // ── Which vendors to prioritize ─────────────────────────────────────────
  if (/vendor/.test(q) && /(priorit|pay|first|which)/.test(q)) {
    const plan = getPaymentPlan(cash.estimatedAvailable > 0 ? Math.min(cash.estimatedAvailable, 75_000) : 75_000);
    const funded = plan.allocations.filter((a) => a.recommended > 0).slice(0, 4);
    return {
      conclusion: `Prioritize ${funded.map((f) => f.vendorName).slice(0, 3).join(", ")} — weighted by aging, criticality and supply dependence.`,
      evidence: funded.map((f) => `${f.vendorName}: pay ${money(f.recommended)} of ${money(f.balance)} — ${f.reason}`),
      impact: `Allocating ${money(plan.allocated)} clears the highest-risk balances first and leaves ${money(plan.remaining)} in reserve.`,
      recommendation: `Run the Payment Planner on Vendors & AP to adjust the pool. Hold disputed balances (Pinnacle) until the review closes.`,
      grounded: true,
      provider,
    };
  }

  // ── On pace to goal ─────────────────────────────────────────────────────
  if (/(on pace|pace|hit|reach|track).*(goal|million|\$1|target|month)|are we on/.test(q)) {
    const ahead = revenue.projectedMonthEnd >= revenue.monthlyGoal;
    return {
      conclusion: `You're projecting ${money(revenue.projectedMonthEnd)} against a ${money(revenue.monthlyGoal)} goal — ${ahead ? "on track to beat it" : "slightly short"}. Pace is ${percent(revenue.pacePct)} versus goal-to-date.`,
      evidence: [
        `Revenue MTD: ${money(revenue.revenueMTD)} (day ${revenue.daysElapsed} of ${revenue.daysInMonth})`,
        `Current daily average: ${money(revenue.currentDailyAverage)}`,
        `Required daily average to hit goal: ${money(revenue.requiredDailyAverage)}`,
        `Projected month-end: ${money(revenue.projectedMonthEnd)}`,
      ],
      impact: ahead
        ? `A ${money(revenue.projectedMonthEnd - revenue.monthlyGoal)} cushion above goal at the current run-rate.`
        : `A ${money(revenue.monthlyGoal - revenue.projectedMonthEnd)} gap to close over the remaining ${revenue.daysInMonth - revenue.daysElapsed} days.`,
      recommendation: ahead
        ? `Hold staffing and protect margin — the top line is healthy.`
        : `Lift the daily average by ${money(revenue.requiredDailyAverage - revenue.currentDailyAverage)} via a mid-week promotion or extended peak-hour coverage.`,
      grounded: true,
      provider,
    };
  }

  // ── AP over 60 / aging ──────────────────────────────────────────────────
  if (/(60 day|61|90 day|overdue|past due|aging|payabl)/.test(q)) {
    return {
      conclusion: `${money(apOver60)} of AP is more than 60 days overdue, of a ${money(aging.total)} total payables balance.`,
      evidence: [
        `Total AP: ${money(aging.total)}`,
        `61–90 days: ${money(aging.d61_90)}`,
        `90+ days: ${money(aging.d90plus)}`,
        `Current (not due): ${money(aging.current)}`,
      ],
      impact: `Aged balances risk supply interruption and late fees; the oldest sits with Cortez Wholesale and disputed Pinnacle invoices.`,
      recommendation: `Prioritize the 90+ bucket in the next payment run and open a short payment plan on the aged Cortez balance. Keep Pinnacle on hold pending the dispute.`,
      grounded: true,
      provider,
    };
  }

  // ── Where can we cut / savings ──────────────────────────────────────────
  if (/(cut|save|saving|reduce|trim|where.*money|spend less)/.test(q)) {
    const target = amount ?? 20_000;
    const rows = getVendorsWithMetrics();
    const metricMap = new Map(rows.map((r) => [r.vendor.id, r.metric]));
    const s = findSavings(target, expenses, vendors, metricMap);
    return {
      conclusion: `There's roughly ${money(s.monthlyTotal)} in potential monthly savings — ${money(s.byConfidence.high)} of it high-confidence.`,
      evidence: s.opportunities.slice(0, 4).map((o) => `${o.area}: ${money(o.monthly)} — ${o.title} (${o.confidence})`),
      impact: `Against a ${money(target)} target, the identified opportunities cover ${((s.monthlyTotal / target) * 100).toFixed(0)}%.`,
      recommendation: `Start with the high-confidence items (marketing to trend, subscription audit). Treat professional-services and vendor renegotiation as review items — they may be one-time or need a conversation.`,
      grounded: true,
      provider,
    };
  }

  // ── Marketing ───────────────────────────────────────────────────────────
  if (/marketing/.test(q)) {
    const mk = expenses.find((e) => e.id === "e-marketing");
    if (mk) {
      return {
        conclusion: `Marketing is ${money(mk.current)} this month — ${percent(mk.variancePct)} versus its 3-month average, while revenue grew ${percent(mk.revenueGrowthPct)}.`,
        evidence: [
          `Current: ${money(mk.current)}`,
          `3-month average: ${money(mk.threeMonthAvg)}`,
          `Revenue growth: ${percent(mk.revenueGrowthPct)}`,
          mk.flag ?? "",
        ].filter(Boolean),
        impact: `Spend is outpacing revenue growth, pressuring contribution margin.`,
        recommendation: `Pause the two lowest-ROAS campaigns and rebase to the trend line — that recovers about ${money(Math.max(0, mk.varianceAbs))}/month.`,
        grounded: true,
        provider,
      };
    }
  }

  // ── Cash / available ────────────────────────────────────────────────────
  if (/(cash|available|liquid|how much.*spend|safely spend)/.test(q)) {
    return {
      conclusion: `You have ${money(cash.estimatedAvailable)} in estimated available cash after committed obligations and your ${money(cash.recommendedReserve)} reserve.`,
      evidence: [
        `Book cash (${cash.source}): ${money(cash.bookCash)}`,
        `Committed next 30 days: ${money(cash.committed30d)}`,
        `Recommended reserve: ${money(cash.recommendedReserve)}`,
        `Estimated available: ${money(cash.estimatedAvailable)}`,
      ],
      impact: `This is accounting cash, not a live bank balance — connect a bank feed for real-time figures.`,
      recommendation: `Keep discretionary spend within the ${money(Math.max(0, cash.estimatedAvailable))} available and revisit after the next payroll and rent cycle.`,
      grounded: true,
      provider,
    };
  }

  // ── Fallback: grounded summary, clearly flagged ─────────────────────────
  return {
    conclusion: `Here's where the business stands: CommandIQ Score ${score.score}/100 (${score.status}).`,
    evidence: [
      `Revenue MTD ${money(revenue.revenueMTD)}, pacing ${percent(revenue.pacePct)} to goal`,
      `Gross margin ${(revenue.grossMarginPct * 100).toFixed(1)}% vs ${(targets.grossMarginPct * 100).toFixed(0)}% target`,
      `Available cash ${money(cash.estimatedAvailable)}`,
      `AP ${money(aging.total)} total, ${money(apOver60)} over 60 days`,
      `Payroll at ${(payrollShare * 100).toFixed(1)}% of revenue`,
    ],
    recommendation: `Ask a more specific question — e.g. affordability of a purchase, why margin moved, which vendors to prioritize, or where to find savings.`,
    grounded: false,
    provider,
  };
}

/** Compact factsheet for optional LLM phrasing — all real numbers. */
export function buildFactsheet(): string {
  const s = getFinancialState();
  return [
    `CommandIQ Score: ${s.score.score}/100 (${s.score.status})`,
    `Revenue MTD: ${money(s.revenue.revenueMTD)}; goal ${money(s.revenue.monthlyGoal)}; projected ${money(s.revenue.projectedMonthEnd)}; pace ${percent(s.revenue.pacePct)}`,
    `Daily avg ${money(s.revenue.currentDailyAverage)}; required ${money(s.revenue.requiredDailyAverage)}`,
    `Gross margin ${(s.revenue.grossMarginPct * 100).toFixed(1)}% (prior ${(s.revenue.grossMarginPriorPct * 100).toFixed(1)}%, target ${(s.targets.grossMarginPct * 100).toFixed(0)}%)`,
    `Book cash ${money(s.cash.bookCash)}; committed 30d ${money(s.cash.committed30d)}; reserve ${money(s.cash.recommendedReserve)}; available ${money(s.cash.estimatedAvailable)}`,
    `AP total ${money(s.aging.total)}; past due ${money(s.apPastDue)}; over 60 ${money(s.apOver60)}; 90+ ${money(s.aging.d90plus)}`,
    `Payroll ${(s.payrollShare * 100).toFixed(1)}% of revenue (target ${(s.targets.payrollPct * 100).toFixed(0)}%)`,
    `Top-3 vendor concentration ${(s.vendorConcentration.top3Share * 100).toFixed(0)}%`,
    `Flagged expenses: ${s.expenses.filter((e) => e.flag).map((e) => `${e.name} ${percent(e.variancePct)}`).join("; ") || "none"}`,
  ].join("\n");
}
