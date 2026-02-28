"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

const APP_PATHS = [
  "/dashboard",
  "/rules",
  "/trades",
  "/simulator",
  "/ai-coach",
  "/add-account",
  "/metaapi-test",
  "/metatraderapi-test"
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApp = APP_PATHS.some((p) => pathname?.startsWith(p));

  if (!isApp) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-1 w-full">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
