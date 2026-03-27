import type { ComponentType } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  ShieldAlert,
  FlaskConical,
  Bot,
  PlusCircle,
  CreditCard,
  Shield,
  Activity,
  User,
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
  { href: "/mock/trades", label: "Trades", icon: TrendingUp },
  { href: "/mock/rules", label: "Rules & alerts", icon: ShieldAlert },
  { href: "/mock/simulator", label: "Simulator", icon: FlaskConical },
  { href: "/mock/ai-coach", label: "AI Coach", icon: Bot },
];

export const mockAccountNavItems: readonly MockNavItem[] = [
  { href: "/mock/accounts", label: "Accounts", icon: CreditCard },
  { href: "/mock/add-account", label: "Add account", icon: PlusCircle },
];

export const mockMonitoringNavItems: readonly MockNavItem[] = [
  { href: "/mock/live-monitoring", label: "Live monitoring", icon: Activity },
];

export const mockAdminNavItems: readonly MockNavItem[] = [
  { href: "/mock/admin", label: "Admin", icon: Shield },
];

const mockProfileItem: MockNavItem = {
  href: "/mock/profile",
  label: "Profile",
  icon: User,
};

export const mockMobileNavItems: readonly MockNavItem[] = [
  ...mockPrimaryNavItems,
  ...mockAccountNavItems,
  mockProfileItem,
  ...mockMonitoringNavItems,
  ...mockAdminNavItems,
];
