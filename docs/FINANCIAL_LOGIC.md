# CommandIQ — Financial Calculation Logic

Every number CommandIQ displays is **derived deterministically** from the
normalized financial layer (`src/lib/finance/*`). There are no stored
aggregates and no hidden fudge factors. This document is the reference for how
each figure is computed. All logic is unit-tested in `tests/finance.test.ts`.

> Reference date for the demo workspace (Torches NYC): **2026-08-20**.
> `bookCash = $452,000`, `monthlyGoal = $1,000,000`, `reserve = $75,000`.

---

## 1. Revenue Pace

```
daysElapsed        = day-of-month(referenceDate)
daysInMonth        = calendar days in the month
revenueMTD         = Σ daily revenue
currentDailyAvg    = revenueMTD / daysElapsed
goalPaceToDate     = (monthlyGoal / daysInMonth) × daysElapsed
pacePct            = (revenueMTD − goalPaceToDate) / goalPaceToDate × 100
```

A positive `pacePct` means the business is ahead of the linear pace required to
hit the monthly goal by today.

## 2. Projected Month-End Revenue

```
projectedMonthEnd  = currentDailyAvg × daysInMonth
requiredDailyAvg   = max(0, monthlyGoal − revenueMTD) / (daysInMonth − daysElapsed)
```

`requiredDailyAvg` is what each remaining day must produce to still reach goal.

## 3. Gross Margin

```
grossProfit        = revenue − COGS
grossMarginPct     = grossProfit / revenue          (0–1)
```

Margin **trend** compares the current MTD margin to the prior full-month margin;
the delta in percentage points drives the compression alert.

## 4. Month-over-Month & Year-over-Year

```
momPct  = pctChange(revenueMTD, priorMonthSamePeriod)   // same day-count window
yoyPct  = pctChange(projectedMonthEnd, priorYearFullMonth)
pctChange(cur, prior) = (cur − prior) / |prior| × 100   // 100 if prior = 0
```

## 5. Expense Variance (Expense Watch)

For each category:

```
varianceAbs   = current − threeMonthAvg
variancePct   = pctChange(current, threeMonthAvg)
```

A category that **scales with revenue** (marketing, freight, fees, payroll) is
flagged when it grows materially faster than the top line:

```
outpacesRevenue = scaleWithRevenue
                  AND variancePct > 0
                  AND variancePct > revenueGrowthPct + (varianceThreshold × 100)

status: variancePct ≥ 2×threshold → critical
        variancePct ≥ threshold   → elevated
        variancePct ≥ threshold/2 → watch
        else                      → ok
```

`revenueGrowthPct = pctChange(projectedMonthEnd, lastCompleteMonthRevenue)`.
The headline flag ("growing N× faster than revenue") uses
`variancePct / revenueGrowthPct` when the ratio ≥ 1.5.

## 6. AP Aging

A bill's age is measured from its **due date** to the reference date and bucketed
by open `balance`:

```
overdue = daysBetween(due, referenceDate)
  ≤ 0    → Current
  1–30   → 1–30
  31–60  → 31–60
  61–90  → 61–90
  > 90   → 90+

pastDue = 1–30 + 31–60 + 61–90 + 90+
over60  = 61–90 + 90+
```

Per-vendor `daysOutstanding` is measured from the **oldest open invoice**.
`pctOfPurchases = trailingSpend / Σ trailingSpend × 100`.

**Vendor risk** is a points model (aging severity + days outstanding +
concentration + classification): `≥5 → high, ≥3 → medium, else low`.

## 7. Estimated Available Cash

```
committed30d       = Σ obligation amounts due within 30 days (recurrence-expanded)
estimatedAvailable = bookCash − committed30d − recommendedReserve
```

`bookCash` is the **QuickBooks Cash Balance** — an accounting figure, explicitly
**not** a live bank feed. Recurring obligations are expanded across the horizon:
a weekly obligation contributes each time it comes due inside 30 days.

`cashCoverageMonths = bookCash / committed30d`.

## 8. CommandIQ Score

A weighted 0–100 index of eight pillars. Each pillar maps a real metric to a
0–1 health band (`bandHealth(value, good, bad)` — linear, clamped), then:

```
score = round( Σ (weightᵢ × healthᵢ) / Σ weightᵢ × 100 )
```

| Pillar          | Weight | Health band (good → bad)                        |
|-----------------|:------:|-------------------------------------------------|
| Revenue pace    | 0.18   | pacePct: +2 → −12                               |
| Gross margin    | 0.16   | (margin − target) pts: +2 → −8                  |
| Liquidity       | 0.16   | available / reserve: 1.5 → −0.25                |
| AP aging        | 0.12   | past-due share: 0.05 → 0.40                     |
| AR aging        | 0.08   | past-due share: 0.10 → 0.45                     |
| Expense control | 0.12   | fastest scaling excess pts: 3 → 30              |
| Cash coverage   | 0.10   | months covered: 2.5 → 0.4                       |
| Payroll ratio   | 0.08   | (payroll − target) pts: −1 → 6                  |

Weights **sum to 1.00** and are configurable in `DEFAULT_SCORE_WEIGHTS`.

```
status:  ≥85 strong · ≥70 stable · ≥50 attention · else critical
```

**Drivers** are the pillars whose weighted deviation from neutral (0.70) is
largest, shown with a + / − and the underlying reason.

## 9. Vendor Priority (Payment Planner)

Each vendor earns a 0–1 priority from configurable weighted signals:

```
priority = Σ (signalᵢ × weightᵢ) / Σ weightᵢ

signals:
  aging          = balance-weighted lateness (later buckets weigh more)
  criticality    = class weight (strategic 1.0 … disputed 0.05)
  cod            = 1 if COD else 0
  concentration  = clamp(pctOfPurchases / 25, 0..1)
  risk           = high 1.0 / medium 0.55 / low 0.2
  manual         = class weight
```

Default weights: aging 0.28, criticality 0.20, cod 0.18, concentration 0.12,
risk 0.12, manual 0.10.

## 10. Payment Planner Recommendations

Vendors are sorted by priority and funded **greedily** from the cash pool,
capped at each outstanding balance:

```
for vendor in sortedByPriority:
    recommended = min(outstanding, remainingBudget)     // eligible only
    remainingBudget −= recommended
```

**Disputed** vendors are surfaced but never auto-allocated. The result is always
explainable (each allocation carries a plain-English reason) and advisory —
never presented as mandatory.

## 11. Find Me Savings

Ranks potential monthly savings from expense/vendor patterns toward a target,
each with a **confidence** (high / medium / review). Legitimate expenses are
never auto-classified as waste — output is framed as *potential opportunity /
review recommended*.

---

### Determinism & testing

All functions are pure and side-effect-free. `tests/finance.test.ts` verifies
pace, projection, aging buckets, recurrence expansion, available-cash math,
expense flagging, score bounds/weights, and the planner's budget/disputed
guarantees. Run with `npm test`.
