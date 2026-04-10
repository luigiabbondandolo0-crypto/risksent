"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CartesianGrid,
  Line,
  LineChart as RLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { BtTradeRow } from "@/lib/backtesting/btTypes";
import { bt } from "./btClasses";

type SessionPayload = {
  id: string;
  name: string;
  symbol: string;
  timeframe: string;
  date_from: string;
  date_to: string;
  initial_balance: number;
  current_balance: number;
  strategy_id: string;
};

type StrategyPayload = { id: string; name: string; description: string | null };

type Props = {
  sessionId: string;
  basePath: string;
};

export function SessionSummaryView({ sessionId, basePath }: Props) {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [strategy, setStrategy] = useState<StrategyPayload | null>(null);
  const [trades, setTrades] = useState<BtTradeRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/backtesting/sessions/${sessionId}`);
    if (!res.ok) {
      setErr("Not found");
      return;
    }
    const j = await res.json();
    setSession(j.session);
    setStrategy(j.strategy);
    setTrades(j.trades ?? []);
  }, [sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const equityData = useMemo(() => {
    if (!session) return [];
    const closed = trades
      .filter((t) => t.status === "closed" && t.exit_time)
      .sort((a, b) => new Date(a.exit_time ?? "").getTime() - new Date(b.exit_time ?? "").getTime());
    let bal = session.initial_balance;
    const pts: { t: string; balance: number }[] = [{ t: "start", balance: bal }];
    for (const tr of closed) {
      bal += tr.pl ?? 0;
      pts.push({ t: (tr.exit_time ?? "").slice(0, 16), balance: bal });
    }
    return pts;
  }, [session, trades]);

  const stats = useMemo(() => {
    const closed = trades.filter((t) => t.status === "closed" && t.pl != null);
    const wins = closed.filter((t) => (t.pl as number) > 0).length;
    const losses = closed.filter((t) => (t.pl as number) < 0).length;
    const decided = wins + losses;
    const wr = decided > 0 ? (wins / decided) * 100 : 0;
    const total = closed.reduce((a, t) => a + (t.pl ?? 0), 0);
    const rr = closed.map((t) => t.risk_reward).filter((x): x is number => x != null);
    const avgRr = rr.length ? rr.reduce((a, b) => a + b, 0) / rr.length : 0;
    let peak = session?.initial_balance ?? 0;
    let maxDd = 0;
    let bal = session?.initial_balance ?? 0;
    for (const tr of closed.sort(
      (a, b) => new Date(a.exit_time ?? "").getTime() - new Date(b.exit_time ?? "").getTime()
    )) {
      bal += tr.pl ?? 0;
      if (bal > peak) peak = bal;
      const dd = peak > 0 ? ((peak - bal) / peak) * 100 : 0;
      if (dd > maxDd) maxDd = dd;
    }
    return { wins, losses, wr, total, avgRr, maxDd, n: closed.length };
  }, [trades, session]);

  if (err || !session) {
    return (
      <div className="space-y-4">
        <p className="text-red-400 text-sm font-[family-name:var(--font-mono)]">{err ?? "Loading…"}</p>
        <Link href={basePath} className="text-[#ff3c3c] underline text-sm">
          Back
        </Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <Link
          href={basePath}
          className="text-xs text-slate-500 hover:text-slate-300 font-[family-name:var(--font-mono)]"
        >
          ← Dashboard
        </Link>
        {strategy && (
          <p className="mt-2 text-xs text-slate-500 font-[family-name:var(--font-mono)]">
            Strategy:{" "}
            <Link href={basePath} className="text-[#ff3c3c] underline">
              {strategy.name}
            </Link>
          </p>
        )}
        <h1 className={`${bt.h1} mt-2`}>{session.name}</h1>
        <p className={bt.sub}>
          {session.symbol} · {session.date_from} → {session.date_to}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Balance", val: session.current_balance.toFixed(2), color: "text-white" },
          { label: "Win rate", val: `${stats.wr.toFixed(1)}%`, color: "text-[#00e676]" },
          { label: "Avg R:R", val: stats.avgRr.toFixed(2), color: "text-slate-200" },
          { label: "Max DD", val: `${stats.maxDd.toFixed(2)}%`, color: "text-[#ff3c3c]" }
        ].map((x) => (
          <div key={x.label} className={bt.card}>
            <p className={bt.label}>{x.label}</p>
            <p className={`font-[family-name:var(--font-display)] text-2xl font-bold ${x.color}`}>{x.val}</p>
          </div>
        ))}
      </div>

      <div className={bt.card}>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-bold text-white">Equity curve</h2>
        <div className="h-72 w-full">
          {equityData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RLineChart data={equityData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="t" tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  tickFormatter={(v) => Number(v).toFixed(0)}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0f0f12",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    fontSize: 12
                  }}
                />
                <Line type="monotone" dataKey="balance" stroke="#ff3c3c" strokeWidth={2} dot={false} />
              </RLineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-600 font-[family-name:var(--font-mono)]">No closed trades yet.</p>
          )}
        </div>
      </div>

      <div className={bt.card}>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-bold text-white">Trades</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] font-[family-name:var(--font-mono)]">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-500">
                <th className="pb-2 pr-2">Dir</th>
                <th className="pb-2 pr-2">Entry</th>
                <th className="pb-2 pr-2">Exit</th>
                <th className="pb-2 pr-2">Lots</th>
                <th className="pb-2 pr-2">P&amp;L</th>
                <th className="pb-2">R:R</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.id} className="border-b border-white/[0.04] text-slate-300">
                  <td className="py-2 pr-2">{t.direction}</td>
                  <td className="py-2 pr-2">{t.entry_price.toFixed(5)}</td>
                  <td className="py-2 pr-2">{t.exit_price != null ? t.exit_price.toFixed(5) : "—"}</td>
                  <td className="py-2 pr-2">{t.lot_size}</td>
                  <td className={`py-2 pr-2 ${(t.pl ?? 0) >= 0 ? "text-[#00e676]" : "text-[#ff3c3c]"}`}>
                    {t.pl != null ? t.pl.toFixed(2) : "—"}
                  </td>
                  <td className="py-2">{t.risk_reward != null ? t.risk_reward.toFixed(2) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Link
        href={`${basePath}/session/${sessionId}/replay`}
        className="inline-block text-sm text-[#ff3c3c] underline font-[family-name:var(--font-mono)]"
      >
        ← Back to replay
      </Link>
    </motion.div>
  );
}
