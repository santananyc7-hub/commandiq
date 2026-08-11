import { test } from "node:test";
import assert from "node:assert/strict";

import { computeRevenue } from "@/lib/finance/revenue";
import { ageBills, over60, pastDue, vendorMetrics } from "@/lib/finance/ap";
import { computeCash, committedWithin, occurrences } from "@/lib/finance/cash";
import { analyzeExpenses } from "@/lib/finance/expenses";
import { computeScore, DEFAULT_SCORE_WEIGHTS } from "@/lib/finance/score";
import { buildPaymentPlan } from "@/lib/finance/planner";
import { bandHealth, pctChange, daysBetween } from "@/lib/finance/util";
import { getFinancialState } from "@/lib/store";
import type { Bill, Obligation, Vendor, ExpenseCategory } from "@/lib/types";

// ── util ──────────────────────────────────────────────────────────────────
test("pctChange handles zero prior", () => {
  assert.equal(pctChange(10, 0), 100);
  assert.equal(pctChange(0, 0), 0);
  assert.equal(pctChange(110, 100), 10);
});

test("bandHealth clamps and interpolates", () => {
  assert.equal(bandHealth(5, 2, -12), 1); // above good
  assert.equal(bandHealth(-12, 2, -12), 0); // at bad
  assert.equal(bandHealth(-5, 2, -12), 0.5); // midpoint
});

test("daysBetween is UTC-stable", () => {
  assert.equal(daysBetween("2026-08-01", "2026-08-20"), 19);
  assert.equal(daysBetween("2026-08-20", "2026-08-01"), -19);
});

// ── revenue ─────────────────────────────────────────────────────────────
test("computeRevenue derives pace and projection deterministically", () => {
  const currentMonth = Array.from({ length: 20 }, (_, i) => ({
    date: `2026-08-${String(i + 1).padStart(2, "0")}`,
    revenue: 30_000,
    cogs: 17_000,
  }));
  const r = computeRevenue({
    referenceIso: "2026-08-20",
    monthlyGoal: 1_000_000,
    currentMonth,
    priorMonthSamePeriod: 555_000,
    priorYearFullMonth: 850_000,
    priorGrossMarginPct: 0.44,
  });
  assert.equal(r.revenueMTD, 600_000);
  assert.equal(r.currentDailyAverage, 30_000);
  assert.equal(r.projectedMonthEnd, 930_000); // 30k * 31
  assert.equal(r.daysElapsed, 20);
  assert.equal(r.daysInMonth, 31);
  // gross margin = (600k - 340k)/600k
  assert.ok(Math.abs(r.grossMarginPct - 260_000 / 600_000) < 1e-9);
  // required daily avg = (1,000,000 - 600,000) / 11
  assert.ok(Math.abs(r.requiredDailyAverage - 400_000 / 11) < 0.01);
});

// ── AP aging ──────────────────────────────────────────────────────────────
const REF = "2026-08-20";
const testBills: Bill[] = [
  { id: "1", vendorId: "a", issued: "2026-08-10", due: "2026-09-09", amount: 100, balance: 100, category: "x" }, // current
  { id: "2", vendorId: "a", issued: "2026-07-10", due: "2026-08-10", amount: 50, balance: 50, category: "x" }, // 10d
  { id: "3", vendorId: "b", issued: "2026-06-01", due: "2026-07-01", amount: 40, balance: 40, category: "x" }, // 50d
  { id: "4", vendorId: "b", issued: "2026-04-01", due: "2026-05-01", amount: 30, balance: 30, category: "x" }, // 111d
];

test("ageBills buckets by days past due", () => {
  const a = ageBills(testBills, REF);
  assert.equal(a.current, 100);
  assert.equal(a.d1_30, 50);
  assert.equal(a.d31_60, 40);
  assert.equal(a.d90plus, 30);
  assert.equal(a.total, 220);
  assert.equal(pastDue(a), 120);
  assert.equal(over60(a), 30);
});

test("vendorMetrics computes concentration and oldest invoice", () => {
  const vendors: Vendor[] = [
    { id: "a", name: "A", category: "x", classification: "standard", trailingSpend: 300, lastPayment: null },
    { id: "b", name: "B", category: "x", classification: "standard", trailingSpend: 100, lastPayment: null },
  ];
  const m = vendorMetrics(vendors, testBills, REF);
  const a = m.find((x) => x.vendorId === "a")!;
  const b = m.find((x) => x.vendorId === "b")!;
  assert.equal(a.outstanding, 150);
  assert.equal(b.outstanding, 70);
  assert.equal(a.pctOfPurchases, 75); // 300/400
  assert.equal(b.oldestInvoice, "2026-04-01");
});

// ── cash ────────────────────────────────────────────────────────────────
test("occurrences expands recurrence within horizon", () => {
  const weekly: Obligation = {
    id: "o", name: "Payroll", counterparty: "x", amount: 100, dueDate: "2026-08-22",
    recurrence: "weekly", category: "Payroll", priority: "essential", active: true,
  };
  const occ = occurrences(weekly, REF, 30);
  // Aug 22 (+2), +9, +16, +23, +30
  assert.deepEqual(occ, [2, 9, 16, 23, 30]);
});

test("computeCash subtracts commitments and reserve", () => {
  const obligations: Obligation[] = [
    { id: "r", name: "Rent", counterparty: "x", amount: 10_000, dueDate: "2026-09-01", recurrence: "monthly", category: "Rent", priority: "essential", active: true },
    { id: "p", name: "Paused", counterparty: "x", amount: 99_999, dueDate: "2026-08-25", recurrence: "monthly", category: "x", priority: "flexible", active: false },
  ];
  const committed = committedWithin(obligations, REF, 30);
  assert.equal(committed, 10_000); // paused excluded
  const cash = computeCash({ bookCash: 100_000, obligations, recommendedReserve: 25_000, referenceIso: REF });
  assert.equal(cash.estimatedAvailable, 65_000);
});

// ── expenses ────────────────────────────────────────────────────────────
test("analyzeExpenses flags categories outgrowing revenue", () => {
  const cats: ExpenseCategory[] = [
    { id: "e-marketing", name: "Marketing", current: 41_300, prior: 33_800, threeMonthAvg: 30_800, scaleWithRevenue: true },
    { id: "e-rent", name: "Rent", current: 38_000, prior: 38_000, threeMonthAvg: 38_000, scaleWithRevenue: false },
  ];
  const rows = analyzeExpenses(cats, 7.2, 0.2);
  const mk = rows.find((r) => r.id === "e-marketing")!;
  assert.ok(mk.variancePct > 33 && mk.variancePct < 35);
  assert.ok(mk.flag && mk.flag.includes("faster than revenue"));
  const rent = rows.find((r) => r.id === "e-rent")!;
  assert.equal(rent.variancePct, 0);
  assert.equal(rent.status, "ok");
});

// ── score ─────────────────────────────────────────────────────────────────
test("computeScore is bounded and weighted", () => {
  const perfect = computeScore(
    {
      pacePct: 10, grossMarginPct: 0.5, grossMarginTarget: 0.45, estimatedAvailable: 200_000,
      reserveTarget: 75_000, apPastDueShare: 0, arPastDueShare: 0, expenseExcessPct: 0,
      cashCoverageMonths: 4, payrollShare: 0.1, payrollTarget: 0.12,
    },
    DEFAULT_SCORE_WEIGHTS
  );
  assert.equal(perfect.score, 100);
  assert.equal(perfect.status, "strong");

  const weights = Object.values(DEFAULT_SCORE_WEIGHTS).reduce((s, w) => s + w, 0);
  assert.ok(Math.abs(weights - 1) < 1e-9, "weights sum to 1");
});

// ── planner ─────────────────────────────────────────────────────────────
test("buildPaymentPlan never exceeds budget and skips disputed", () => {
  const vendors: Vendor[] = [
    { id: "a", name: "A", category: "x", classification: "strategic", trailingSpend: 100, lastPayment: null },
    { id: "d", name: "D", category: "x", classification: "disputed", trailingSpend: 50, lastPayment: null },
  ];
  const metrics = new Map(
    vendorMetrics(vendors, [
      { id: "1", vendorId: "a", issued: "2026-06-01", due: "2026-07-01", amount: 30_000, balance: 30_000, category: "x" },
      { id: "2", vendorId: "d", issued: "2026-06-01", due: "2026-07-01", amount: 20_000, balance: 20_000, category: "x" },
    ], REF).map((m) => [m.vendorId, m])
  );
  const plan = buildPaymentPlan(25_000, vendors, metrics);
  assert.ok(plan.allocated <= 25_000);
  const disputed = plan.allocations.find((x) => x.vendorId === "d")!;
  assert.equal(disputed.recommended, 0, "disputed vendors are never auto-allocated");
});

// ── integration: full demo state is internally consistent ──────────────────
test("demo financial state is coherent", () => {
  const s = getFinancialState();
  assert.equal(s.revenue.revenueMTD, 652_000);
  assert.ok(s.score.score >= 0 && s.score.score <= 100);
  assert.equal(s.aging.total, 312_400);
  // Available = book - committed - reserve
  assert.equal(
    s.cash.estimatedAvailable,
    Math.round((s.cash.bookCash - s.cash.committed30d - s.cash.recommendedReserve) * 100) / 100
  );
  // KPI strip is fully populated
  assert.equal(s.kpis.length, 8);
});
