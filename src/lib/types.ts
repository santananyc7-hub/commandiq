/**
 * CommandIQ domain model (§18).
 *
 * These types describe the normalized financial layer CommandIQ operates on.
 * QuickBooks entities are mapped into these shapes by the integration layer so
 * every downstream calculation is source-agnostic and deterministic.
 */

export type Role = "owner" | "finance" | "manager" | "viewer";

export interface Organization {
  id: string;
  name: string;
  legalName: string;
  industry: string;
  /** Two-letter avatar mark. */
  initials: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
}

// ── Targets & business rules (§19) ────────────────────────────────────────
export interface Targets {
  monthlyRevenueGoal: number;
  cashReserve: number;
  /** Payroll as a share of revenue, e.g. 0.12 = 12%. */
  payrollPct: number;
  marketingPct: number;
  grossMarginPct: number;
  /** AP is "aged" past this many days for risk purposes. */
  apAgingDays: number;
  /** Expense category variance that trips a warning, e.g. 0.2 = 20%. */
  expenseVariancePct: number;
}

// ── Score model (§5) ──────────────────────────────────────────────────────
export type ScoreStatus = "strong" | "stable" | "attention" | "critical";

export interface ScoreDriver {
  label: string;
  /** Signed contribution to the score, in points. */
  delta: number;
  direction: "positive" | "negative";
  detail: string;
}

export interface CommandScore {
  score: number; // 0–100
  status: ScoreStatus;
  headline: string;
  drivers: ScoreDriver[];
  /** Per-pillar breakdown for the documented model. */
  pillars: ScorePillar[];
}

export interface ScorePillar {
  key: string;
  label: string;
  weight: number; // 0–1
  /** Normalized pillar health, 0–1. */
  health: number;
  /** Weighted points contributed to the 0–100 score. */
  points: number;
  note: string;
}

// ── Revenue & margin (§11) ────────────────────────────────────────────────
export interface DailyRevenue {
  date: string; // ISO
  revenue: number;
  cogs: number;
}

export interface RevenuePerformance {
  monthlyGoal: number;
  revenueMTD: number;
  projectedMonthEnd: number;
  requiredDailyAverage: number;
  currentDailyAverage: number;
  pacePct: number; // + ahead / − behind vs. goal pace to date
  grossProfitMTD: number;
  grossMarginPct: number;
  grossMarginPriorPct: number;
  momPct: number;
  yoyPct: number;
  daysElapsed: number;
  daysInMonth: number;
}

// ── Vendors / AP (§9, §10) ────────────────────────────────────────────────
export type VendorClass =
  | "strategic"
  | "critical"
  | "standard"
  | "low"
  | "disputed"
  | "cod"
  | "payment_plan";

export const VENDOR_CLASS_LABELS: Record<VendorClass, string> = {
  strategic: "Strategic",
  critical: "Critical",
  standard: "Standard",
  low: "Low Priority",
  disputed: "Disputed",
  cod: "COD",
  payment_plan: "Payment Plan",
};

export type RiskLevel = "low" | "medium" | "high";

export interface Bill {
  id: string;
  vendorId: string;
  issued: string; // ISO
  due: string; // ISO
  amount: number;
  /** Remaining open balance on the bill. */
  balance: number;
  category: string;
  memo?: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  classification: VendorClass;
  /** Trailing-90-day purchases. */
  trailingSpend: number;
  lastPayment: string | null; // ISO
  notes?: string;
}

export interface VendorMetric {
  vendorId: string;
  outstanding: number;
  oldestInvoice: string | null; // ISO
  daysOutstanding: number;
  trailingSpend: number;
  pctOfPurchases: number;
  risk: RiskLevel;
  /** Aging buckets against the reference date. */
  aging: ApAging;
}

export interface ApAging {
  current: number;
  d1_30: number;
  d31_60: number;
  d61_90: number;
  d90plus: number;
  total: number;
}

export interface PaymentAllocation {
  vendorId: string;
  vendorName: string;
  balance: number;
  recommended: number;
  classification: VendorClass;
  reason: string;
  /** Internal priority score used to rank the allocation. */
  priority: number;
}

export interface PaymentPlan {
  budget: number;
  allocations: PaymentAllocation[];
  allocated: number;
  remaining: number;
}

// ── Cash & obligations (§7, §8) ───────────────────────────────────────────
export type Recurrence =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annual"
  | "one_time";

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
  one_time: "One-time",
};

export type ObligationPriority = "essential" | "important" | "flexible";

export interface Obligation {
  id: string;
  name: string;
  counterparty: string;
  amount: number;
  dueDate: string; // ISO — next due date
  recurrence: Recurrence;
  category: string;
  priority: ObligationPriority;
  notes?: string;
  active: boolean;
  endDate?: string | null;
}

export interface CashPosition {
  bookCash: number;
  committed30d: number;
  recommendedReserve: number;
  estimatedAvailable: number;
  source: string;
  asOf: string; // ISO
}

// ── Expenses (§12) ────────────────────────────────────────────────────────
export type ExpenseStatus = "ok" | "watch" | "elevated" | "critical";

export interface ExpenseCategory {
  id: string;
  name: string;
  current: number;
  prior: number;
  threeMonthAvg: number;
  /** Whether the category should be compared against revenue growth. */
  scaleWithRevenue: boolean;
}

export interface ExpenseRow {
  id: string;
  name: string;
  current: number;
  prior: number;
  threeMonthAvg: number;
  varianceAbs: number;
  variancePct: number;
  revenueGrowthPct: number;
  status: ExpenseStatus;
  flag?: string;
}

// ── Attention feed / alerts (§6) ──────────────────────────────────────────
export type Severity = "critical" | "high" | "watch" | "positive";

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  watch: 2,
  positive: 3,
};

export const SEVERITY_META: Record<
  Severity,
  { label: string; token: string }
> = {
  critical: { label: "Critical", token: "critical" },
  high: { label: "High", token: "high" },
  watch: { label: "Watch", token: "watch" },
  positive: { label: "Positive", token: "positive" },
};

export type AlertStatus = "open" | "snoozed" | "dismissed" | "actioned";

export interface Alert {
  id: string;
  title: string;
  detail: string;
  reason: string;
  severity: Severity;
  /** Estimated financial impact, in dollars (magnitude). */
  impact: number;
  impactCadence: "week" | "month" | "one_time";
  suggestedAction: string;
  owner?: string;
  module: string;
  href: string;
  status: AlertStatus;
}

// ── Action board (§14) ────────────────────────────────────────────────────
export type ActionStatus = "open" | "in_progress" | "waiting" | "resolved";

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting: "Waiting",
  resolved: "Resolved",
};

export type ActionSource = "manual" | "alert" | "ai";

export interface ActionItem {
  id: string;
  issue: string;
  owner: string;
  recommendedAction: string;
  impact: number;
  impactCadence: "week" | "month" | "one_time";
  due: string | null; // ISO
  status: ActionStatus;
  source: ActionSource;
  createdAt: string; // ISO
}

// ── What changed (§13) ────────────────────────────────────────────────────
export interface ChangeItem {
  label: string;
  detail: string;
  direction: "positive" | "negative" | "neutral";
  /** Ranking weight (magnitude of materiality). */
  magnitude: number;
}

// ── Find me savings (§16) ─────────────────────────────────────────────────
export type Confidence = "high" | "medium" | "review";

export interface SavingsOpportunity {
  id: string;
  area: string;
  title: string;
  monthly: number;
  confidence: Confidence;
  rationale: string;
}

// ── Integration (§17) ─────────────────────────────────────────────────────
export type SyncStatus = "connected" | "syncing" | "error" | "disconnected";

export interface QuickBooksConnection {
  status: SyncStatus;
  realmId: string | null;
  companyName: string | null;
  lastSync: string | null; // ISO
  lastError: string | null;
  entities: { name: string; count: number; lastSync: string | null }[];
}
