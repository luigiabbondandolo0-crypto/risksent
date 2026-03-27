"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Send,
  ShieldAlert,
  FlaskConical,
  Bot,
  CreditCard,
  Sparkles,
  Home,
} from "lucide-react";

const MOCK_LINKS: { href: string; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { href: "/mock", label: "Hub", icon: Home },
  { href: "/mock/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mock/trades", label: "Trades", icon: TrendingUp },
  { href: "/mock/orders", label: "Orders", icon: Send },
  { href: "/mock/rules", label: "Rules & alerts", icon: ShieldAlert },
  { href: "/mock/simulator", label: "Simulator", icon: FlaskConical },
  { href: "/mock/ai-coach", label: "AI Coach", icon: Bot },
  { href: "/mock/accounts", label: "Accounts", icon: CreditCard },
];

function linkActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/mock") return pathname === "/mock";
  return pathname === href || pathname.startsWith(`${href}/`);
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
              <span className="text-violet-200/80"> — Dati dimostrativi. Nessuna chiamata API reale.</span>
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
        <aside className="hidden w-[220px] shrink-0 flex-col border-r border-slate-800/60 bg-slate-950/60 px-3 py-6 backdrop-blur-sm lg:flex">
          <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
            Mock navigation
          </p>
          <nav className="flex flex-col gap-0.5">
            {MOCK_LINKS.map(({ href, label, icon: Icon }) => {
              const active = linkActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "border border-violet-500/40 bg-violet-500/15 text-violet-100"
                      : "border border-transparent text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? "text-violet-300" : "text-slate-500"}`} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <aside className="scrollbar-none flex gap-1 overflow-x-auto border-b border-slate-800/60 bg-slate-950/40 px-4 py-2 lg:hidden">
          {MOCK_LINKS.map(({ href, label, icon: Icon }) => {
            const active = linkActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${
                  active
                    ? "bg-violet-500/20 text-violet-100 ring-1 ring-violet-500/30"
                    : "text-slate-400 hover:bg-slate-800/80"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </aside>

        <main className="mx-auto w-full min-w-0 max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
