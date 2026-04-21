"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Bell, Sparkles } from "lucide-react";
import type { MockNavItem } from "@/components/mock/mockNavConfig";
import {
  mockPrimaryNavItems,
  mockMobileNavItems,
} from "@/components/mock/mockNavConfig";
import { isJournalChildNavActive } from "@/components/navConfig";
import { Footer } from "@/components/Footer";
import { BrandLogo, BrandWordmark } from "@/components/Brand";

function mockNavLinkActive(
  pathname: string | null,
  searchParams: { get: (key: string) => string | null } | null,
  href: string
): boolean {
  let pathOnly: string;
  let queryTab: string | null = null;
  try {
    const u = new URL(href, "https://risksent.local");
    pathOnly = u.pathname;
    queryTab = u.searchParams.get("tab");
  } catch {
    pathOnly = href;
  }

  if (!pathname) return false;
  if (pathOnly === "/mock/dashboard") {
    return pathname === "/mock" || pathname === "/mock/dashboard";
  }
  if (pathOnly === "/mock/journaling") {
    const base =
      pathname === "/mock/journaling" ||
      pathname.startsWith("/mock/journaling/");
    if (!base) return false;
    if (queryTab == null) {
      return pathname === "/mock/journaling";
    }
    if (!searchParams) return false;
    return isJournalChildNavActive(pathname, searchParams, href);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navLinkClass(active: boolean, mobile: boolean) {
  const base = mobile
    ? "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
    : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200";
  if (mobile) {
    return `${base} ${
      active
        ? "bg-violet-500/20 text-violet-100 ring-1 ring-violet-500/30"
        : "text-slate-400 hover:bg-slate-800/80"
    }`;
  }
  return `${base} ${
    active
      ? "border border-violet-500/40 bg-violet-500/15 text-violet-100 shadow-sm shadow-violet-500/5"
      : "border border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
  }`;
}

function NavGroupInner({
  title,
  items,
  pathname,
  mobile,
}: {
  title: string;
  items: readonly MockNavItem[];
  pathname: string | null;
  mobile: boolean;
}) {
  const searchParams = useSearchParams();

  return (
    <div>
      <span
        className={`mb-2 block font-semibold uppercase tracking-[0.18em] text-slate-600 ${
          mobile ? "px-1 text-[9px]" : "px-1 text-[10px]"
        }`}
      >
        {title}
      </span>
      <nav className={`flex ${mobile ? "gap-1" : "flex-col gap-0.5"}`}>
        {items.map(({ href, label, icon: Icon, children }) => {
          const active = mockNavLinkActive(pathname, searchParams, href);
          return (
            <div key={href}>
              <Link href={href} className={navLinkClass(active, mobile)}>
                <Icon
                  className={`shrink-0 ${mobile ? "h-3.5 w-3.5" : "h-4 w-4"} ${active ? "text-violet-300" : "text-slate-500"}`}
                />
                <span className={mobile ? "" : "truncate"}>{label}</span>
              </Link>
              {!mobile && children && children.length > 0 && (
                <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-slate-800/80 pl-3">
                  {children.map((ch) => {
                    const ChIcon = ch.icon;
                    const subActive = isJournalChildNavActive(
                      pathname,
                      searchParams,
                      ch.href
                    );
                    return (
                      <Link
                        key={ch.href}
                        href={ch.href}
                        className={navLinkClass(subActive, false)}
                      >
                        <ChIcon
                          className={`h-3.5 w-3.5 flex-shrink-0 ${subActive ? "text-violet-300" : "text-slate-500"}`}
                        />
                        <span className="truncate pl-0.5 text-[13px]">
                          {ch.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

function NavGroupFallback({ title, mobile }: { title: string; mobile: boolean }) {
  return (
    <div>
      <span
        className={`mb-2 block font-semibold uppercase tracking-[0.18em] text-slate-600 ${
          mobile ? "px-1 text-[9px]" : "px-1 text-[10px]"
        }`}
      >
        {title}
      </span>
      <div
        className={`animate-pulse rounded-xl bg-slate-900/40 ${mobile ? "h-10" : "h-40"}`}
      />
    </div>
  );
}

function MockMobileNavStrip() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <div className="scrollbar-none flex shrink-0 gap-1 overflow-x-auto border-b border-slate-800/60 bg-slate-950/40 px-3 py-2.5 lg:hidden">
      {mockMobileNavItems.map(({ href, label, icon: Icon }) => {
        const active = mockNavLinkActive(pathname, searchParams, href);
        return (
          <Link key={href} href={href} className={navLinkClass(active, true)}>
            <Icon className={`h-3.5 w-3.5 ${active ? "text-violet-300" : "text-slate-500"}`} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}

export function MockSiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-violet-500/30 bg-gradient-to-r from-violet-950/90 via-slate-950 to-amber-950/30 px-4 py-2.5 text-center sm:text-left">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 sm:flex-row sm:px-2">
          <div className="flex items-center gap-2 text-xs text-violet-100/95 sm:text-sm">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-300" />
            <span>
              <strong className="font-semibold text-white">Mock preview</strong>
              <span className="text-violet-200/80"> — Stessa struttura dell&apos;app live, dati dimostrativi.</span>
            </span>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 transition-colors hover:bg-white/10"
          >
            ← Torna al sito reale
          </Link>
        </div>
      </div>

      <div
        className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] px-4 backdrop-blur-[20px] sm:px-6"
        style={{ background: "rgba(8,8,9,0.85)" }}
      >
        <Link
          href="/mock/dashboard"
          className="flex items-center transition-transform duration-200 hover:-translate-y-[1px]"
          aria-label="RiskSent mock home"
        >
          <BrandWordmark variant="mock" className="text-[17px] sm:text-[19px]" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-slate-500">
            <Bell className="h-4 w-4" />
          </span>
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #ff3c3c, #cc1111)" }}
          >
            DM
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden h-full min-h-0 w-[240px] shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-slate-800/50 bg-slate-950/50 px-4 py-7 backdrop-blur-sm lg:flex">
          <Link
            href="/mock/dashboard"
            className="mb-8 flex items-center justify-center px-1 py-1"
            aria-label="RiskSent mock dashboard"
          >
            <BrandLogo treatment="bare" size={56} priority />
          </Link>

          <div className="flex flex-col gap-8">
            <Suspense fallback={<NavGroupFallback title="Platform" mobile={false} />}>
              <NavGroupInner
                title="Platform"
                items={mockPrimaryNavItems}
                pathname={pathname}
                mobile={false}
              />
            </Suspense>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Suspense fallback={<NavGroupFallback title="" mobile />}>
            <MockMobileNavStrip />
          </Suspense>

          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain">
            <div className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              {children}
            </div>
            <Footer variant="mock" />
          </main>
        </div>
      </div>
    </div>
  );
}
