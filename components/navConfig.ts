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
  /** If set, link is `href#hash` and is active when the URL hash matches. */
  hash?: string;
};

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Optional nested links (renders under parent in sidebar). */
  children?: readonly NavChild[];
};

export const primaryNavItems: readonly NavItem[] = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/backtesting", label: "Backtesting", icon: FlaskConical },
  { href: "/app/journaling", label: "Journal", icon: BookOpen },
  { href: "/app/risk-manager", label: "Risk Manager", icon: ShieldAlert },
  {
    href: "/app/ai-coach",
    label: "AI Coach",
    icon: Sparkles,
    children: [
      { href: "/app/ai-coach", label: "Report" },
      { href: "/app/ai-coach?tab=chat", label: "Chat" },
    ],
  },
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
  if (href === "/app/ai-coach") {
    return pathname === "/app/ai-coach" || pathname.startsWith("/app/ai-coach/");
  }
  if (href === "/app/risk-manager") {
    return pathname === "/app/risk-manager";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
