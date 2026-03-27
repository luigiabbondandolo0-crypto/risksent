"use client";

import { usePathname } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { AppShell } from "@/components/AppShell";
import { MockSiteChrome } from "@/components/mock/MockSiteChrome";

export function RootLayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMock = pathname?.startsWith("/mock") ?? false;

  if (isMock) {
    return <MockSiteChrome>{children}</MockSiteChrome>;
  }

  return (
    <>
      <Topbar />
      <AppShell>{children}</AppShell>
    </>
  );
}
