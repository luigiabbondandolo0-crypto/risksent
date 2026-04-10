"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import type { MockNavItem } from "@/components/mock/mockNavConfig";
import {
  mockPrimaryNavItems,
  mockMobileNavItems,
} from "@/components/mock/mockNavConfig";

function linkActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/mock/dashboard") return pathname === "/mock" || pathname === "/mock/dashboard";
  if (href === "/mock/journal") {
    return pathname === "/mock/journal" || pathname.startsWith("/mock/journal/");
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

function NavGroup({
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
          const active = linkActive(pathname, href);
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
                    const subActive =
                      pathname === ch.href || pathname?.startsWith(`${ch.href}/`);
                    return (
                      <Link key={ch.href} href={ch.href} className={navLinkClass(!!subActive, mobile)}>
                        <span className="truncate pl-1 text-[13px]">{ch.label}</span>
                        {subActive && (
                          <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                        )}
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

export function MockSiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="border-b border-violet-500/30 bg-gradient-to-r from-violet-950/90 via-slate-950 to-amber-950/30 px-4 py-2.5 text-center sm:text-left">
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

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[240px] shrink-0 flex-col border-r border-slate-800/50 bg-slate-950/50 px-4 py-7 backdrop-blur-sm lg:flex">
          <Link href="/mock/dashboard" className="mb-8 flex items-center gap-2.5 px-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/25 to-amber-500/10 text-xs font-bold text-violet-200 ring-1 ring-violet-500/25">
              RS
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-100">RiskSent</span>
          </Link>

          <div className="flex flex-col gap-8">
            <NavGroup title="Platform" items={mockPrimaryNavItems} pathname={pathname} mobile={false} />
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="scrollbar-none flex gap-1 overflow-x-auto border-b border-slate-800/60 bg-slate-950/40 px-3 py-2.5 lg:hidden">
            {mockMobileNavItems.map(({ href, label, icon: Icon }) => {
              const active = linkActive(pathname, href);
              return (
                <Link key={href} href={href} className={navLinkClass(active, true)}>
                  <Icon className={`h-3.5 w-3.5 ${active ? "text-violet-300" : "text-slate-500"}`} />
                  {label}
                </Link>
              );
            })}
          </div>

          <main className="mx-auto w-full min-w-0 max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
