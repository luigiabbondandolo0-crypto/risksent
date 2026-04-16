"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronRight, LineChart, Plus } from "lucide-react";
import type { BtSessionRow, StrategyWithStats } from "@/lib/backtesting/btTypes";
import { buildDemoBacktestingSeed } from "@/lib/demo/demoBacktestingSeed";
import { useDemoAction } from "@/hooks/useDemoAction";
import { DemoActionModal } from "@/components/demo/DemoActionModal";
import { bt } from "./btClasses";

type Props = {
  basePath: string;
  /** Subscription without plan: same UI, static sessions; navigation opens upgrade modal. */
  subscriptionDemo?: boolean;
};

function NavControl({
  href,
  className,
  children,
  subscriptionDemo,
  interceptAction,
  actionLabel,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  subscriptionDemo: boolean;
  interceptAction: (cb: () => void, label?: string) => void;
  actionLabel: string;
}) {
  const router = useRouter();
  if (subscriptionDemo) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => interceptAction(() => router.push(href), actionLabel)}
      >
        {children}
      </button>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function BacktestingDashboard({ basePath, subscriptionDemo = false }: Props) {
  const { interceptAction, modalOpen, actionLabel, closeModal } = useDemoAction();
  const [strategies, setStrategies] = useState<StrategyWithStats[]>([]);
  const [sessions, setSessions] = useState<BtSessionRow[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (subscriptionDemo) {
      const seed = buildDemoBacktestingSeed();
      setStrategies(seed.strategies);
      setSessions(seed.sessions);
      setErr(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const [rs, se] = await Promise.all([
        fetch("/api/backtesting/strategies"),
        fetch("/api/backtesting/sessions")
      ]);
      if (!rs.ok || !se.ok) {
        setErr("Unauthorized or failed to load. Sign in to use backtesting.");
        return;
      }
      const sj = await rs.json();
      const ej = await se.json();
      setStrategies(sj.strategies ?? []);
      setSessions(ej.sessions ?? []);
    } finally {
      setLoading(false);
    }
  }, [subscriptionDemo]);

  useEffect(() => {
    void load();
  }, [load]);

  const sessionsByStrategy = useMemo(() => {
    const m = new Map<string, BtSessionRow[]>();
    for (const s of sessions) {
      const arr = m.get(s.strategy_id) ?? [];
      arr.push(s);
      m.set(s.strategy_id, arr);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    }
    return m;
  }, [sessions]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-sm text-slate-500 font-mono">
        Loading…
      </div>
    );
  }

  if (err) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-400 font-mono">{err}</p>
        <Link href="/login" className={bt.btnPrimary}>
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={bt.h1}>Backtesting</h1>
          <p className={bt.sub}>Strategies, sessions, and replay analytics.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <NavControl
            href={`${basePath}/strategy/new`}
            className={bt.btnPrimary}
            subscriptionDemo={subscriptionDemo}
            interceptAction={interceptAction}
            actionLabel="create a new strategy"
          >
            <Plus className="h-4 w-4" />
            New strategy
          </NavControl>
          <NavControl
            href={`${basePath}/session/new`}
            className={bt.btnGhost}
            subscriptionDemo={subscriptionDemo}
            interceptAction={interceptAction}
            actionLabel="start a new backtesting session"
          >
            <LineChart className="h-4 w-4" />
            New session
          </NavControl>
        </div>
      </header>

      <div className="space-y-3">
        {strategies.length === 0 && (
          <div className={`${bt.card} text-sm text-slate-500`}>
            No strategies yet.{" "}
            <NavControl
              href={`${basePath}/strategy/new`}
              className="text-[#6366f1] underline"
              subscriptionDemo={subscriptionDemo}
              interceptAction={interceptAction}
              actionLabel="create a strategy"
            >
              Create one
            </NavControl>
            .
          </div>
        )}

        {strategies.map((st) => {
          const isOpen = expanded.has(st.id);
          const sess = sessionsByStrategy.get(st.id) ?? [];
          return (
            <div key={st.id} className={bt.card}>
              <button
                type="button"
                onClick={() => toggle(st.id)}
                className="flex w-full items-start justify-between gap-3 text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
                    )}
                    <h2 className="truncate font-display text-lg font-bold text-white">
                      {st.name}
                    </h2>
                  </div>
                  {st.description && (
                    <p className="mt-1 pl-6 text-xs text-slate-500 font-mono">{st.description}</p>
                  )}
                </div>
                <div className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-1 text-right text-[11px] font-mono sm:grid-cols-4">
                  <span className="text-slate-500">Sessions</span>
                  <span className="text-slate-200">{st.session_count}</span>
                  <span className="text-slate-500">Win rate</span>
                  <span className="text-[#00e676]">
                    {st.win_rate_pct != null ? `${st.win_rate_pct.toFixed(1)}%` : "—"}
                  </span>
                  <span className="text-slate-500">Avg R:R</span>
                  <span className="text-slate-200">{st.avg_rr != null ? st.avg_rr.toFixed(2) : "—"}</span>
                  <span className="text-slate-500">P&amp;L</span>
                  <span className={st.total_pl >= 0 ? "text-[#00e676]" : "text-[#ff3c3c]"}>
                    {st.total_pl >= 0 ? "+" : ""}
                    {st.total_pl.toFixed(0)}
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4 pl-2">
                  <div className="mb-2 flex justify-end">
                    <NavControl
                      href={`${basePath}/session/new?strategy_id=${encodeURIComponent(st.id)}`}
                      className="text-xs font-mono text-[#6366f1] underline"
                      subscriptionDemo={subscriptionDemo}
                      interceptAction={interceptAction}
                      actionLabel="add a session for this strategy"
                    >
                      + Session for this strategy
                    </NavControl>
                  </div>
                  {sess.length === 0 && <p className="text-xs text-slate-600 font-mono">No sessions.</p>}
                  <ul className="space-y-2">
                    {sess.map((se) => (
                      <li
                        key={se.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-black/25 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-200">{se.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {se.symbol} · {se.date_from} → {se.date_to} · {se.status}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <NavControl
                            href={`${basePath}/session/${se.id}/replay`}
                            className="rounded-lg border border-[#6366f1]/40 bg-[#6366f1]/10 px-3 py-1.5 text-[11px] font-medium text-[#6366f1]"
                            subscriptionDemo={subscriptionDemo}
                            interceptAction={interceptAction}
                            actionLabel="open session replay"
                          >
                            Replay
                          </NavControl>
                          <NavControl
                            href={`${basePath}/session/${se.id}`}
                            className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-slate-400"
                            subscriptionDemo={subscriptionDemo}
                            interceptAction={interceptAction}
                            actionLabel="open session summary"
                          >
                            Summary
                          </NavControl>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {subscriptionDemo && (
        <DemoActionModal open={modalOpen} action={actionLabel} onClose={closeModal} />
      )}
    </motion.div>
  );
}
