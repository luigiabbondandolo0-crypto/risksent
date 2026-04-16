"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FlaskConical, Calendar, Wallet, Globe, Plus } from "lucide-react";
import { DEFAULT_SESSION_SYMBOL, SESSION_SYMBOL_GROUPS } from "@/lib/backtesting/sessionSymbols";

type StrategyOpt = { id: string; name: string };
type Props = { basePath: string };

const PRESET_RANGES: { label: string; from: string; to: string }[] = [
  { label: "Jan 2024", from: "2024-01-01", to: "2024-02-01" },
  { label: "Q1 2024", from: "2024-01-01", to: "2024-04-01" },
  { label: "H1 2024", from: "2024-01-01", to: "2024-07-01" },
  { label: "2024 full", from: "2024-01-01", to: "2025-01-01" },
];

const BALANCE_PRESETS = [1000, 5000, 10000, 25000, 100000];

export function BacktestingSessionNew({ basePath }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const preStrategy = sp.get("strategy_id") ?? "";

  const [strategies, setStrategies] = useState<StrategyOpt[]>([]);
  const [name, setName] = useState("Replay session");
  const [strategyId, setStrategyId] = useState(preStrategy);
  const [symbol, setSymbol] = useState(DEFAULT_SESSION_SYMBOL);
  const [dateFrom, setDateFrom] = useState("2024-01-01");
  const [dateTo, setDateTo] = useState("2024-06-01");
  const [initialBalance, setInitialBalance] = useState(10000);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadStrategies = useCallback(async () => {
    const res = await fetch("/api/backtesting/strategies");
    if (!res.ok) return;
    const j = await res.json();
    const list = (j.strategies ?? []) as StrategyOpt[];
    setStrategies(list);
  }, []);

  useEffect(() => { void loadStrategies(); }, [loadStrategies]);

  useEffect(() => {
    if (preStrategy) setStrategyId(preStrategy);
  }, [preStrategy]);

  useEffect(() => {
    setStrategyId((cur) => {
      if (preStrategy) return preStrategy;
      if (cur) return cur;
      return strategies[0]?.id ?? "";
    });
  }, [preStrategy, strategies]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strategyId) { setErr("Create a strategy first."); return; }
    setSaving(true);
    setErr(null);
    const res = await fetch("/api/backtesting/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        strategy_id: strategyId,
        name: name.trim(),
        symbol,
        date_from: dateFrom,
        date_to: dateTo,
        initial_balance: initialBalance
      })
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error ?? "Failed");
      return;
    }
    const j = await res.json();
    const id = j.session?.id as string;
    router.push(`${basePath}/session/${id}/replay`);
    router.refresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-xl"
    >
      <Link
        href={basePath}
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to dashboard
      </Link>

      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10">
          <FlaskConical className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-white">
            New session
          </h1>
          <p className="mt-0.5 text-sm font-mono text-slate-500">
            Pick a symbol, date range, and starting balance to begin replaying.
          </p>
        </div>
      </div>

      <form onSubmit={(e) => void submit(e)} className="space-y-3">
        {err && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-mono text-red-300">
            {err}
          </div>
        )}

        {/* Session info */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="h-3.5 w-3.5 text-cyan-400/70" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">Session info</span>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-mono font-medium uppercase tracking-wider text-slate-500">
              Session name
            </label>
            <input
              className="w-full rounded-xl border border-white/[0.08] bg-[#0c0c0e] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-[#6366f1]/40 focus:ring-2 focus:ring-[#6366f1]/20 font-mono"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-mono font-medium uppercase tracking-wider text-slate-500">
              Strategy
            </label>
            {strategies.length > 0 ? (
              <select
                className="w-full rounded-xl border border-white/[0.08] bg-[#0c0c0e] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-[#6366f1]/40 focus:ring-2 focus:ring-[#6366f1]/20 font-mono"
                value={strategyId}
                onChange={(e) => setStrategyId(e.target.value)}
                required
              >
                {strategies.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            ) : (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-mono text-amber-400/80">No strategies yet</span>
                <Link
                  href={`${basePath}/strategy/new`}
                  className="flex items-center gap-1 rounded-lg border border-amber-500/30 px-2.5 py-1 text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Create one
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Market */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-3.5 w-3.5 text-[#6366f1]/70" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">Market</span>
          </div>
          <label className="mb-1.5 block text-[11px] font-mono font-medium uppercase tracking-wider text-slate-500">
            Symbol
          </label>
          <select
            className="w-full rounded-xl border border-white/[0.08] bg-[#0c0c0e] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-[#6366f1]/40 focus:ring-2 focus:ring-[#6366f1]/20 font-mono"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          >
            {SESSION_SYMBOL_GROUPS.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.symbols.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-3.5 w-3.5 text-[#6366f1]/70" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">Date range</span>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PRESET_RANGES.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => { setDateFrom(p.from); setDateTo(p.to); }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-mono transition-colors ${
                  dateFrom === p.from && dateTo === p.to
                    ? "bg-[#6366f1]/20 text-[#818cf8] border border-[#6366f1]/30"
                    : "border border-white/[0.07] text-slate-500 hover:text-slate-300 hover:border-white/[0.12]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-mono font-medium uppercase tracking-wider text-slate-500">
                From
              </label>
              <input
                className="w-full rounded-xl border border-white/[0.08] bg-[#0c0c0e] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-[#6366f1]/40 focus:ring-2 focus:ring-[#6366f1]/20 font-mono"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-mono font-medium uppercase tracking-wider text-slate-500">
                To
              </label>
              <input
                className="w-full rounded-xl border border-white/[0.08] bg-[#0c0c0e] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-[#6366f1]/40 focus:ring-2 focus:ring-[#6366f1]/20 font-mono"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Capital */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="h-3.5 w-3.5 text-[#6366f1]/70" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">Starting capital</span>
          </div>

          {/* Balance presets */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {BALANCE_PRESETS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setInitialBalance(b)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-mono transition-colors ${
                  initialBalance === b
                    ? "bg-[#6366f1]/20 text-[#818cf8] border border-[#6366f1]/30"
                    : "border border-white/[0.07] text-slate-500 hover:text-slate-300 hover:border-white/[0.12]"
                }`}
              >
                ${b.toLocaleString()}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-mono font-medium uppercase tracking-wider text-slate-500">
              Custom amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">$</span>
              <input
                className="w-full rounded-xl border border-white/[0.08] bg-[#0c0c0e] pl-7 pr-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-[#6366f1]/40 focus:ring-2 focus:ring-[#6366f1]/20 font-mono"
                type="number"
                min={100}
                step={100}
                value={initialBalance}
                onChange={(e) => setInitialBalance(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saving || strategies.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f46e5] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#6366f1]/20 transition hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Creating…" : "Start replay →"}
          </button>
          <Link
            href={basePath}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
          >
            Cancel
          </Link>
        </div>
      </form>
    </motion.div>
  );
}
