"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DEFAULT_SESSION_SYMBOL, SESSION_SYMBOL_GROUPS } from "@/lib/backtesting/sessionSymbols";
import { bt } from "./btClasses";

type StrategyOpt = { id: string; name: string };

type Props = { basePath: string };

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
    const list = (j.strategies ?? []) as { id: string; name: string }[];
    setStrategies(list);
  }, []);

  useEffect(() => {
    void loadStrategies();
  }, [loadStrategies]);

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
    if (!strategyId) {
      setErr("Create a strategy first.");
      return;
    }
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-lg space-y-6">
      <Link href={basePath} className="text-xs text-slate-500 hover:text-slate-300 font-mono">
        ← Back
      </Link>
      <h1 className={bt.h1}>New session</h1>
      <p className="text-xs text-slate-500 font-mono">
        Timeframe is chosen on the replay chart. Pick symbol and date range here.
      </p>
      <form onSubmit={(e) => void submit(e)} className={`${bt.card} space-y-4`}>
        {err && <p className="text-sm text-red-400 font-mono">{err}</p>}
        <div>
          <label className={bt.label}>Session name</label>
          <input className={bt.input} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className={bt.label}>Strategy</label>
          <select
            className={bt.input}
            value={strategyId}
            onChange={(e) => setStrategyId(e.target.value)}
            required
          >
            {strategies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {strategies.length === 0 && (
            <p className="mt-2 text-xs text-amber-400/90 font-mono">
              <Link href={`${basePath}/strategy/new`} className="underline">
                Create a strategy
              </Link>{" "}
              first.
            </p>
          )}
        </div>
        <div>
          <label className={bt.label}>Symbol</label>
          <select className={bt.input} value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            {SESSION_SYMBOL_GROUPS.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.symbols.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={bt.label}>Date from</label>
            <input
              className={bt.input}
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={bt.label}>Date to</label>
            <input
              className={bt.input}
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label className={bt.label}>Initial balance</label>
          <input
            className={bt.input}
            type="number"
            min={100}
            step={100}
            value={initialBalance}
            onChange={(e) => setInitialBalance(Number(e.target.value))}
          />
        </div>
        <button type="submit" disabled={saving || strategies.length === 0} className={bt.btnPrimary}>
          {saving ? "Creating…" : "Start replay"}
        </button>
      </form>
    </motion.div>
  );
}
