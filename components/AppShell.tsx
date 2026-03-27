"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { isAppShellPath } from "@/components/navConfig";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApp = isAppShellPath(pathname);
  const isAdminArea = pathname?.startsWith("/admin") ?? false;

  if (!isApp) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-0 w-full flex-1">
      <Sidebar variant={isAdminArea ? "admin" : "default"} />
      <main className="mx-auto flex w-full min-w-0 max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
