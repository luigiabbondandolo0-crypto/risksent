"use client";

import Link from "next/link";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from "recharts";
import { ChevronLeft, Play, Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { fmtPrice } from "@/lib/backtesting/symbolMap";
import type { Session, Trade, SessionStats } from "@/lib/backtesting/types";

type KpiTone = "indigo" | "emerald" | "red" | "cyan" | "violet";

const KPI_GLASS: Record<
  KpiTone,
  { background: string; borderColor: string; boxShadow: string; blob: string }
> = {
  indigo: {
    background: "rgba(99,102,241,0.04)",
    borderColor: "rgba(99,102,241,0.2)",
    boxShadow: "0 0 20px rgba(99,102,241,0.08)",
    blob: "#6366f1",
  },
  emerald: {
    background: "rgba(74,222,128,0.04)",
    borderColor: "rgba(74,222,128,0.2)",
    boxShadow: "0 0 22px rgba(74,222,128,0.08)",
    blob: "#4ade80",
  },
  red: {
    background: "rgba(248,113,113,0.04)",
    borderColor: "rgba(248,113,113,0.2)",
    boxShadow: "0 0 22px rgba(248,113,113,0.08)",
    blob: "#f87171",
  },
  cyan: {
    background: "rgba(56,189,248,0.04)",
    borderColor: "rgba(56,189,248,0.2)",
    boxShadow: "0 0 20px rgba(56,189,248,0.08)",
    blob: "#38bdf8",
  },
  violet: {
    background: "rgba(167,139,250,0.04)",
    borderColor: "rgba(167,139,250,0.2)",
    boxShadow: "0 0 22px rgba(167,139,250,0.08)",
    blob: "#a78bfa",
  },
};

function kpi(
  label: string,
  value: string,
  sub?: string,
  color?: string,
  tone: KpiTone = "indigo"
) {
  const g = KPI_GLASS[tone];
  return (
    <div
      className="relative overflow-hidden rounded-xl border px-4 py-3 backdrop-blur-xl"
      style={{ background: g.background, borderColor: g.borderColor, boxShadow: g.boxShadow }}
    >
      <div
        className="pointer-events-none absolute right-0 top-0 h-14 w-14 rounded-full opacity-20 blur-2xl"
        style={{ background: `radial-gradient(circle, ${g.blob}, transparent)` }}
      />
      <div className="relative z-10">
        <p className="font-mono text-[10px] uppercase tracking-wider text-slate-600">{label}</p>
        <p className={`mt-1 font-display text-xl font-bold ${color ?? "text-white"}`}>{value}</p>
        {sub && <p className="font-mono text-[10px] text-slate-600">{sub}</p>}
      </div>
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

export type BacktestingSessionResultsViewProps = {
  session: Session;
  trades: Trade[];
  stats: SessionStats;
  sessionId: string;
  backToLabHref: string;
  replayHref: string;
};

export function BacktestingSessionResultsView({
  session,
  trades,
  stats,
  sessionId: id,
  backToLabHref,
  replayHref,
}: BacktestingSessionResultsViewProps) {
  const closed = trades.filter((t) => t.status === "closed");
  const pl = session.current_balance - session.initial_balance;
  const plColor = pl >= 0 ? "text-[#4ade80]" : "text-[#f87171]";

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
    fill: (t.pnl ?? 0) >= 0 ? "#4ade80" : "#f87171",
  }));

  // Pie
  const pieData = [
    { name: "Wins", value: stats.wins, fill: "#4ade80" },
    { name: "Losses", value: stats.losses, fill: "#f87171" },
  ];

  return (
    <div className="relative space-y-6">
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500">Backtest</p>
          <div className="mb-2 flex items-center gap-2">
            <Link href={backToLabHref} className="flex items-center gap-1 font-mono text-[11px] text-slate-500 hover:text-slate-300 transition-colors">
              <ChevronLeft className="h-3.5 w-3.5" />
              Lab
            </Link>
            <span className="text-slate-700">/</span>
            <span className="font-mono text-[11px] text-slate-500">{session.name}</span>
          </div>
          <h1
            className="rs-page-title"
            style={{
              background: "linear-gradient(135deg, #e0e7ff 0%, #a78bfa 50%, #6366f1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {session.symbol} Results
          </h1>
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
            href={replayHref}
            className="flex items-center gap-2 rounded-xl bg-[#6366f1] px-4 py-2.5 font-mono text-sm font-semibold text-white transition-all hover:bg-[#4f46e5]"
          >
            <Play className="h-4 w-4" />
            Continue Replay
          </Link>
        </div>
      </motion.div>

      {/* KPI row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8"
      >
        {kpi("Trades", String(stats.totalTrades), undefined, undefined, "indigo")}
        {kpi(
          "Win Rate",
          stats.totalTrades > 0 ? `${stats.winRate.toFixed(1)}%` : "—",
          undefined,
          stats.winRate >= 50 ? "text-[#4ade80]" : "text-[#f87171]",
          stats.winRate >= 50 ? "emerald" : "red"
        )}
        {kpi("Net P&L", `${pl >= 0 ? "+" : ""}$${pl.toFixed(2)}`, undefined, plColor, pl >= 0 ? "emerald" : "red")}
        {kpi(
          "Profit Factor",
          stats.profitFactor === Infinity ? "∞" : stats.profitFactor > 0 ? stats.profitFactor.toFixed(2) : "—",
          undefined,
          stats.profitFactor >= 1 ? "text-[#4ade80]" : "text-[#f87171]",
          stats.profitFactor >= 1 ? "emerald" : "red"
        )}
        {kpi("Max DD", `$${stats.maxDrawdown.toFixed(0)}`, undefined, "text-[#f87171]", "red")}
        {kpi("Avg R:R", stats.avgRR > 0 ? `1:${stats.avgRR.toFixed(2)}` : "—", undefined, undefined, "cyan")}
        {kpi("Best", stats.bestTrade > 0 ? `+$${stats.bestTrade.toFixed(2)}` : "—", undefined, "text-[#4ade80]", "emerald")}
        {kpi("Worst", stats.worstTrade < 0 ? `-$${Math.abs(stats.worstTrade).toFixed(2)}` : "—", undefined, "text-[#f87171]", "red")}
      </motion.div>

      {/* Charts row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >

        {/* Equity curve */}
        <div
          className="rs-card relative col-span-2 overflow-hidden p-5"
          style={{
            background: "rgba(99,102,241,0.04)",
            borderColor: "rgba(99,102,241,0.2)",
            boxShadow: "0 0 24px rgba(99,102,241,0.08)",
          }}
        >
          <div
            className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-full opacity-20 blur-2xl"
            style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
          />
          <p className="rs-section-title relative z-10 mb-4">Equity Curve</p>
          <div className="relative z-10">
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
        </div>

        {/* Wins / Losses pie */}
        <div
          className="rs-card relative overflow-hidden p-5"
          style={{
            background: "rgba(167,139,250,0.04)",
            borderColor: "rgba(167,139,250,0.2)",
            boxShadow: "0 0 24px rgba(167,139,250,0.08)",
          }}
        >
          <div
            className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-full opacity-20 blur-2xl"
            style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }}
          />
          <p className="rs-section-title relative z-10 mb-4">Win / Loss</p>
          {closed.length === 0 ? (
            <div className="relative z-10 flex h-[220px] items-center justify-center font-mono text-sm text-slate-700">No trades yet</div>
          ) : (
            <div className="relative z-10">
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
            </div>
          )}
          <div className="relative z-10 mt-2 flex justify-center gap-6 font-mono text-[11px]">
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#4ade80]" /><span className="text-slate-400">{stats.wins} W</span></div>
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#f87171]" /><span className="text-slate-400">{stats.losses} L</span></div>
          </div>
        </div>

        {/* P&L bar chart */}
        <div
          className="rs-card relative col-span-1 overflow-hidden p-5 lg:col-span-3"
          style={{
            background: "rgba(56,189,248,0.04)",
            borderColor: "rgba(56,189,248,0.2)",
            boxShadow: "0 0 24px rgba(56,189,248,0.08)",
          }}
        >
          <div
            className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-full opacity-20 blur-2xl"
            style={{ background: "radial-gradient(circle, #38bdf8, transparent)" }}
          />
          <p className="rs-section-title relative z-10 mb-4">P&L per Trade</p>
          <div className="relative z-10">
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
        </div>
      </motion.div>

      {/* Trades table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="rs-card relative overflow-hidden"
        style={{
          background: "rgba(99,102,241,0.04)",
          borderColor: "rgba(99,102,241,0.2)",
          boxShadow: "0 0 24px rgba(99,102,241,0.08)",
        }}
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full opacity-15 blur-2xl"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />
        <div className="relative z-10">
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
                  <tr key={t.id} className={`border-b border-white/[0.03] transition-colors hover:bg-white/[0.02] ${isWin ? "bg-[#4ade80]/[0.02]" : "bg-[#f87171]/[0.02]"}`}>
                    <td className="px-4 py-2.5 text-slate-600">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <span className={`flex items-center gap-1 ${t.direction === "BUY" ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                        {t.direction === "BUY" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {t.direction}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-300">{fmtPrice(t.symbol, t.entry_price)}</td>
                    <td className="px-4 py-2.5 text-slate-300">{t.exit_price != null ? fmtPrice(t.symbol, t.exit_price) : <Minus className="h-3 w-3 text-slate-700" />}</td>
                    <td className="px-4 py-2.5 text-[#f87171]/60">{t.stop_loss != null ? fmtPrice(t.symbol, t.stop_loss) : "—"}</td>
                    <td className="px-4 py-2.5 text-[#4ade80]/60">{t.take_profit != null ? fmtPrice(t.symbol, t.take_profit) : "—"}</td>
                    <td className={`px-4 py-2.5 font-semibold ${isWin ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                      {isWin ? "+" : ""}{(t.pnl ?? 0).toFixed(2)}
                    </td>
                    <td className={`px-4 py-2.5 ${isWin ? "text-[#4ade80]/70" : "text-[#f87171]/70"}`}>
                      {t.pips != null ? `${t.pips >= 0 ? "+" : ""}${t.pips.toFixed(1)}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">{t.risk_reward != null ? `1:${t.risk_reward.toFixed(2)}` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>
      </motion.div>
    </div>
  );
}
