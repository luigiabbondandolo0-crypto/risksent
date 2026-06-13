"use client";

import { createContext, useContext } from "react";
import { isAppShellPath } from "@/components/navConfig";

const AppDomainContext = createContext(false);

export function AppDomainProvider({
  isAppDomain,
  children,
}: {
  isAppDomain: boolean;
  children: React.ReactNode;
}) {
  return (
    <AppDomainContext.Provider value={isAppDomain}>
      {children}
    </AppDomainContext.Provider>
  );
}

export function useIsAppDomain(): boolean {
  return useContext(AppDomainContext);
}

/**
 * Clean paths that rewrite to /app/* on the app subdomain.
 * Must stay in sync with CLEAN_APP_REWRITES in proxy.ts.
 */
const CLEAN_APP_PATHS = [
  "/journaling",
  "/risk-manager",
  "/ai-coach",
  "/billing",
  "/affiliate",
  "/settings",
  "/backtesting",
  "/dashboard",
  "/profile",
];

/**
 * Domain-aware shell check.
 * On app.risksent.com: /journaling, /risk-manager etc. → app shell (clean URL rewrites).
 *   usePathname() returns the clean URL (not the rewritten /app/* target), so we must
 *   check both /app/* paths AND the clean path list.
 * On risksent.com:     only /app/*, /dashboard, /admin → app shell
 */
export function useIsAppShell(pathname: string | null | undefined): boolean {
  const isAppDomain = useIsAppDomain();
  if (!pathname) return false;
  if (isAppDomain) {
    return (
      isAppShellPath(pathname) ||
      CLEAN_APP_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
    );
  }
  // Main domain — only hard app paths get the shell
  return ["/app", "/admin", "/dashboard"].some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}
