"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from "recharts";
import { ChevronLeft, Play, Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { fmtPrice } from "@/lib/backtesting/symbolMap";
import type { Session, Trade, SessionStats } from "@/lib/backtesting/types";

type SessionResponse = { session: Session; trades: Trade[]; stats: SessionStats };

function kpi(label: string, value: string, sub?: string, color?: string) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-600">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold ${color ?? "text-white"}`}>{value}</p>
      {sub && <p className="font-mono text-[10px] text-slate-600">{sub}</p>}
    </div>
  );
}

function exportCsv(trades: Trade[], symbol: string) {
  const header = "# , Direction, Entry, Exit, SL, TP, P&L, Pips, R:R, Entry Time, Exit Time";
  const rows = trades.filter((t) => t.status === "closed").map((t, i) =>
    [i + 1, t.direction, t.entry_price, t.exit_price ?? "", t.stop_loss ?? "", t.take_profit ?? "",
     t.pnl?.toFixed(2) ?? "", t.pips?.toFixed(1) ?? "", t.risk_reward?.toFixed(2) ?? "",
     t.entry_time, t.exit_time ?? ""].join(",")
  );
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${symbol}_results.csv`; a.click();
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/backtesting/sessions/${id}`)
      .then((r) => r.json() as Promise<SessionResponse>)
      .then(({ session: s, trades: t, stats: st }) => {
        setSession(s); setTrades(t); setStats(st);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#6366f1]" />
      </div>
    );
  }

  if (!session || !stats) {
    return <div className="flex h-[60vh] items-center justify-center font-mono text-sm text-slate-600">Session not found</div>;
  }

  const closed = trades.filter((t) => t.status === "closed");
  const pl = session.current_balance - session.initial_balance;
  const plColor = pl >= 0 ? "text-[#00e676]" : "text-[#ff3c3c]";

  // Equity curve data
  let running = session.initial_balance;
  const equityData = [{ trade: 0, balance: running }];
  for (const t of closed) {
    running += t.pnl ?? 0;
    equityData.push({ trade: equityData.length, balance: Math.round(running * 100) / 100 });
  }

  // P&L distribution
  const pnlData = closed.map((t, i) => ({
    n: i + 1,
    pnl: t.pnl ?? 0,
    fill: (t.pnl ?? 0) >= 0 ? "#00e676" : "#ff3c3c",
  }));

  // Pie
  const pieData = [
    { name: "Wins", value: stats.wins, fill: "#00e676" },
    { name: "Losses", value: stats.losses, fill: "#ff3c3c" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Link href="/app/backtesting" className="flex items-center gap-1 font-mono text-[11px] text-slate-500 hover:text-slate-300 transition-colors">
              <ChevronLeft className="h-3.5 w-3.5" />
              Lab
            </Link>
            <span className="text-slate-700">/</span>
            <span className="font-mono text-[11px] text-slate-500">{session.name}</span>
          </div>
          <h1 className="rs-page-title">{session.symbol} Results</h1>
          <p className="rs-page-sub">{session.timeframe} · {session.date_from} → {session.date_to}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportCsv(trades, session.symbol)}
            className="flex items-center gap-2 rounded-xl border border-white/[0.07] px-4 py-2.5 font-mono text-sm text-slate-400 transition-all hover:border-white/[0.15] hover:text-slate-200"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <Link
            href={`/app/backtesting/session/${id}/replay`}
            className="flex items-center gap-2 rounded-xl bg-[#6366f1] px-4 py-2.5 font-mono text-sm font-semibold text-white transition-all hover:bg-[#4f46e5]"
          >
            <Play className="h-4 w-4" />
            Continue Replay
          </Link>
        </div>
      </motion.div>

      {/* KPI row */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {kpi("Trades", String(stats.totalTrades))}
        {kpi("Win Rate", stats.totalTrades > 0 ? `${stats.winRate.toFixed(1)}%` : "—", undefined, stats.winRate >= 50 ? "text-[#00e676]" : "text-[#ff3c3c]")}
        {kpi("Net P&L", `${pl >= 0 ? "+" : ""}$${pl.toFixed(2)}`, undefined, plColor)}
        {kpi("Profit Factor", stats.profitFactor === Infinity ? "∞" : stats.profitFactor > 0 ? stats.profitFactor.toFixed(2) : "—", undefined, stats.profitFactor >= 1 ? "text-[#00e676]" : "text-[#ff3c3c]")}
        {kpi("Max DD", `$${stats.maxDrawdown.toFixed(0)}`, undefined, "text-[#ff3c3c]")}
        {kpi("Avg R:R", stats.avgRR > 0 ? `1:${stats.avgRR.toFixed(2)}` : "—")}
        {kpi("Best", stats.bestTrade > 0 ? `+$${stats.bestTrade.toFixed(2)}` : "—", undefined, "text-[#00e676]")}
        {kpi("Worst", stats.worstTrade < 0 ? `-$${Math.abs(stats.worstTrade).toFixed(2)}` : "—", undefined, "text-[#ff3c3c]")}
      </motion.div>

      {/* Charts row */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Equity curve */}
        <div className="rs-card col-span-2 p-5">
          <p className="rs-section-title mb-4">Equity Curve</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={equityData} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="0" />
              <XAxis dataKey="trade" tick={{ fontSize: 10, fill: "#64748b", fontFamily: "var(--font-mono)" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b", fontFamily: "var(--font-mono)" }} />
              <Tooltip
                contentStyle={{ background: "#0d0d18", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 11 }}
                labelStyle={{ color: "#64748b" }}
                itemStyle={{ color: "#fff" }}
              />
              <ReferenceLine y={session.initial_balance} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
              <Line
                type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2}
                dot={false} activeDot={{ r: 3, fill: "#6366f1" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Wins / Losses pie */}
        <div className="rs-card p-5">
          <p className="rs-section-title mb-4">Win / Loss</p>
          {closed.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center font-mono text-sm text-slate-700">No trades yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" paddingAngle={2}>
                  {pieData.map((e) => <Cell key={e.name} fill={e.fill} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#0d0d18", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-2 flex justify-center gap-6 font-mono text-[11px]">
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#00e676]" /><span className="text-slate-400">{stats.wins} W</span></div>
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#ff3c3c]" /><span className="text-slate-400">{stats.losses} L</span></div>
          </div>
        </div>

        {/* P&L bar chart */}
        <div className="rs-card col-span-1 p-5 lg:col-span-3">
          <p className="rs-section-title mb-4">P&L per Trade</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={pnlData} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="0" />
              <XAxis dataKey="n" tick={{ fontSize: 10, fill: "#64748b", fontFamily: "var(--font-mono)" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b", fontFamily: "var(--font-mono)" }} />
              <Tooltip
                contentStyle={{ background: "#0d0d18", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 11 }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, "P&L"]}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
              <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                {pnlData.map((d, i) => <Cell key={i} fill={d.fill} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Trades table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rs-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
          <p className="rs-section-title">Trade Log ({closed.length})</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-[12px]">
            <thead>
              <tr className="border-b border-white/[0.04] bg-white/[0.01] text-left">
                {["#", "Dir", "Entry", "Exit", "SL", "TP", "P&L", "Pips", "R:R"].map((h) => (
                  <th key={h} className="px-4 py-2.5 font-medium text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {closed.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-700">No closed trades yet</td></tr>
              )}
              {closed.map((t, i) => {
                const isWin = (t.pnl ?? 0) > 0;
                return (
                  <tr key={t.id} className={`border-b border-white/[0.03] transition-colors hover:bg-white/[0.02] ${isWin ? "bg-[#00e676]/[0.02]" : "bg-[#ff3c3c]/[0.02]"}`}>
                    <td className="px-4 py-2.5 text-slate-600">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <span className={`flex items-center gap-1 ${t.direction === "BUY" ? "text-[#00e676]" : "text-[#ff3c3c]"}`}>
                        {t.direction === "BUY" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {t.direction}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-300">{fmtPrice(t.symbol, t.entry_price)}</td>
                    <td className="px-4 py-2.5 text-slate-300">{t.exit_price != null ? fmtPrice(t.symbol, t.exit_price) : <Minus className="h-3 w-3 text-slate-700" />}</td>
                    <td className="px-4 py-2.5 text-[#ff3c3c]/60">{t.stop_loss != null ? fmtPrice(t.symbol, t.stop_loss) : "—"}</td>
                    <td className="px-4 py-2.5 text-[#00e676]/60">{t.take_profit != null ? fmtPrice(t.symbol, t.take_profit) : "—"}</td>
                    <td className={`px-4 py-2.5 font-semibold ${isWin ? "text-[#00e676]" : "text-[#ff3c3c]"}`}>
                      {isWin ? "+" : ""}{(t.pnl ?? 0).toFixed(2)}
                    </td>
                    <td className={`px-4 py-2.5 ${isWin ? "text-[#00e676]/70" : "text-[#ff3c3c]/70"}`}>
                      {t.pips != null ? `${t.pips >= 0 ? "+" : ""}${t.pips.toFixed(1)}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">{t.risk_reward != null ? `1:${t.risk_reward.toFixed(2)}` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
