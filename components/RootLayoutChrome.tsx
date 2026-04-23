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

/** Fills the viewport; sidebar stays put while only main scrolls. */
function ShellViewportLock({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh max-h-dvh min-h-0 w-full min-w-0 max-w-[100vw] flex-col overflow-hidden">
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
      </>
    );
  }

  return (
    <>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <div className="flex min-w-0 w-full max-w-[100vw] flex-1 flex-col">
        <ScrollToTop />
        <Topbar />
        <AppShell>{children}</AppShell>
        <Footer variant="marketing" />
      </div>
      <CookieConsentBanner />
    </>
  );
}
