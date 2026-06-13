"use client";

import Link from "next/link";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from "recharts";
import { ChevronLeft, Play, Download, TrendingUp, TrendingDown, Minus, Brain, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { motion } from "framer-motion";
import { fmtPrice } from "@/lib/backtesting/symbolMap";
import type { Session, Trade, SessionStats } from "@/lib/backtesting/types";

// ── AI Insights ──────────────────────────────────────────────────────────────

type Insight = { kind: "good" | "warn" | "info"; title: string; body: string };

function generateInsights(stats: SessionStats, closed: Trade[]): Insight[] {
  const insights: Insight[] = [];
  if (closed.length === 0) return insights;

  const avgWin = closed.filter((t) => (t.pnl ?? 0) > 0).reduce((s, t) => s + (t.pnl ?? 0), 0) / (stats.wins || 1);
  const avgLoss = Math.abs(closed.filter((t) => (t.pnl ?? 0) < 0).reduce((s, t) => s + (t.pnl ?? 0), 0) / (stats.losses || 1));

  // Win rate
  if (stats.winRate >= 60) {
    insights.push({ kind: "good", title: "Strong win rate", body: `${stats.winRate.toFixed(1)}% win rate is above the 60% threshold. Your entries are well-timed. Focus on maintaining this consistency.` });
  } else if (stats.winRate >= 50) {
    insights.push({ kind: "info", title: "Decent win rate", body: `${stats.winRate.toFixed(1)}% win rate is above break-even, but with a low R:R it may not sustain long-term. Aim for 55%+ or improve your R:R.` });
  } else {
    insights.push({ kind: "warn", title: "Win rate below 50%", body: `Only ${stats.winRate.toFixed(1)}% of trades won. Review your entry criteria — consider waiting for stronger confluences or tighter conditions before entering.` });
  }

  // R:R
  if (stats.avgRR >= 2) {
    insights.push({ kind: "good", title: "Excellent risk/reward", body: `Your average R:R of 1:${stats.avgRR.toFixed(2)} means you can still be profitable at a 35% win rate. Keep protecting this edge.` });
  } else if (stats.avgRR >= 1.2) {
    insights.push({ kind: "info", title: "Moderate risk/reward", body: `Average R:R of 1:${stats.avgRR.toFixed(2)} requires at least a ${(1 / (1 + stats.avgRR) * 100).toFixed(0)}% win rate to break even. Consider moving TP further or tightening SL at entry.` });
  } else if (stats.avgRR > 0) {
    insights.push({ kind: "warn", title: "Low risk/reward ratio", body: `Average R:R of 1:${stats.avgRR.toFixed(2)} is below 1:1.2. Your wins need to significantly outnumber losses to be profitable. Consider letting winning trades run longer.` });
  }

  // Profit factor
  if (stats.profitFactor >= 2) {
    insights.push({ kind: "good", title: "High profit factor", body: `Profit factor ${stats.profitFactor.toFixed(2)}x — for every $1 lost you earn $${stats.profitFactor.toFixed(2)}. This is a robust system.` });
  } else if (stats.profitFactor < 1 && stats.totalTrades > 3) {
    insights.push({ kind: "warn", title: "Profit factor below 1", body: `Profit factor ${stats.profitFactor.toFixed(2)}x means the system is losing money overall. Re-evaluate the strategy before trading it live.` });
  }

  // Win vs loss size ratio
  if (avgLoss > 0 && avgWin / avgLoss < 0.8 && stats.losses > 0) {
    insights.push({ kind: "warn", title: "Average loss > average win", body: `Your average win ($${avgWin.toFixed(0)}) is smaller than your average loss ($${avgLoss.toFixed(0)}). Cutting losses earlier or letting winners run further would improve your expectancy.` });
  }

  // Drawdown
  const ddPct = stats.maxDrawdown > 0 && closed.length > 0
    ? (stats.maxDrawdown / (closed[0]?.entry_price ?? 1)) * 100
    : 0;
  if (stats.maxDrawdown > 0) {
    const ddVsBalance = stats.maxDrawdown;
    if (ddVsBalance > Math.abs(stats.worstTrade) * 3 && stats.losses > 1) {
      insights.push({ kind: "warn", title: "Consecutive losing streak detected", body: `Your max drawdown of $${stats.maxDrawdown.toFixed(0)} suggests multiple consecutive losses. Consider a daily loss limit (e.g. 3% of balance) to stop trading after a rough session.` });
    }
  }

  // Consistency
  const pnls = closed.map((t) => t.pnl ?? 0);
  const maxSingleLoss = Math.abs(stats.worstTrade);
  const avgAbsPnl = pnls.reduce((s, p) => s + Math.abs(p), 0) / pnls.length;
  if (maxSingleLoss > avgAbsPnl * 3 && stats.losses > 0) {
    insights.push({ kind: "warn", title: "Inconsistent position sizing", body: `Your worst trade ($${maxSingleLoss.toFixed(0)}) is more than 3× your average trade size. This suggests inconsistent risk management — standardise your lot size relative to stop loss distance.` });
  }

  // Best trade
  if (stats.bestTrade > 0 && stats.bestTrade > avgWin * 2.5 && stats.wins > 2) {
    insights.push({ kind: "info", title: "One outlier trade skewing results", body: `Your best trade ($${stats.bestTrade.toFixed(0)}) is much larger than your average win. Make sure results aren't inflated by a single lucky trade — check if it followed your normal setup rules.` });
  }

  // Sample size
  if (stats.totalTrades < 20) {
    insights.push({ kind: "info", title: "Small sample size", body: `${stats.totalTrades} trades is not statistically significant. Any win rate or profit factor figures have high variance. Run at least 50 trades before drawing strong conclusions.` });
  }

  return insights;
}

// ── CSV export ───────────────────────────────────────────────────────────────

function exportCsv(trades: Trade[], symbol: string) {
  const header = "#,Direction,Entry,Exit,SL,TP,P&L,Pips,R:R,Entry Time,Exit Time";
  const rows = trades.filter((t) => t.status === "closed").map((t, i) =>
    [i + 1, t.direction, t.entry_price, t.exit_price ?? "", t.stop_loss ?? "", t.take_profit ?? "",
     t.pnl?.toFixed(2) ?? "", t.pips?.toFixed(1) ?? "", t.risk_reward?.toFixed(2) ?? "",
     t.entry_time, t.exit_time ?? ""].join(",")
  );
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${symbol}_results.csv`; a.click();
}

// ── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, valueColor }: { label: string; value: string; sub?: string; valueColor?: string }) {
  return (
    <div className="rounded-xl border bg-white px-4 py-3" style={{ borderColor: "#E5E7EB" }}>
      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold tabular-nums ${valueColor ?? "text-slate-900"}`}>{value}</p>
      {sub && <p className="font-mono text-[10px] text-slate-400">{sub}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

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
  backToLabHref,
  replayHref,
}: BacktestingSessionResultsViewProps) {
  const closed = trades.filter((t) => t.status === "closed");
  const pl = session.current_balance - session.initial_balance;
  const plColor = pl >= 0 ? "text-[#26a69a]" : "text-[#ef5350]";

  // Extra computed stats
  const avgWin = stats.wins > 0
    ? closed.filter((t) => (t.pnl ?? 0) > 0).reduce((s, t) => s + (t.pnl ?? 0), 0) / stats.wins
    : 0;
  const avgLoss = stats.losses > 0
    ? Math.abs(closed.filter((t) => (t.pnl ?? 0) < 0).reduce((s, t) => s + (t.pnl ?? 0), 0) / stats.losses)
    : 0;
  const expectancy = stats.totalTrades > 0
    ? (stats.winRate / 100) * avgWin - ((100 - stats.winRate) / 100) * avgLoss
    : 0;

  // Consecutive wins/losses
  let maxConsecWins = 0, maxConsecLosses = 0, curW = 0, curL = 0;
  for (const t of closed) {
    if ((t.pnl ?? 0) > 0) { curW++; curL = 0; maxConsecWins = Math.max(maxConsecWins, curW); }
    else { curL++; curW = 0; maxConsecLosses = Math.max(maxConsecLosses, curL); }
  }

  // Equity curve
  let running = session.initial_balance;
  const equityData = [{ trade: 0, balance: running }];
  for (const t of closed) {
    running += t.pnl ?? 0;
    equityData.push({ trade: equityData.length, balance: Math.round(running * 100) / 100 });
  }

  // P&L bars
  const pnlData = closed.map((t, i) => ({ n: i + 1, pnl: t.pnl ?? 0 }));

  // Win/Loss pie
  const pieData = [
    { name: "Wins", value: stats.wins, fill: "#26a69a" },
    { name: "Losses", value: stats.losses, fill: "#ef5350" },
  ];

  // AI insights
  const insights = generateInsights(stats, closed);

  const TV = { grid: "rgba(42,46,57,0.06)", axis: "#787B86", tip: { bg: "#FFFFFF", border: "#E1E3EA" } };

  return (
    <div className="relative space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="mb-2 flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <Link href={backToLabHref} className="flex items-center gap-1 hover:text-slate-600 transition-colors">
              <ChevronLeft className="h-3.5 w-3.5" />Lab
            </Link>
            <span>/</span>
            <span className="text-slate-600">{session.name}</span>
          </div>
          <h1 className="rs-page-title" style={{
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            {session.symbol} Results
          </h1>
          <p className="rs-page-sub">{session.timeframe} · {session.date_from} → {session.date_to}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportCsv(trades, session.symbol)}
            className="flex items-center gap-2 rounded-xl border px-4 py-2.5 font-mono text-sm text-slate-600 transition-all hover:bg-slate-50"
            style={{ borderColor: "#E5E7EB" }}
          >
            <Download className="h-4 w-4" />Export CSV
          </button>
          <Link
            href={replayHref}
            className="flex items-center gap-2 rounded-xl bg-[#6366f1] px-4 py-2.5 font-mono text-sm font-semibold text-white transition-all hover:bg-[#4f46e5]"
          >
            <Play className="h-4 w-4" />Continue Replay
          </Link>
        </div>
      </motion.div>

      {/* KPI row 1 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8"
      >
        <KpiCard label="Trades" value={String(stats.totalTrades)} />
        <KpiCard
          label="Win Rate"
          value={stats.totalTrades > 0 ? `${stats.winRate.toFixed(1)}%` : "—"}
          valueColor={stats.winRate >= 50 ? "text-[#26a69a]" : "text-[#ef5350]"}
        />
        <KpiCard
          label="Net P&L"
          value={`${pl >= 0 ? "+" : ""}$${pl.toFixed(2)}`}
          valueColor={plColor}
        />
        <KpiCard
          label="Profit Factor"
          value={stats.profitFactor === Infinity ? "∞" : stats.profitFactor > 0 ? stats.profitFactor.toFixed(2) : "—"}
          valueColor={stats.profitFactor >= 1 ? "text-[#26a69a]" : "text-[#ef5350]"}
        />
        <KpiCard label="Max DD" value={`$${stats.maxDrawdown.toFixed(0)}`} valueColor="text-[#ef5350]" />
        <KpiCard
          label="Avg R:R"
          value={stats.avgRR > 0 ? `1:${stats.avgRR.toFixed(2)}` : "—"}
          valueColor={stats.avgRR >= 1.5 ? "text-[#26a69a]" : stats.avgRR >= 1 ? "text-amber-500" : "text-[#ef5350]"}
        />
        <KpiCard label="Best" value={stats.bestTrade > 0 ? `+$${stats.bestTrade.toFixed(2)}` : "—"} valueColor="text-[#26a69a]" />
        <KpiCard label="Worst" value={stats.worstTrade < 0 ? `-$${Math.abs(stats.worstTrade).toFixed(2)}` : "—"} valueColor="text-[#ef5350]" />
      </motion.div>

      {/* KPI row 2 — extra analytics */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6"
      >
        <KpiCard
          label="Avg Win"
          value={avgWin > 0 ? `+$${avgWin.toFixed(2)}` : "—"}
          valueColor="text-[#26a69a]"
        />
        <KpiCard
          label="Avg Loss"
          value={avgLoss > 0 ? `-$${avgLoss.toFixed(2)}` : "—"}
          valueColor="text-[#ef5350]"
        />
        <KpiCard
          label="Expectancy"
          value={stats.totalTrades > 0 ? `${expectancy >= 0 ? "+" : ""}$${expectancy.toFixed(2)}` : "—"}
          sub="per trade"
          valueColor={expectancy >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}
        />
        <KpiCard label="Consec. Wins" value={String(maxConsecWins)} valueColor="text-[#26a69a]" />
        <KpiCard label="Consec. Losses" value={String(maxConsecLosses)} valueColor="text-[#ef5350]" />
        <KpiCard
          label="Balance"
          value={`$${session.current_balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          sub={`Started $${session.initial_balance.toLocaleString()}`}
          valueColor="text-slate-900"
        />
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        {/* Equity curve */}
        <div className="rs-card col-span-2 p-5" style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}>
          <p className="mb-4 font-display text-sm font-bold text-slate-900">Equity Curve</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={equityData} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid stroke={TV.grid} strokeDasharray="0" />
              <XAxis dataKey="trade" tick={{ fontSize: 10, fill: TV.axis, fontFamily: "var(--font-mono)" }} />
              <YAxis tick={{ fontSize: 10, fill: TV.axis, fontFamily: "var(--font-mono)" }} />
              <Tooltip
                contentStyle={{ background: TV.tip.bg, border: `1px solid ${TV.tip.border}`, borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 11 }}
                labelStyle={{ color: "#6B7280" }}
                itemStyle={{ color: "#131722" }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, "Balance"]}
              />
              <ReferenceLine y={session.initial_balance} stroke="#E1E3EA" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: "#6366f1" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Win/Loss pie */}
        <div className="rs-card p-5" style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}>
          <p className="mb-4 font-display text-sm font-bold text-slate-900">Win / Loss Split</p>
          {closed.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center font-mono text-sm text-slate-400">No trades yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={68} dataKey="value" paddingAngle={2}>
                    {pieData.map((e) => <Cell key={e.name} fill={e.fill} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: TV.tip.bg, border: `1px solid ${TV.tip.border}`, borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 11 }}
                    itemStyle={{ color: "#131722" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex justify-center gap-6 font-mono text-[11px]">
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#26a69a]" /><span className="text-slate-600">{stats.wins} Wins</span></div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#ef5350]" /><span className="text-slate-600">{stats.losses} Losses</span></div>
              </div>
            </>
          )}
        </div>

        {/* P&L per trade bar */}
        <div className="rs-card col-span-1 p-5 lg:col-span-3" style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}>
          <p className="mb-4 font-display text-sm font-bold text-slate-900">P&L per Trade</p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={pnlData} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid stroke={TV.grid} strokeDasharray="0" />
              <XAxis dataKey="n" tick={{ fontSize: 10, fill: TV.axis, fontFamily: "var(--font-mono)" }} />
              <YAxis tick={{ fontSize: 10, fill: TV.axis, fontFamily: "var(--font-mono)" }} />
              <Tooltip
                contentStyle={{ background: TV.tip.bg, border: `1px solid ${TV.tip.border}`, borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 11 }}
                itemStyle={{ color: "#131722" }}
                formatter={(v: number) => [`${v >= 0 ? "+" : ""}$${v.toFixed(2)}`, "P&L"]}
              />
              <ReferenceLine y={0} stroke="#E1E3EA" />
              <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                {pnlData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "#26a69a" : "#ef5350"} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* AI Coach */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="rs-card p-5"
          style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}
        >
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6366f1]/10">
              <Brain className="h-4 w-4 text-[#6366f1]" />
            </div>
            <p className="font-display text-sm font-bold text-slate-900">AI Coach</p>
            <span className="rounded-full bg-[#6366f1]/10 px-2 py-0.5 font-mono text-[10px] text-[#6366f1]">
              {insights.length} insight{insights.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {insights.map((ins, i) => {
              const Icon = ins.kind === "good" ? CheckCircle : ins.kind === "warn" ? AlertTriangle : Info;
              const colors = ins.kind === "good"
                ? { icon: "text-[#26a69a]", bg: "bg-[#26a69a]/05", border: "border-[#26a69a]/20" }
                : ins.kind === "warn"
                ? { icon: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" }
                : { icon: "text-[#6366f1]", bg: "bg-[#6366f1]/05", border: "border-[#6366f1]/15" };
              return (
                <div key={i} className={`rounded-xl border p-4 ${colors.bg} ${colors.border}`}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${colors.icon}`} />
                    <p className="font-mono text-[12px] font-semibold text-slate-900">{ins.title}</p>
                  </div>
                  <p className="font-mono text-[11px] leading-relaxed text-slate-600">{ins.body}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Trade log */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="rs-card overflow-hidden"
        style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}
      >
        <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "#F1F3F8" }}>
          <p className="font-display text-sm font-bold text-slate-900">Trade Log <span className="ml-1 font-mono text-[12px] font-normal text-slate-400">({closed.length})</span></p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-[12px]">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: "#F1F3F8", background: "#FAFBFC" }}>
                {["#", "Dir", "Entry", "Exit", "SL", "TP", "P&L", "Pips", "R:R"].map((h) => (
                  <th key={h} className="px-4 py-2.5 font-medium text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {closed.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">No closed trades yet</td></tr>
              )}
              {closed.map((t, i) => {
                const isWin = (t.pnl ?? 0) > 0;
                return (
                  <tr key={t.id} className="border-b transition-colors hover:bg-slate-50" style={{ borderColor: "#F9FAFB" }}>
                    <td className="px-4 py-2.5 text-slate-400">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <span className={`flex items-center gap-1 font-semibold ${t.direction === "BUY" ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                        {t.direction === "BUY" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {t.direction}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{fmtPrice(t.symbol, t.entry_price)}</td>
                    <td className="px-4 py-2.5 text-slate-700">{t.exit_price != null ? fmtPrice(t.symbol, t.exit_price) : <Minus className="h-3 w-3 text-slate-300" />}</td>
                    <td className="px-4 py-2.5 text-[#ef5350]">{t.stop_loss != null ? fmtPrice(t.symbol, t.stop_loss) : "—"}</td>
                    <td className="px-4 py-2.5 text-[#26a69a]">{t.take_profit != null ? fmtPrice(t.symbol, t.take_profit) : "—"}</td>
                    <td className={`px-4 py-2.5 font-semibold tabular-nums ${isWin ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                      {isWin ? "+" : ""}{(t.pnl ?? 0).toFixed(2)}
                    </td>
                    <td className={`px-4 py-2.5 tabular-nums ${isWin ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                      {t.pips != null ? `${t.pips >= 0 ? "+" : ""}${t.pips.toFixed(1)}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{t.risk_reward != null ? `1:${t.risk_reward.toFixed(2)}` : "—"}</td>
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
