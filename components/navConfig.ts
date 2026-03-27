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

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export const primaryNavItems: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trades", label: "Trades", icon: TrendingUp },
  { href: "/rules", label: "Rules & alerts", icon: ShieldAlert },
  { href: "/simulator", label: "Simulator", icon: FlaskConical },
  { href: "/ai-coach", label: "AI Coach", icon: Bot },
] as const;

export const accountNavItems: readonly NavItem[] = [
  { href: "/accounts", label: "Accounts", icon: CreditCard },
  { href: "/add-account", label: "Add account", icon: PlusCircle },
] as const;

export const monitoringNavItems: readonly NavItem[] = [
  { href: "/live-monitoring", label: "Live monitoring", icon: Activity },
] as const;

export const adminNavItems: readonly NavItem[] = [
  { href: "/admin", label: "Admin", icon: Shield },
] as const;

/** Admin-only sidebar (under /admin layout). */
export const adminOnlySidebarItems: readonly NavItem[] = [
  { href: "/admin", label: "Admin", icon: Shield },
  { href: "/admin/live-monitoring", label: "Live monitoring", icon: Activity },
] as const;

const profileNavItem: NavItem = {
  href: "/profile",
  label: "Profile",
  icon: User,
};

/** Horizontal scroll nav on small screens (full app map). */
export const mobileNavItems: readonly NavItem[] = [
  ...primaryNavItems,
  ...accountNavItems,
  profileNavItem,
  ...monitoringNavItems,
  ...adminNavItems,
];

/** Routes that use the app shell (sidebar + padded main). */
export const APP_SHELL_PREFIXES = [
  "/dashboard",
  "/rules",
  "/trades",
  "/simulator",
  "/ai-coach",
  "/add-account",
  "/accounts",
  "/admin",
  "/live-monitoring",
  "/change-password",
  "/profile",
] as const;

export function isAppShellPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return APP_SHELL_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function isNavActive(pathname: string | null | undefined, href: string): boolean {
  if (!pathname) return false;
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
