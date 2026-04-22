"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, FlaskConical } from "lucide-react";
import { useSubscription } from "@/lib/subscription/SubscriptionContext";
import { CreateStrategyModal } from "@/components/backtesting/CreateStrategyModal";
import { CreateSessionModal } from "@/components/backtesting/CreateSessionModal";
import { StrategyCard } from "@/components/backtesting/StrategyCard";
import { buildDemoBacktestingSeed } from "@/lib/demo/demoBacktestingSeed";
import type { Strategy, Session } from "@/lib/backtesting/types";

type StrategiesResponse = { strategies: Strategy[] };
type SessionsResponse = { sessions: Session[] };

export default function BacktestingPage() {
  const sub = useSubscription();
  const isDemoMode = Boolean(sub?.isDemoMode);
  const subLoaded = sub !== null && sub !== undefined;

  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateStrategy, setShowCreateStrategy] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [createSessionForStrategy, setCreateSessionForStrategy] = useState<string | undefined>();
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);

  // Load demo seed when in demo mode
  useEffect(() => {
    if (!subLoaded || !isDemoMode) return;
    const seed = buildDemoBacktestingSeed();
    const now = new Date().toISOString();
    setStrategies(
      seed.strategies.map((s) => ({
        ...s,
        created_at: s.created_at ?? now,
        updated_at: now,
      })) as unknown as Strategy[]
    );
    setSessions(
      seed.sessions.map((s) => ({
        ...s,
        created_at: s.created_at ?? now,
        updated_at: now,
      })) as unknown as Session[]
    );
    setLoading(false);
  }, [subLoaded, isDemoMode]);

  const load = useCallback(async () => {
    if (!subLoaded || isDemoMode) return;
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
  }, [subLoaded, isDemoMode]);

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
        {!isDemoMode && (
          <button
            type="button"
            onClick={() => setShowCreateStrategy(true)}
            className="flex items-center gap-2 self-start rounded-xl bg-[#6366f1] px-4 py-2.5 font-mono text-sm font-semibold text-white transition-all hover:bg-[#4f46e5] sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            New Strategy
          </button>
        )}
      </motion.div>


      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="rs-card h-24 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state - real users only */}
      {!loading && !isDemoMode && strategies.length === 0 && (
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

      {/* Strategy list */}
      {!loading && strategies.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={`space-y-4 ${isDemoMode ? "pointer-events-none select-none opacity-50 blur-[1.5px]" : ""}`}
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

      {/* Modals - real users only */}
      {!isDemoMode && (
        <>
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
        </>
      )}
    </div>
  );
}
