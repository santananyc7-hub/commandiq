import type {
  CommandScore,
  ScoreDriver,
  ScorePillar,
  ScoreStatus,
} from "@/lib/types";
import { bandHealth, clamp01 } from "./util";

/**
 * CommandIQ Score (§5, docs/FINANCIAL_LOGIC.md).
 *
 * A deterministic 0–100 health index built from eight weighted pillars. Each
 * pillar maps a real financial metric to a 0–1 health band; the score is the
 * weighted sum × 100. Weights are configurable so ownership can retune what
 * "healthy" means for the business without changing the model.
 */
export interface ScoreWeights {
  revenuePace: number;
  grossMargin: number;
  liquidity: number;
  apAging: number;
  arAging: number;
  expenseControl: number;
  cashCoverage: number;
  payrollRatio: number;
}

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  revenuePace: 0.18,
  grossMargin: 0.16,
  liquidity: 0.16,
  apAging: 0.12,
  arAging: 0.08,
  expenseControl: 0.12,
  cashCoverage: 0.1,
  payrollRatio: 0.08,
};

export interface ScoreInputs {
  /** Revenue pace vs. goal, in percent (+ ahead / − behind). */
  pacePct: number;
  /** Actual gross margin ratio (0–1). */
  grossMarginPct: number;
  /** Target gross margin ratio (0–1). */
  grossMarginTarget: number;
  /** Estimated available cash after reserve. */
  estimatedAvailable: number;
  /** Recommended reserve target. */
  reserveTarget: number;
  /** Share of AP that is past due (0–1). */
  apPastDueShare: number;
  /** Share of AR that is past due (0–1). */
  arPastDueShare: number;
  /** Fastest-growing scaling expense vs. revenue, in excess percent points. */
  expenseExcessPct: number;
  /** Months of obligations covered by book cash. */
  cashCoverageMonths: number;
  /** Payroll as a share of revenue (0–1). */
  payrollShare: number;
  /** Payroll target share (0–1). */
  payrollTarget: number;
}

interface PillarDef {
  key: keyof ScoreWeights;
  label: string;
  health: number;
  note: string;
}

function statusFor(score: number): { status: ScoreStatus; headline: string } {
  if (score >= 85)
    return { status: "strong", headline: "Strong — the business is in control." };
  if (score >= 70)
    return { status: "stable", headline: "Stable, but attention needed." };
  if (score >= 50)
    return {
      status: "attention",
      headline: "Needs attention — several pressures building.",
    };
  return {
    status: "critical",
    headline: "Critical — act on the flagged items now.",
  };
}

export function computeScore(
  inputs: ScoreInputs,
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS
): CommandScore {
  const marginDelta = (inputs.grossMarginPct - inputs.grossMarginTarget) * 100;
  const payrollDelta = (inputs.payrollShare - inputs.payrollTarget) * 100;
  const liquidityRatio =
    inputs.reserveTarget > 0
      ? inputs.estimatedAvailable / inputs.reserveTarget
      : inputs.estimatedAvailable > 0
        ? 1
        : 0;

  const defs: PillarDef[] = [
    {
      key: "revenuePace",
      label: "Revenue pace",
      health: bandHealth(inputs.pacePct, 2, -12),
      note:
        inputs.pacePct >= 0
          ? `Running ${inputs.pacePct.toFixed(1)}% ahead of goal pace.`
          : `Running ${Math.abs(inputs.pacePct).toFixed(1)}% behind goal pace.`,
    },
    {
      key: "grossMargin",
      label: "Gross margin",
      health: bandHealth(marginDelta, 2, -8),
      note: `${(inputs.grossMarginPct * 100).toFixed(1)}% vs ${(inputs.grossMarginTarget * 100).toFixed(0)}% target.`,
    },
    {
      key: "liquidity",
      label: "Liquidity",
      health: bandHealth(liquidityRatio, 1.5, -0.25),
      note:
        liquidityRatio >= 1
          ? "Available cash covers the reserve target."
          : "Available cash is below the reserve target.",
    },
    {
      key: "apAging",
      label: "AP aging",
      health: bandHealth(inputs.apPastDueShare, 0.05, 0.4),
      note: `${(inputs.apPastDueShare * 100).toFixed(0)}% of AP is past due.`,
    },
    {
      key: "arAging",
      label: "AR aging",
      health: bandHealth(inputs.arPastDueShare, 0.1, 0.45),
      note: `${(inputs.arPastDueShare * 100).toFixed(0)}% of AR is past due.`,
    },
    {
      key: "expenseControl",
      label: "Expense control",
      health: bandHealth(inputs.expenseExcessPct, 3, 30),
      note:
        inputs.expenseExcessPct > 3
          ? "A category is outgrowing revenue."
          : "Expense growth is contained.",
    },
    {
      key: "cashCoverage",
      label: "Cash coverage",
      health: bandHealth(inputs.cashCoverageMonths, 2.5, 0.4),
      note: `~${inputs.cashCoverageMonths.toFixed(1)} months of obligations covered.`,
    },
    {
      key: "payrollRatio",
      label: "Payroll ratio",
      health: bandHealth(payrollDelta, -1, 6),
      note: `Payroll at ${(inputs.payrollShare * 100).toFixed(1)}% of revenue vs ${(inputs.payrollTarget * 100).toFixed(0)}% target.`,
    },
  ];

  const pillars: ScorePillar[] = defs.map((d) => {
    const weight = weights[d.key];
    const health = clamp01(d.health);
    return {
      key: d.key,
      label: d.label,
      weight,
      health,
      points: Math.round(weight * health * 100 * 10) / 10,
      note: d.note,
    };
  });

  const totalWeight = pillars.reduce((s, p) => s + p.weight, 0) || 1;
  const raw = pillars.reduce((s, p) => s + p.weight * p.health, 0) / totalWeight;
  const score = Math.round(raw * 100);
  const { status, headline } = statusFor(score);

  // Drivers: strongest positive and negative pillars relative to neutral (0.7).
  const drivers: ScoreDriver[] = defs
    .map((d, i): ScoreDriver => {
      const p = pillars[i];
      const delta = Math.round((p.health - 0.7) * p.weight * 100 * 10) / 10;
      return {
        label: d.label,
        delta,
        direction: p.health >= 0.7 ? "positive" : "negative",
        detail: d.note,
      };
    })
    .filter((d) => Math.abs(d.delta) >= 0.3)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 6);

  return { score, status, headline, drivers, pillars };
}
