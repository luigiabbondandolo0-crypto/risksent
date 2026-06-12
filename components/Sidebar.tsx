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
import { BrandLogo } from "@/components/Brand";

function navLinkClass(active: boolean) {
  return [
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
    active
      ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-sm shadow-indigo-100"
      : "border border-transparent text-slate-500 hover:bg-slate-100/80 hover:text-slate-800 hover:border-slate-200/60",
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
      <span className="mb-2 block px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {title}
      </span>
      <nav className="flex flex-col gap-0.5">
        {items.map(({ href, label, icon: Icon, children, badge }, i) => {
          const active = isNavActive(pathname, href);
          return (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.2, ease: "easeOut" }}
            >
              <Link href={href} className={navLinkClass(active)}>
                <Icon
                  className={`h-4 w-4 flex-shrink-0 transition-colors ${
                    active ? "text-indigo-600" : "text-slate-400"
                  }`}
                />
                <span className="truncate">{label}</span>
                {badge && !active && (
                  <span
                    className="ml-auto rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                    style={{ background: "rgba(249,115,22,0.1)", color: "#ea580c" }}
                  >
                    {badge}
                  </span>
                )}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />
                )}
              </Link>
              {children && children.length > 0 && (
                <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-slate-200/80 pl-3">
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
                            subActive ? "text-indigo-600" : "text-slate-400"
                          }`}
                        />
                        <span className="truncate pl-0.5 text-[13px]">
                          {ch.label}
                        </span>
                        {subActive && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />
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
      <span className="mb-2 block px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        Platform
      </span>
      <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
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
      <aside className="hidden h-full min-h-0 w-[240px] shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-slate-200/80 bg-white px-4 py-7 lg:flex">
        <span className="mb-4 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Admin
        </span>
        <nav className="flex flex-col gap-0.5">
          {adminOnlySidebarItems.map(({ href, label, icon: Icon }) => {
            const active = isNavActive(pathname, href);
            return (
              <Link key={href} href={href} className={navLinkClass(active)}>
                <Icon
                  className={`h-4 w-4 flex-shrink-0 ${
                    active ? "text-indigo-600" : "text-slate-400"
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
    <aside className="hidden h-full min-h-0 w-[240px] shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-slate-200/80 bg-white px-4 py-7 lg:flex">
      <Link
        href="/app/dashboard"
        className="group mb-8 flex items-center justify-center px-1 py-2"
        aria-label="RiskSent dashboard"
      >
        <BrandLogo treatment="bare" size={88} priority />
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
