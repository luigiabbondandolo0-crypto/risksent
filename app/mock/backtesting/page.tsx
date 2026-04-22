"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, FlaskConical, TrendingUp } from "lucide-react";
import { buildDemoBacktestingSeed } from "@/lib/demo/demoBacktestingSeed";
import { StrategyCard } from "@/components/backtesting/StrategyCard";
import type { Session, Strategy } from "@/lib/backtesting/types";

const SESSION_PREFIX = "/mock/backtesting";

export default function MockBacktestingPage() {
  const now = useMemo(() => new Date().toISOString(), []);
  const { strategies, sessions } = useMemo(() => {
    const seed = buildDemoBacktestingSeed();
    const st: Strategy[] = seed.strategies.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      name: r.name,
      description: r.description,
      created_at: r.created_at ?? now,
      updated_at: now,
    }));
    const sess: Session[] = seed.sessions.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      strategy_id: r.strategy_id,
      name: r.name,
      symbol: r.symbol,
      timeframe: r.timeframe as Session["timeframe"],
      date_from: r.date_from,
      date_to: r.date_to,
      initial_balance: r.initial_balance,
      current_balance: r.current_balance,
      status: r.status as Session["status"],
      created_at: r.created_at ?? now,
      updated_at: r.updated_at ?? now,
    }));
    return { strategies: st, sessions: sess };
  }, [now]);

  return (
    <div className="relative space-y-8">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-40 left-1/4 h-96 w-96 rounded-full opacity-[0.06] blur-3xl"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />
        <div
          className="absolute top-1/3 right-0 h-72 w-72 rounded-full opacity-[0.04] blur-3xl"
          style={{ background: "radial-gradient(circle, #38bdf8, transparent)" }}
        />
        <div
          className="absolute bottom-1/4 left-0 h-64 w-64 rounded-full opacity-[0.04] blur-3xl"
          style={{ background: "radial-gradient(circle, #4ade80, transparent)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1
            className="rs-page-title"
            style={{
              background: "linear-gradient(135deg, #e0e7ff 0%, #a78bfa 50%, #6366f1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Backtesting Lab
          </h1>
          <p className="rs-page-sub">Demo — same layout as the app; data is read-only from the sample lab.</p>
        </div>
        <span
          className="inline-flex cursor-not-allowed items-center gap-2 self-start rounded-xl bg-slate-800/50 px-4 py-2.5 font-mono text-sm font-semibold text-slate-500 sm:self-auto"
          title="Create strategies in the app after sign-up"
        >
          <Plus className="h-4 w-4" />
          New Strategy
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-4"
      >
        {strategies.map((strategy) => (
          <StrategyCard
            key={strategy.id}
            strategy={strategy}
            sessions={sessions.filter((s) => s.strategy_id === strategy.id)}
            onNewSession={() => {}}
            onDeleteStrategy={() => {}}
            onDeleteSession={() => {}}
            onEditStrategy={() => {}}
            sessionPathPrefix={SESSION_PREFIX}
          />
        ))}
      </motion.div>

      <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-[#6366f1]/20 bg-[#6366f1]/[0.05] px-4 py-4 text-sm font-mono text-[#a5b4fc]">
        <TrendingUp className="h-4 w-4 shrink-0" />
        <span>
          Try the full backtesting with real data —{" "}
          <Link href="/pricing" className="underline underline-offset-2 hover:text-white">
            start your free trial
          </Link>
          .
        </span>
        <FlaskConical className="h-4 w-4 shrink-0" />
      </div>
    </div>
  );
}
