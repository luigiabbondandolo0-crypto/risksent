"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { NavItem } from "@/components/navConfig";
import {
  primaryNavItems,
  adminOnlySidebarItems,
  isNavActive,
  isJournalChildNavActive,
} from "@/components/navConfig";
import { motion } from "framer-motion";
import { BrandLockup } from "@/components/Brand";

function navLinkClass(active: boolean) {
  return [
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
    active
      ? "border border-[#6366f1]/30 bg-[#6366f1]/10 text-indigo-100 shadow-sm shadow-[#6366f1]/10"
      : "border border-transparent text-slate-500 hover:bg-slate-800/60 hover:text-slate-100 hover:border-slate-700/50",
  ].join(" ");
}

function NavGroupInner({
  title,
  items,
  pathname,
}: {
  title: string;
  items: readonly NavItem[];
  pathname: string | null;
}) {
  const searchParams = useSearchParams();

  return (
    <div>
      <span className="mb-2 block px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
        {title}
      </span>
      <nav className="flex flex-col gap-0.5">
        {items.map(({ href, label, icon: Icon, children }, i) => {
          const active = isNavActive(pathname, href);
          return (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25, ease: "easeOut" }}
            >
              <Link href={href} className={navLinkClass(active)}>
                <Icon
                  className={`h-4 w-4 flex-shrink-0 transition-colors ${
                    active ? "text-[#6366f1]" : "text-slate-500"
                  }`}
                />
                <span className="truncate">{label}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#6366f1]" />
                )}
              </Link>
              {children && children.length > 0 && (
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
                        className={navLinkClass(subActive)}
                      >
                        <ChIcon
                          className={`h-3.5 w-3.5 flex-shrink-0 transition-colors ${
                            subActive ? "text-[#6366f1]" : "text-slate-500"
                          }`}
                        />
                        <span className="truncate pl-0.5 text-[13px]">
                          {ch.label}
                        </span>
                        {subActive && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#6366f1]" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </motion.div>
          );
        })}
      </nav>
    </div>
  );
}

function NavGroupFallback() {
  return (
    <div>
      <span className="mb-2 block px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
        Platform
      </span>
      <div className="h-40 animate-pulse rounded-xl bg-slate-900/40" />
    </div>
  );
}

export function Sidebar({
  variant = "default",
}: {
  variant?: "default" | "admin";
}) {
  const pathname = usePathname();

  if (variant === "admin") {
    return (
      <aside className="hidden h-full min-h-0 w-[240px] shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-slate-800/50 bg-slate-950/50 px-4 py-7 backdrop-blur-sm lg:flex">
        <span className="mb-4 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          Admin
        </span>
        <nav className="flex flex-col gap-0.5">
          {adminOnlySidebarItems.map(({ href, label, icon: Icon }) => {
            const active = isNavActive(pathname, href);
            return (
              <Link key={href} href={href} className={navLinkClass(active)}>
                <Icon
                  className={`h-4 w-4 flex-shrink-0 ${
                    active ? "text-[#6366f1]" : "text-slate-500"
                  }`}
                />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    );
  }

  return (
    <aside className="hidden h-full min-h-0 w-[240px] shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-slate-800/50 bg-slate-950/60 px-4 py-7 backdrop-blur-sm lg:flex">
      <Link
        href="/app/dashboard"
        className="mb-8 flex items-center px-1 transition-opacity hover:opacity-90"
        aria-label="RiskSent dashboard"
      >
        <BrandLockup size="sm" logoSize={30} />
      </Link>

      <div className="flex flex-col gap-8">
        <Suspense fallback={<NavGroupFallback />}>
          <NavGroupInner
            title="Platform"
            items={primaryNavItems}
            pathname={pathname}
          />
        </Suspense>
      </div>
    </aside>
  );
}
