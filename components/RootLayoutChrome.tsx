"use client";

import { usePathname } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { AppShell } from "@/components/AppShell";
import { ScrollToTop } from "@/components/ScrollToTop";
import { CommandPalette, useCommandPalette } from "@/components/ui/command-palette";
import { Footer } from "@/components/Footer";
import { CookieConsentBanner } from "@/components/CookieConsent";
import { AppDomainProvider, useIsAppShell } from "@/lib/AppDomainContext";
import { UserPreferencesProvider } from "@/lib/UserPreferencesContext";
import { AnnouncementBar } from "@/components/AnnouncementBar";

/** Pages that own their full layout — no topbar, no footer */
const CHROMELESS_PATHS = [
  "/login",
  "/signup",
  "/reset-password",
  "/change-password",
  "/onboarding",
];

function isChromelessPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return CHROMELESS_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

/** Fills the viewport; sidebar stays put while only main scrolls. */
function ShellViewportLock({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh max-h-dvh min-h-0 w-full min-w-0 max-w-[100vw] flex-col overflow-hidden">
      {children}
    </div>
  );
}

function RootLayoutChromeInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const inAppShell = useIsAppShell(pathname);
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();

  // Login / signup / auth pages own their full viewport — no chrome
  if (isChromelessPath(pathname)) {
    return <>{children}</>;
  }

  if (inAppShell) {
    return (
      <>
        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
        <ShellViewportLock>
          <AnnouncementBar />
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
        <AnnouncementBar />
        <Topbar />
        <AppShell>{children}</AppShell>
        <Footer variant="marketing" />
      </div>
      <CookieConsentBanner />
    </>
  );
}

export function RootLayoutChrome({
  children,
  isAppDomain = false,
}: {
  children: React.ReactNode;
  isAppDomain?: boolean;
}) {
  return (
    <AppDomainProvider isAppDomain={isAppDomain}>
      <UserPreferencesProvider>
        <RootLayoutChromeInner>{children}</RootLayoutChromeInner>
      </UserPreferencesProvider>
    </AppDomainProvider>
  );
}
