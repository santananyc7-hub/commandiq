import type {
  ActionItem,
  Bill,
  ExpenseCategory,
  Obligation,
  Organization,
  QuickBooksConnection,
  Targets,
  User,
  Vendor,
} from "@/lib/types";

/**
 * Seeded demo workspace — Torches NYC, operated by Polanco Brothers Corp (§24).
 *
 * Every figure here is a raw input. CommandIQ derives all dashboard numbers
 * from these in code (see src/lib/finance/*) so the demo is fully reproducible
 * and clearly separated from live QuickBooks data. Nothing here is a stored
 * aggregate the UI displays directly.
 *
 * Anchored to a fixed "today" so relative dates and month-to-date rollups are
 * deterministic across server renders.
 */
export const REFERENCE_DATE = "2026-08-20";
export const ORG_ID = "org-torches";

export const organization: Organization = {
  id: ORG_ID,
  name: "Torches NYC",
  legalName: "Polanco Brothers Corp",
  industry: "Multi-location Retail",
  initials: "TN",
};

export const currentUser: User = {
  id: "u-owner",
  name: "Rafael Polanco",
  email: "rafael@torchesnyc.com",
  role: "owner",
  initials: "RP",
};

export const team: User[] = [
  currentUser,
  {
    id: "u-finance",
    name: "Dana Whitmore",
    email: "dana@torchesnyc.com",
    role: "finance",
    initials: "DW",
  },
  {
    id: "u-manager",
    name: "Marcus Lee",
    email: "marcus@torchesnyc.com",
    role: "manager",
    initials: "ML",
  },
  {
    id: "u-viewer",
    name: "Elena Cruz",
    email: "elena@torchesnyc.com",
    role: "viewer",
    initials: "EC",
  },
];

// ── Targets / business rules (§19) ────────────────────────────────────────
export const defaultTargets: Targets = {
  monthlyRevenueGoal: 1_000_000,
  cashReserve: 75_000,
  payrollPct: 0.12,
  marketingPct: 0.05,
  grossMarginPct: 0.45,
  apAgingDays: 30,
  expenseVariancePct: 0.2,
};

// ── Cash inputs (§7) ──────────────────────────────────────────────────────
/** QuickBooks book cash — accounting balance, not a live bank feed. */
export const bookCash = 452_000;
export const cashSource = "QuickBooks Cash Balance";

/** Minimal AR for a mostly-cash retail business (§5 AR pillar). */
export const arTotal = 48_000;
export const arPastDue = 5_760;

/** Monthly payroll run-rate, used by the score's payroll pillar (§5). */
export const payrollMonthly = 129_000;

// ── Revenue: current month daily series (Aug 1–20, 2026) ──────────────────
// Retail rhythm — weekends peak. Sums to $652,000 MTD at a 43.3% gross margin.
const AUG_DAILY = [
  30.2, 36.5, 34.1, 28.6, 29.4, 30.1, 31.8, 37.2, 35.0, 29.1, 30.4, 31.2, 32.6,
  37.9, 38.3, 32.6, 29.8, 30.9, 31.4, 34.9,
];
const CURRENT_MARGIN = 0.433;

export const currentMonthDaily = AUG_DAILY.map((k, i) => {
  const revenue = Math.round(k * 1000);
  return {
    date: `2026-08-${String(i + 1).padStart(2, "0")}`,
    revenue,
    cogs: Math.round(revenue * (1 - CURRENT_MARGIN)),
  };
});

/** Same 20-day window one month prior — drives MoM (+8.2%). */
export const priorMonthSamePeriod = 602_588;
/** Latest complete month (July 2026) — expense growth baseline. */
export const lastCompleteMonthRevenue = 942_000;
/** Full month one year prior (Aug 2025) — drives YoY. */
export const priorYearFullMonth = 902_000;
/** Prior full-month gross margin — current 43.3% is a 1.8pt compression. */
export const priorGrossMarginPct = 0.451;

// ── Monthly history for trend charts (§23) ────────────────────────────────
export interface MonthPoint {
  month: string; // "YYYY-MM"
  revenue: number;
  grossProfit: number;
}
const RAW_MONTHS: [string, number, number][] = [
  ["2025-08", 902_000, 0.452],
  ["2025-09", 848_000, 0.449],
  ["2025-10", 889_000, 0.455],
  ["2025-11", 934_000, 0.458],
  ["2025-12", 1_005_000, 0.461],
  ["2026-01", 812_000, 0.447],
  ["2026-02", 798_000, 0.444],
  ["2026-03", 865_000, 0.449],
  ["2026-04", 902_000, 0.452],
  ["2026-05", 948_000, 0.455],
  ["2026-06", 971_000, 0.451],
  ["2026-07", 942_000, 0.451],
];
export const monthlyHistory: MonthPoint[] = RAW_MONTHS.map(([month, rev, m]) => ({
  month,
  revenue: rev,
  grossProfit: Math.round(rev * m),
}));

// ── Expense categories (§12) ──────────────────────────────────────────────
export const expenseCategories: ExpenseCategory[] = [
  { id: "e-payroll", name: "Payroll", current: 129_000, prior: 121_500, threeMonthAvg: 122_800, scaleWithRevenue: true },
  { id: "e-marketing", name: "Marketing", current: 41_300, prior: 33_800, threeMonthAvg: 30_800, scaleWithRevenue: true },
  { id: "e-rent", name: "Rent & Occupancy", current: 38_000, prior: 38_000, threeMonthAvg: 38_000, scaleWithRevenue: false },
  { id: "e-cogs-freight", name: "Freight & Logistics", current: 22_600, prior: 20_400, threeMonthAvg: 19_900, scaleWithRevenue: true },
  { id: "e-software", name: "Software & Subscriptions", current: 12_400, prior: 9_900, threeMonthAvg: 9_600, scaleWithRevenue: false },
  { id: "e-prof", name: "Professional Services", current: 18_700, prior: 8_200, threeMonthAvg: 9_100, scaleWithRevenue: false },
  { id: "e-fees", name: "Merchant & Processing", current: 14_300, prior: 13_200, threeMonthAvg: 13_000, scaleWithRevenue: true },
  { id: "e-utilities", name: "Utilities", current: 7_600, prior: 7_100, threeMonthAvg: 7_300, scaleWithRevenue: false },
  { id: "e-insurance", name: "Insurance", current: 9_200, prior: 9_200, threeMonthAvg: 9_200, scaleWithRevenue: false },
  { id: "e-repairs", name: "Repairs & Maintenance", current: 5_400, prior: 3_100, threeMonthAvg: 3_600, scaleWithRevenue: false },
  { id: "e-security", name: "Security", current: 6_800, prior: 6_800, threeMonthAvg: 6_800, scaleWithRevenue: false },
];

// ── Vendors (§9) ──────────────────────────────────────────────────────────
export const vendors: Vendor[] = [
  { id: "v-hudson", name: "Hudson Wellness Distribution", category: "Inventory", classification: "strategic", trailingSpend: 214_000, lastPayment: "2026-08-02", notes: "Primary supplier — 40% of core catalog. On an informal net-30 rhythm." },
  { id: "v-cortez", name: "Cortez Wholesale", category: "Inventory", classification: "standard", trailingSpend: 128_000, lastPayment: "2026-07-19" },
  { id: "v-grandview", name: "Grandview Supply", category: "Inventory", classification: "critical", trailingSpend: 96_000, lastPayment: "2026-08-06" },
  { id: "v-coastal", name: "Coastal Freight", category: "Logistics", classification: "standard", trailingSpend: 88_000, lastPayment: "2026-08-01" },
  { id: "v-metro", name: "Metro Packaging Co", category: "Packaging", classification: "standard", trailingSpend: 76_000, lastPayment: "2026-07-28" },
  { id: "v-apex", name: "Apex Logistics", category: "Logistics", classification: "standard", trailingSpend: 64_000, lastPayment: "2026-08-04" },
  { id: "v-sterling", name: "Sterling Media Group", category: "Marketing", classification: "standard", trailingSpend: 58_000, lastPayment: "2026-07-30" },
  { id: "v-northline", name: "Northline Beverage", category: "Inventory", classification: "cod", trailingSpend: 44_000, lastPayment: "2026-08-15", notes: "COD terms — no credit line extended." },
  { id: "v-ironclad", name: "Ironclad Security", category: "Security", classification: "standard", trailingSpend: 19_000, lastPayment: "2026-08-01" },
  { id: "v-pinnacle", name: "Pinnacle Professional Services", category: "Professional Services", classification: "disputed", trailingSpend: 22_000, lastPayment: "2026-05-11", notes: "Two invoices disputed — scope not delivered. Hold pending review." },
  { id: "v-brightpath", name: "BrightPath Software", category: "Software", classification: "standard", trailingSpend: 15_000, lastPayment: "2026-08-01" },
];

// ── Bills (open AP) — total $312,400 across the aging buckets ──────────────
export const bills: Bill[] = [
  // Current (not yet due)
  { id: "b-1", vendorId: "v-hudson", issued: "2026-08-10", due: "2026-09-09", amount: 46_000, balance: 46_000, category: "Inventory" },
  { id: "b-2", vendorId: "v-hudson", issued: "2026-08-16", due: "2026-09-15", amount: 32_900, balance: 32_900, category: "Inventory" },
  { id: "b-3", vendorId: "v-grandview", issued: "2026-08-12", due: "2026-09-11", amount: 28_000, balance: 28_000, category: "Inventory" },
  { id: "b-4", vendorId: "v-cortez", issued: "2026-08-08", due: "2026-09-07", amount: 33_000, balance: 33_000, category: "Inventory" },
  { id: "b-5", vendorId: "v-metro", issued: "2026-08-14", due: "2026-09-13", amount: 21_000, balance: 21_000, category: "Packaging" },
  { id: "b-6", vendorId: "v-apex", issued: "2026-08-05", due: "2026-09-04", amount: 18_400, balance: 18_400, category: "Logistics" },
  { id: "b-7", vendorId: "v-coastal", issued: "2026-08-11", due: "2026-09-10", amount: 24_000, balance: 24_000, category: "Logistics" },
  { id: "b-8", vendorId: "v-brightpath", issued: "2026-08-01", due: "2026-08-31", amount: 6_900, balance: 6_900, category: "Software" },
  { id: "b-9", vendorId: "v-ironclad", issued: "2026-08-01", due: "2026-08-31", amount: 12_500, balance: 12_500, category: "Security" },
  { id: "b-10", vendorId: "v-sterling", issued: "2026-08-15", due: "2026-09-14", amount: 14_700, balance: 14_700, category: "Marketing" },
  { id: "b-11", vendorId: "v-northline", issued: "2026-08-18", due: "2026-08-25", amount: 8_600, balance: 8_600, category: "Inventory" },
  // 1–30 overdue
  { id: "b-12", vendorId: "v-metro", issued: "2026-07-18", due: "2026-08-17", amount: 6_000, balance: 6_000, category: "Packaging" },
  { id: "b-13", vendorId: "v-apex", issued: "2026-07-15", due: "2026-08-14", amount: 4_000, balance: 4_000, category: "Logistics" },
  { id: "b-14", vendorId: "v-cortez", issued: "2026-07-20", due: "2026-08-12", amount: 15_300, balance: 15_300, category: "Inventory" },
  { id: "b-15", vendorId: "v-coastal", issued: "2026-07-25", due: "2026-08-08", amount: 5_100, balance: 5_100, category: "Logistics" },
  // 31–60 overdue
  { id: "b-16", vendorId: "v-grandview", issued: "2026-06-05", due: "2026-07-05", amount: 5_000, balance: 5_000, category: "Inventory" },
  { id: "b-17", vendorId: "v-sterling", issued: "2026-06-10", due: "2026-07-10", amount: 7_000, balance: 7_000, category: "Marketing" },
  // 61–90 overdue
  { id: "b-18", vendorId: "v-pinnacle", issued: "2026-05-10", due: "2026-06-09", amount: 8_000, balance: 8_000, category: "Professional Services", memo: "Disputed — scope not delivered." },
  // 90+ overdue
  { id: "b-19", vendorId: "v-cortez", issued: "2026-04-15", due: "2026-05-15", amount: 9_000, balance: 9_000, category: "Inventory" },
  { id: "b-20", vendorId: "v-pinnacle", issued: "2026-03-20", due: "2026-04-19", amount: 7_000, balance: 7_000, category: "Professional Services", memo: "Disputed — under review." },
];

// ── Manual obligations (§8) ───────────────────────────────────────────────
export const obligations: Obligation[] = [
  { id: "o-payroll", name: "Store Payroll", counterparty: "Polanco Brothers Corp", amount: 32_000, dueDate: "2026-08-22", recurrence: "weekly", category: "Payroll", priority: "essential", active: true, notes: "Bi-store payroll run, every Friday." },
  { id: "o-rent", name: "Flagship Lease", counterparty: "Delancey Holdings LLC", amount: 38_000, dueDate: "2026-09-01", recurrence: "monthly", category: "Rent", priority: "essential", active: true },
  { id: "o-tax", name: "Sales Tax Reserve", counterparty: "NYS Dept. of Taxation", amount: 22_000, dueDate: "2026-08-28", recurrence: "monthly", category: "Tax", priority: "essential", active: true },
  { id: "o-hudson", name: "Hudson Wellness Payment Plan", counterparty: "Hudson Wellness Distribution", amount: 25_000, dueDate: "2026-08-30", recurrence: "monthly", category: "Vendor", priority: "important", active: true, notes: "Agreed catch-up schedule on prior balance." },
  { id: "o-debt", name: "Equipment Term Loan", counterparty: "Meridian Capital", amount: 14_500, dueDate: "2026-09-05", recurrence: "monthly", category: "Debt", priority: "important", active: true },
  { id: "o-insurance", name: "General Liability Insurance", counterparty: "Hartwell Insurance", amount: 9_200, dueDate: "2026-09-03", recurrence: "monthly", category: "Insurance", priority: "important", active: true },
  { id: "o-equip", name: "POS & Fixtures Finance", counterparty: "LeaseCorp", amount: 6_300, dueDate: "2026-09-10", recurrence: "monthly", category: "Equipment", priority: "flexible", active: true },
  { id: "o-security", name: "Security Contract", counterparty: "Ironclad Security", amount: 6_800, dueDate: "2026-09-01", recurrence: "monthly", category: "Security", priority: "important", active: true },
];

// ── Seeded action items (§14) ─────────────────────────────────────────────
export const seededActions: ActionItem[] = [
  { id: "a-1", issue: "Payroll running above target", owner: "Marcus Lee", recommendedAction: "Review overtime and weekend coverage across both stores.", impact: 2_100, impactCadence: "week", due: "2026-08-22", status: "in_progress", source: "alert", createdAt: "2026-08-15" },
  { id: "a-2", issue: "Marketing spend accelerating", owner: "Dana Whitmore", recommendedAction: "Pause the two lowest-ROAS campaigns pending a spend review.", impact: 10_500, impactCadence: "month", due: "2026-08-25", status: "open", source: "alert", createdAt: "2026-08-18" },
  { id: "a-3", issue: "Pinnacle invoices disputed", owner: "Dana Whitmore", recommendedAction: "Send formal dispute letter; withhold the $15,000 balance.", impact: 15_000, impactCadence: "one_time", due: "2026-08-21", status: "waiting", source: "manual", createdAt: "2026-08-12" },
  { id: "a-4", issue: "Cortez 90+ day balance", owner: "Rafael Polanco", recommendedAction: "Negotiate a short payment plan on the aged $9,000 invoice.", impact: 9_000, impactCadence: "one_time", due: null, status: "open", source: "alert", createdAt: "2026-08-19" },
];

// ── QuickBooks connection (§17) ───────────────────────────────────────────
/**
 * Demo mode presents QuickBooks as connected with a recent sync so the whole
 * product is explorable. A real OAuth handshake (see the integration layer)
 * replaces this when credentials are configured.
 */
export const quickBooksDemo: QuickBooksConnection = {
  status: "connected",
  realmId: "demo-4620816365272",
  companyName: "Torches NYC — Polanco Brothers Corp",
  lastSync: "2026-08-20T13:42:00Z",
  lastError: null,
  entities: [
    { name: "Chart of Accounts", count: 214, lastSync: "2026-08-20T13:42:00Z" },
    { name: "Vendors", count: 11, lastSync: "2026-08-20T13:42:00Z" },
    { name: "Bills", count: 20, lastSync: "2026-08-20T13:42:00Z" },
    { name: "Bill Payments", count: 63, lastSync: "2026-08-20T13:42:00Z" },
    { name: "Invoices", count: 8, lastSync: "2026-08-20T13:42:00Z" },
    { name: "P&L (monthly)", count: 13, lastSync: "2026-08-20T13:42:00Z" },
    { name: "Balance Sheet", count: 1, lastSync: "2026-08-20T13:42:00Z" },
  ],
};

export const DEMO_MODE = true;
