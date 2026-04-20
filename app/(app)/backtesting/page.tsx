"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, FlaskConical } from "lucide-react";
import { useSubscription } from "@/lib/subscription/SubscriptionContext";
import { CreateStrategyModal } from "@/components/backtesting/CreateStrategyModal";
import { CreateSessionModal } from "@/components/backtesting/CreateSessionModal";
import { StrategyCard } from "@/components/backtesting/StrategyCard";
import type { Strategy, Session } from "@/lib/backtesting/types";

type StrategiesResponse = { strategies: Strategy[] };
type SessionsResponse = { sessions: Session[] };

export default function BacktestingPage() {
  const sub = useSubscription();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateStrategy, setShowCreateStrategy] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [createSessionForStrategy, setCreateSessionForStrategy] = useState<string | undefined>();
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [strRes, sessRes] = await Promise.all([
      fetch("/api/backtesting/strategies"),
      fetch("/api/backtesting/sessions"),
    ]);
    if (strRes.ok) {
      const j = await strRes.json() as StrategiesResponse;
      setStrategies(j.strategies ?? []);
    }
    if (sessRes.ok) {
      const j = await sessRes.json() as SessionsResponse;
      setSessions(j.sessions ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function deleteStrategy(id: string) {
    if (!confirm("Delete this strategy and ALL its sessions?")) return;
    await fetch(`/api/backtesting/strategies/${id}`, { method: "DELETE" });
    void load();
  }

  async function deleteSession(id: string) {
    if (!confirm("Delete this session?")) return;
    await fetch(`/api/backtesting/sessions/${id}`, { method: "DELETE" });
    void load();
  }

  async function saveEditStrategy(strategy: Strategy) {
    const name = prompt("Strategy name:", strategy.name);
    if (!name?.trim()) return;
    const description = prompt("Description (optional):", strategy.description ?? "");
    await fetch(`/api/backtesting/strategies/${strategy.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description?.trim() || null }),
    });
    void load();
    setEditingStrategy(null);
  }

  // Subscription gate
  const canAccess = sub?.canAccessBacktesting ?? true;
  if (!canAccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center">
          <p className="font-display text-xl font-bold text-white">Backtesting is a paid feature</p>
          <p className="mt-2 font-mono text-sm text-slate-500">Start your free trial to access strategy backtesting.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="rs-page-title">Backtesting Lab</h1>
          <p className="rs-page-sub">Test your strategies on real historical data.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateStrategy(true)}
          className="flex items-center gap-2 self-start rounded-xl bg-[#6366f1] px-4 py-2.5 font-mono text-sm font-semibold text-white transition-all hover:bg-[#4f46e5] sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          New Strategy
        </button>
      </motion.div>

      {/* Empty state */}
      {!loading && strategies.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rs-card flex flex-col items-center gap-5 py-16 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6366f1]/10">
            <FlaskConical className="h-8 w-8 text-[#818cf8]" />
          </div>
          <div>
            <p className="font-display text-xl font-bold text-white">Start your first strategy</p>
            <p className="mt-1.5 font-mono text-sm text-slate-500 max-w-xs mx-auto">
              Create a strategy to organise your backtesting sessions on any symbol and timeframe.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateStrategy(true)}
            className="rounded-xl bg-[#6366f1] px-6 py-2.5 font-mono text-sm font-semibold text-white transition-all hover:bg-[#4f46e5]"
          >
            Create Strategy
          </button>
        </motion.div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="rs-card h-24 animate-pulse" />
          ))}
        </div>
      )}

      {/* Strategy list */}
      {!loading && strategies.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {strategies.map((strategy) => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              sessions={sessions.filter((s) => s.strategy_id === strategy.id)}
              onNewSession={(sid) => { setCreateSessionForStrategy(sid); setShowCreateSession(true); }}
              onDeleteStrategy={deleteStrategy}
              onDeleteSession={deleteSession}
              onEditStrategy={(s) => { setEditingStrategy(s); void saveEditStrategy(s); }}
            />
          ))}
        </motion.div>
      )}

      {/* Modals */}
      <CreateStrategyModal
        open={showCreateStrategy}
        onClose={() => setShowCreateStrategy(false)}
        onCreated={() => void load()}
      />
      <CreateSessionModal
        open={showCreateSession}
        onClose={() => { setShowCreateSession(false); setCreateSessionForStrategy(undefined); }}
        strategies={strategies}
        defaultStrategyId={createSessionForStrategy}
      />
    </div>
  );
}
