import type { ComponentType } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  ShieldAlert,
  FlaskConical,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export const primaryNavItems: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/backtesting", label: "Backtesting", icon: FlaskConical },
  { href: "/trades", label: "Journal", icon: TrendingUp },
  { href: "/rules", label: "Risk Sentinel", icon: ShieldAlert },
];

export const accountNavItems: readonly NavItem[] = [];

export const monitoringNavItems: readonly NavItem[] = [];

export const adminNavItems: readonly NavItem[] = [];

/** Admin-only sidebar (under /admin layout). */
export const adminOnlySidebarItems: readonly NavItem[] = [
  { href: "/admin", label: "Admin", icon: LayoutDashboard },
  { href: "/admin/live-monitoring", label: "Live monitoring", icon: ShieldAlert },
] as const;

/** Horizontal scroll nav on small screens (full app map). */
export const mobileNavItems: readonly NavItem[] = [
  ...primaryNavItems,
] as const;

/** Routes that use the app shell (sidebar + padded main). */
export const APP_SHELL_PREFIXES = [
  "/dashboard",
  "/rules",
  "/trades",
  "/backtesting",
  "/simulator",
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
