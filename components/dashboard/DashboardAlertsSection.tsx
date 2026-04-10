"use client";

import Link from "next/link";
import { AlertTriangle, Bell, ChevronRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export type DashboardAlertItem = {
  id: string;
  message: string;
  severity: string;
  solution: string | null;
  alert_date: string;
  read?: boolean | null;
};

type Props = {
  items: DashboardAlertItem[];
  loading?: boolean;
  maxItems?: number;
  viewAllHref?: string;
  viewAllLabel?: string;
  title?: string;
  subtitle?: string;
  /** When the empty state is shown, override the default “All clear” copy */
  emptyHeadline?: string;
  emptyDescription?: string;
};

function severityStyles(sev: string) {
  if (sev === "high") {
    return {
      bar: "from-red-500 via-rose-500 to-orange-500",
      glow: "shadow-[0_0_28px_-6px_rgba(255,60,60,0.5)]",
      badge: "bg-red-500/20 text-red-300 ring-red-500/30",
      icon: "text-red-400",
      border: "border-red-500/20 hover:border-red-500/40",
    };
  }
  return {
    bar: "from-amber-500 via-yellow-500 to-orange-400",
    glow: "shadow-[0_0_20px_-4px_rgba(245,158,11,0.4)]",
    badge: "bg-amber-500/15 text-amber-200 ring-amber-500/25",
    icon: "text-amber-400",
    border: "border-amber-500/20 hover:border-amber-500/40",
  };
}

export function DashboardAlertsSection({
  items,
  loading,
  maxItems = 4,
  viewAllHref = "/rules#alerts",
  viewAllLabel = "Alerts center",
  title = "Live alerts",
  subtitle = "Unread and recent risk signals",
  emptyHeadline = "All clear",
  emptyDescription = "No pending alerts — rules are quiet for now.",
}: Props) {
  const pending = items.filter((a) => !a.read).slice(0, maxItems);

  return (
    <section className="relative rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/95 via-slate-950 to-slate-900/90 p-5 shadow-xl shadow-black/20 sm:p-6">
      {/* Background glows */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-violet-500/5 blur-3xl" />

      {/* Header */}
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/25 to-violet-500/20 ring-1 ring-cyan-500/25">
            <Bell className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-50">
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        {items.length > 0 && (
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-600/80 bg-slate-800/40 px-3 py-1.5 text-xs font-medium text-cyan-300/95 transition-colors hover:border-cyan-500/40 hover:bg-slate-800/70"
          >
            {viewAllLabel}
            <ChevronRight className="h-3.5 w-3.5 opacity-80" />
          </Link>
        )}
      </div>

      {/* Content */}
      <div className="relative mt-5">
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-28 animate-pulse rounded-xl bg-slate-800/50" />
            <div className="h-28 animate-pulse rounded-xl bg-slate-800/40" />
          </div>
        ) : pending.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-500/25 bg-emerald-500/[0.06] py-10 text-center"
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
              <Sparkles className="h-6 w-6 text-emerald-400/90" />
            </div>
            <p className="text-sm font-medium text-emerald-200/90">{emptyHeadline}</p>
            <p className="mt-1 max-w-sm text-xs text-slate-500">{emptyDescription}</p>
          </motion.div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {pending.map((a, i) => {
              const s = severityStyles(a.severity);
              const isHigh = a.severity === "high";
              return (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.08,
                    duration: 0.35,
                    ease: "easeOut",
                  }}
                  className={`group relative rounded-xl border bg-slate-950/50 p-4 transition-all duration-200 ${s.glow} ${s.border}`}
                >
                  {/* Left bar */}
                  <div
                    className={`absolute left-0 top-0 h-full w-[4px] rounded-l-xl bg-gradient-to-b ${s.bar}`}
                    aria-hidden
                  />

                  <div className="pl-3">
                    {/* Badge row */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${s.badge}`}
                      >
                        {/* Pulsing dot */}
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span
                            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
                              isHigh ? "bg-red-400" : "bg-amber-400"
                            }`}
                          />
                          <span
                            className={`relative inline-flex h-2 w-2 rounded-full ${
                              isHigh ? "bg-red-400" : "bg-amber-400"
                            }`}
                          />
                        </span>
                        {isHigh ? "High" : "Watch"}
                      </span>
                      <time
                        className="text-[10px] text-slate-500"
                        dateTime={a.alert_date}
                      >
                        {new Date(a.alert_date).toLocaleString(undefined, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </time>
                    </div>

                    {/* Message */}
                    <p className="mt-2 flex items-start gap-2 text-sm font-medium leading-snug text-slate-100">
                      <AlertTriangle
                        className={`mt-0.5 h-4 w-4 shrink-0 ${s.icon}`}
                      />
                      {a.message}
                    </p>

                    {/* Solution */}
                    {a.solution && (
                      <p className="mt-2 border-t border-slate-800/80 pt-2 text-xs leading-relaxed text-slate-400">
                        <span className="text-slate-500">Next step: </span>
                        {a.solution}
                      </p>
                    )}
                  </div>

                  {/* HIGH — glow pulse */}
                  {isHigh && (
                    <div className="pointer-events-none absolute inset-0 rounded-xl animate-[glow-pulse_2s_ease-in-out_infinite]" />
                  )}
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}