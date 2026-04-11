import type { ComponentType } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  ShieldAlert,
  FlaskConical,
  Sparkles,
  List,
} from "lucide-react";

/** Mirrors live `Sidebar` — hrefs prefixed with /mock. */
export const MOCK_PREFIX = "/mock" as const;

export type MockNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export const mockPrimaryNavItems: readonly MockNavItem[] = [
  { href: "/mock/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mock/backtesting", label: "Backtesting", icon: FlaskConical },
  { href: "/mock/journal", label: "Journal", icon: TrendingUp },
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
  { href: "/mock/journal", label: "Journal", icon: TrendingUp },
  { href: "/mock/journal/trades", label: "Trades", icon: List },
  { href: "/mock/risk-manager", label: "Risk Manager", icon: ShieldAlert },
  { href: "/mock/ai-coach", label: "AI Coach", icon: Sparkles },
];
