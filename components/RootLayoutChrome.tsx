"use client";

import { usePathname } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { AppShell } from "@/components/AppShell";
import { MockSiteChrome } from "@/components/mock/MockSiteChrome";
import { isAppShellPath } from "@/components/navConfig";
import { ScrollToTop } from "@/components/ScrollToTop";

/** Fills the viewport; sidebar stays put while only main scrolls. */
function ShellViewportLock({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden">
      {children}
    </div>
  );
}

export function RootLayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMock = pathname?.startsWith("/mock") ?? false;
  const inAppShell = isAppShellPath(pathname);

  if (isMock) {
    return (
      <ShellViewportLock>
        <MockSiteChrome>{children}</MockSiteChrome>
      </ShellViewportLock>
    );
  }

  if (inAppShell) {
    return (
      <ShellViewportLock>
        <Topbar />
        <AppShell>{children}</AppShell>
      </ShellViewportLock>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Topbar />
      <AppShell>{children}</AppShell>
    </>
  );
}
