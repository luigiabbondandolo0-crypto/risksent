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
 * Domain-aware shell check.
 * On app.risksent.com: /journaling, /risk-manager etc. → app shell (clean URL rewrites)
 * On risksent.com:     only /app/*, /dashboard, /admin → app shell
 */
export function useIsAppShell(pathname: string | null | undefined): boolean {
  const isAppDomain = useIsAppDomain();
  if (!pathname) return false;
  if (isAppDomain) return isAppShellPath(pathname);
  // Main domain — only hard app paths get the shell
  return ["/app", "/admin", "/dashboard"].some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}
