import type { ComponentType } from "react";
import {
  LayoutDashboard,
  ShieldAlert,
  FlaskConical,
  Sparkles,
  BookOpen,
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
};

export const primaryNavItems: readonly NavItem[] = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/backtesting", label: "Backtesting", icon: FlaskConical },
  { href: "/app/journaling", label: "Journal", icon: BookOpen },
  { href: "/app/risk-manager", label: "Risk Manager", icon: ShieldAlert },
  { href: "/app/ai-coach", label: "AI Coach", icon: Sparkles },
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
export const mobileNavItems: readonly NavItem[] = [...primaryNavItems] as const;

/** Routes that use the app shell (sidebar + padded main). */
export const APP_SHELL_PREFIXES = ["/app", "/admin"] as const;

export function isAppShellPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return APP_SHELL_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function isNavActive(pathname: string | null | undefined, href: string): boolean {
  if (!pathname) return false;
  if (href === "/app/dashboard") return pathname === "/app/dashboard";
  if (href === "/app/backtesting") {
    return pathname === "/app/backtesting" || pathname.startsWith("/app/backtesting/");
  }
  if (href === "/app/journaling") {
    return pathname === "/app/journaling" || pathname.startsWith("/app/journaling/");
  }
  if (href === "/mock/journaling") {
    return (
      pathname === "/mock/journal" ||
      pathname === "/mock/journaling" ||
      pathname.startsWith("/mock/journal/") ||
      pathname.startsWith("/mock/journaling/")
    );
  }
  if (href === "/app/ai-coach") {
    return pathname === "/app/ai-coach" || pathname.startsWith("/app/ai-coach/");
  }
  if (href === "/app/risk-manager") {
    return pathname === "/app/risk-manager";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Canonical journal list path for matching sidebar child links (/mock/journal and /mock/journaling both → mock canonical). */
export function journalListNormalizedPath(pathname: string | null): string | null {
  if (pathname === "/app/journaling") return "/app/journaling";
  if (pathname === "/mock/journal" || pathname === "/mock/journaling") {
    return "/mock/journaling";
  }
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
  if (
    pathname !== "/app/journaling" &&
    pathname !== "/mock/journal" &&
    pathname !== "/mock/journaling"
  ) {
    return false;
  }
  let childPath: string;
  try {
    childPath = new URL(childHref, "https://risksent.local").pathname;
  } catch {
    return false;
  }
  if (childPath === "/mock/journal") childPath = "/mock/journaling";
  if (childPath !== listNorm) return false;
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
