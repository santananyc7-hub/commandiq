import { Sparkles } from "lucide-react";
import type { FinancialState } from "@/lib/store";
import { money, percent } from "@/lib/format";

/**
 * AI Weekly Brief (§22). A grounded, deterministic narrative composed from the
 * same computed state as the rest of the dashboard — no free-form generation,
 * so it can never disagree with the numbers.
 */
export function WeeklyBrief({ state }: { state: FinancialState }) {
  const { revenue, score, alerts, cash, apOver60 } = state;
  const topIssue = alerts.find((a) => a.severity !== "positive");

  const sentences: string[] = [];
  sentences.push(
    `The business scores ${score.score}/100 — ${score.status}. Revenue is pacing ${revenue.pacePct >= 0 ? "ahead of" : "behind"} goal at ${money(revenue.revenueMTD)} MTD, projecting ${money(revenue.projectedMonthEnd)} against the ${money(revenue.monthlyGoal)} target.`
  );
  sentences.push(
    `Gross margin is ${(revenue.grossMarginPct * 100).toFixed(1)}%, ${percent((revenue.grossMarginPct - revenue.grossMarginPriorPct) * 100)} points versus last month. Estimated available cash after obligations and reserve is ${money(cash.estimatedAvailable)}.`
  );
  if (topIssue) {
    sentences.push(`The item most worth your attention: ${topIssue.title.toLowerCase()}. ${topIssue.suggestedAction}`);
  }
  if (apOver60 > 5000) {
    sentences.push(`${money(apOver60)} of payables sits past 60 days — prioritize it in the next payment run.`);
  }

  return (
    <div className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-50 shadow-glow">
          <Sparkles className="h-4 w-4 text-accent-500" />
        </span>
        <div>
          <div className="text-sm font-semibold text-ink">This week, in plain terms</div>
          <div className="text-2xs text-ink-subtle">Generated from your current financials</div>
        </div>
      </div>
      <div className="space-y-2.5 text-[13px] leading-relaxed text-ink-muted">
        {sentences.map((s, i) => (
          <p key={i}>{s}</p>
        ))}
      </div>
    </div>
  );
}
