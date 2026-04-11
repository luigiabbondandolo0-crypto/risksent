import type { ComponentType } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  ShieldAlert,
  FlaskConical,
  Sparkles,
  Sun,
  CalendarDays,
  BarChart2,
} from "lucide-react";

/** Mirrors live `Sidebar` — hrefs prefixed with /mock. */
export const MOCK_PREFIX = "/mock" as const;

export type MockNavChild = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export type MockNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  children?: readonly MockNavChild[];
};

export const mockPrimaryNavItems: readonly MockNavItem[] = [
  { href: "/mock/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mock/backtesting", label: "Backtesting", icon: FlaskConical },
  {
    href: "/mock/journaling",
    label: "Journal",
    icon: TrendingUp,
    children: [
      { href: "/mock/journaling", label: "Today", icon: Sun },
      { href: "/mock/journaling?tab=calendar", label: "Calendar", icon: CalendarDays },
      { href: "/mock/journaling?tab=trades", label: "Trades", icon: BarChart2 },
    ],
  },
  { href: "/mock/risk-manager", label: "Risk Manager", icon: ShieldAlert },
  { href: "/mock/ai-coach", label: "AI Coach", icon: Sparkles },
];

export const mockAccountNavItems: readonly MockNavItem[] = [];

export const mockMonitoringNavItems: readonly MockNavItem[] = [];

export const mockAdminNavItems: readonly MockNavItem[] = [];

/** Flattened for the horizontal mobile strip (includes Journal → Trades). */
export const mockMobileNavItems: readonly MockNavItem[] = [
  { href: "/mock/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mock/backtesting", label: "Backtesting", icon: FlaskConical },
  { href: "/mock/journaling", label: "Journal", icon: TrendingUp },
  { href: "/mock/journaling?tab=trades", label: "Trades", icon: BarChart2 },
  { href: "/mock/risk-manager", label: "Risk Manager", icon: ShieldAlert },
  { href: "/mock/ai-coach", label: "AI Coach", icon: Sparkles },
];
