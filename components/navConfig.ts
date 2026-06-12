import type { ComponentType } from "react";
import {
  LayoutDashboard,
  ShieldAlert,
  FlaskConical,
  Sparkles,
  BookOpen,
  CreditCard,
  BarChart3,
  DollarSign,
  Activity,
  Bell,
  ArrowLeft,
  Users,
  Gift,
} from "lucide-react";

export type NavChild = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  children?: readonly NavChild[];
  badge?: string;
};

export const primaryNavItems: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/backtesting", label: "Backtesting", icon: FlaskConical },
  { href: "/journaling", label: "Journal", icon: BookOpen },
  { href: "/risk-manager", label: "Risk Manager", icon: ShieldAlert },
  { href: "/ai-coach", label: "AI Coach", icon: Sparkles },
  { href: "/affiliate", label: "Affiliate", icon: Gift, badge: "Soon" },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

export const accountNavItems: readonly NavItem[] = [];

export const monitoringNavItems: readonly NavItem[] = [];

export const adminNavItems: readonly NavItem[] = [];

/** Admin-only sidebar (under /admin layout). */
export const adminOnlySidebarItems: readonly NavItem[] = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign },
  { href: "/admin/system", label: "System", icon: Activity },
  { href: "/admin/announcements", label: "Announcements", icon: Bell },
  { href: "/dashboard", label: "Back to app", icon: ArrowLeft },
] as const;

/** Horizontal scroll nav on small screens (full app map). */
export const mobileNavItems: readonly NavItem[] = [...primaryNavItems] as const;

/** Routes that use the app shell (sidebar + padded main). */
export const APP_SHELL_PREFIXES = ["/app", "/admin", "/dashboard", "/journaling", "/risk-manager", "/ai-coach", "/billing", "/affiliate", "/settings"] as const;

export function isAppShellPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return APP_SHELL_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function isNavActive(pathname: string | null | undefined, href: string): boolean {
  if (!pathname) return false;
  if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/app/dashboard";
  if (href === "/app/backtesting") {
    return pathname === "/app/backtesting" || pathname.startsWith("/app/backtesting/");
  }
  if (href === "/journaling") {
    return pathname === "/journaling" || pathname.startsWith("/journaling/") ||
           pathname === "/app/journaling" || pathname.startsWith("/app/journaling/");
  }
  if (href === "/ai-coach") {
    return pathname === "/ai-coach" || pathname.startsWith("/ai-coach/") ||
           pathname === "/app/ai-coach" || pathname.startsWith("/app/ai-coach/");
  }
  if (href === "/risk-manager") {
    return pathname === "/risk-manager" || pathname === "/app/risk-manager";
  }
  if (href === "/billing") {
    return pathname === "/billing" || pathname.startsWith("/billing/") ||
           pathname === "/app/billing" || pathname.startsWith("/app/billing/");
  }
  if (href === "/affiliate") {
    return pathname === "/affiliate" || pathname === "/app/affiliate";
  }
  if (href === "/settings") {
    return pathname === "/settings" || pathname === "/app/settings";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Canonical journal list path for matching sidebar child links. */
export function journalListNormalizedPath(pathname: string | null): string | null {
  if (pathname === "/journaling" || pathname === "/app/journaling") return "/journaling";
  return null;
}

export function journalSubTabFromHref(href: string): "today" | "calendar" | "trades" {
  try {
    const u = new URL(href, "https://risksent.local");
    const t = u.searchParams.get("tab");
    if (t === "trades") return "trades";
    if (t === "calendar" || t === "history") return "calendar";
    return "today";
  } catch {
    return "today";
  }
}

export function isJournalChildNavActive(
  pathname: string | null,
  searchParams: { get: (key: string) => string | null },
  childHref: string
): boolean {
  const listNorm = journalListNormalizedPath(pathname);
  if (!listNorm) return false;
  if (pathname !== "/journaling" && pathname !== "/app/journaling") {
    return false;
  }
  let childPath: string;
  try {
    childPath = new URL(childHref, "https://risksent.local").pathname;
  } catch {
    return false;
  }
  if (childPath !== listNorm && childPath !== "/app/journaling") return false;
  const expected = journalSubTabFromHref(childHref);
  const raw = searchParams.get("tab");
  const cur =
    raw === "trades"
      ? "trades"
      : raw === "calendar" || raw === "history"
        ? "calendar"
        : "today";
  return cur === expected;
}
