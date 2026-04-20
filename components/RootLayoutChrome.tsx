"use client";

import { usePathname } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { AppShell } from "@/components/AppShell";
import { MockSiteChrome } from "@/components/mock/MockSiteChrome";
import { isAppShellPath } from "@/components/navConfig";
import { ScrollToTop } from "@/components/ScrollToTop";
import { CommandPalette, useCommandPalette } from "@/components/ui/command-palette";
import { Footer } from "@/components/Footer";
import { CookieConsentBanner } from "@/components/CookieConsent";
import { AnalyticsScripts } from "@/components/AnalyticsScripts";

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
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();

  if (isMock) {
    return (
      <>
        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
        <ShellViewportLock>
          <MockSiteChrome>{children}</MockSiteChrome>
        </ShellViewportLock>
        <CookieConsentBanner />
        <AnalyticsScripts />
      </>
    );
  }

  if (inAppShell) {
    return (
      <>
        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
        <ShellViewportLock>
          <Topbar />
          <AppShell>{children}</AppShell>
        </ShellViewportLock>
        <CookieConsentBanner />
        <AnalyticsScripts />
      </>
    );
  }

  return (
    <>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <ScrollToTop />
      <Topbar />
      <AppShell>{children}</AppShell>
      <Footer variant="marketing" />
      <CookieConsentBanner />
      <AnalyticsScripts />
    </>
  );
}
