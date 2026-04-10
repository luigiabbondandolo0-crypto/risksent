import type { ComponentType } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  ShieldAlert,
  FlaskConical,
} from "lucide-react";

/** Mirrors live `Sidebar` groups — hrefs prefixed with /mock. */
export const MOCK_PREFIX = "/mock" as const;

export type MockNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export const mockPrimaryNavItems: readonly MockNavItem[] = [
  { href: "/mock/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mock/simulator", label: "Backtesting", icon: FlaskConical },
  { href: "/mock/trades", label: "Journal", icon: TrendingUp },
  { href: "/mock/rules", label: "Risk Sentinel", icon: ShieldAlert },
];

export const mockAccountNavItems: readonly MockNavItem[] = [];

export const mockMonitoringNavItems: readonly MockNavItem[] = [];

export const mockAdminNavItems: readonly MockNavItem[] = [];

export const mockMobileNavItems: readonly MockNavItem[] = [
  ...mockPrimaryNavItems,
];
