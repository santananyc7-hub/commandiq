import {
  LayoutDashboard,
  Wallet,
  Building2,
  TrendingUp,
  Receipt,
  ClipboardCheck,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

/** Primary product navigation (§22, §29). */
export const NAV: NavItem[] = [
  { label: "Command Center", href: "/dashboard", icon: LayoutDashboard, description: "Executive overview" },
  { label: "Cash & Obligations", href: "/cash", icon: Wallet, description: "What you can safely use" },
  { label: "Vendors & AP", href: "/vendors", icon: Building2, description: "Aging, risk & payment planner" },
  { label: "Performance", href: "/performance", icon: TrendingUp, description: "Revenue & margin" },
  { label: "Expense Watch", href: "/expenses", icon: Receipt, description: "Where spend is accelerating" },
  { label: "Action Board", href: "/actions", icon: ClipboardCheck, description: "Insight → operational action" },
];

export const SETTINGS_ITEM: NavItem = {
  label: "Settings",
  href: "/settings",
  icon: Settings,
  description: "Targets, integrations & team",
};
