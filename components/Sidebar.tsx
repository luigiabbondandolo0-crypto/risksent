"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/components/navConfig";
import {
  primaryNavItems,
  adminOnlySidebarItems,
  isNavActive,
} from "@/components/navConfig";
import { motion } from "framer-motion";

function navLinkClass(active: boolean) {
  return [
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
    active
      ? "border border-cyan-500/30 bg-cyan-500/12 text-cyan-100 shadow-sm shadow-cyan-500/10"
      : "border border-transparent text-slate-500 hover:bg-slate-800/60 hover:text-slate-100 hover:border-slate-700/50",
  ].join(" ");
}

function NavGroup({
  title,
  items,
  pathname,
}: {
  title: string;
  items: readonly NavItem[];
  pathname: string | null;
}) {
  return (
    <div>
      <span className="mb-2 block px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
        {title}
      </span>
      <nav className="flex flex-col gap-0.5">
        {items.map(({ href, label, icon: Icon }, i) => {
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
                    active ? "text-cyan-400" : "text-slate-500"
                  }`}
                />
                <span className="truncate">{label}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400" />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>
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
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-slate-800/50 bg-slate-950/50 px-4 py-7 backdrop-blur-sm lg:flex">
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
                    active ? "text-cyan-400" : "text-slate-500"
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
    <aside className="hidden w-[240px] shrink-0 flex-col border-r border-slate-800/50 bg-slate-950/60 px-4 py-7 backdrop-blur-sm lg:flex">
      {/* Logo */}
      <Link href="/app/dashboard" className="mb-8 flex items-center gap-2.5 px-1 group">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 text-xs font-bold text-cyan-300 ring-1 ring-cyan-500/20 group-hover:ring-cyan-500/40 transition-all">
          RS
        </span>
        <span className="text-sm font-semibold tracking-tight text-slate-100">
          RiskSent
        </span>
      </Link>

      <div className="flex flex-col gap-8">
        <NavGroup
          title="Platform"
          items={primaryNavItems}
          pathname={pathname}
        />
      </div>
    </aside>
  );
}