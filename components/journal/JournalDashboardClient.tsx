"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, max, parseISO } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Plus, RefreshCw } from "lucide-react";
import type { JournalAccountPublic, JournalTradeRow } from "@/lib/journal/journalTypes";
import {
  avgRiskReward,
  closedTrades,
  equityCurve,
  holdTimeHours,
  monthlyPlHeatmap,
  plByDayOfWeek,
  plBySession,
  plBySymbol,
  tagStats,
  totalPl,
  winLossSplit,
  winRatePct
} from "@/lib/journal/analytics";
import { jn } from "@/lib/journal/jnClasses";
import { SEED_TRADES } from "@/lib/journal/seedTrades";
import { AddAccountModal } from "./AddAccountModal";

const tipStyle = {
  backgroundColor: "#0c0c0e",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "8px",
  fontSize: "11px",
  fontFamily: "var(--font-mono)"
};

function maskNumber(n: string) {
  if (n.length <= 4) return "••••";
  return `••••${n.slice(-4)}`;
}

export function JournalDashboardClient() {
  const [trades, setTrades] = useState<JournalTradeRow[]>([]);
  const [accounts, setAccounts] = useState<JournalAccountPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [useSeed, setUseSeed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, aRes] = await Promise.all([
        fetch("/api/journal/trades?pageSize=500&page=1"),
        fetch("/api/journal/accounts")
      ]);
      const tJson = await tRes.json();
      const aJson = await aRes.json();
      const list = (tJson.trades ?? []) as JournalTradeRow[];
      setTrades(list);
      setUseSeed(!tRes.ok || list.length === 0);
      if (aRes.ok) setAccounts(aJson.accounts ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const displayTrades = useMemo(
    () => (useSeed && trades.length === 0 ? SEED_TRADES : trades),
    [useSeed, trades]
  );

  const stats = useMemo(() => {
    const netPl = totalPl(displayTrades);
    const wr = winRatePct(displayTrades);
    const arr = avgRiskReward(displayTrades);
    const n = closedTrades(displayTrades).length;
    return { netPl, wr, arr, n };
  }, [displayTrades]);

  const equity = useMemo(() => equityCurve(displayTrades), [displayTrades]);
  const pie = useMemo(() => winLossSplit(displayTrades), [displayTrades]);
  const dow = useMemo(() => plByDayOfWeek(displayTrades), [displayTrades]);
  const sym = useMemo(() => plBySymbol(displayTrades), [displayTrades]);
  const sess = useMemo(() => plBySession(displayTrades), [displayTrades]);
  const tags = useMemo(() => tagStats(displayTrades), [displayTrades]);
  const hold = useMemo(() => holdTimeHours(displayTrades), [displayTrades]);

  const heatRefDate = useMemo(() => {
    const c = closedTrades(displayTrades);
    if (c.length === 0) return new Date();
    const dates = c.map((t) => parseISO(t.close_time!));
    return max(dates);
  }, [displayTrades]);

  const heat = useMemo(
    () => monthlyPlHeatmap(displayTrades, heatRefDate),
    [displayTrades, heatRefDate]
  );

  const bestTags = tags.slice(0, 5);
  const worstTags = tags.slice().reverse().slice(0, 5);

  const onSync = async (id: string) => {
    setSyncing(id);
    try {
      await fetch(`/api/journal/accounts/${id}/sync`, { method: "POST" });
      await load();
    } finally {
      setSyncing(null);
    }
  };

  type HeatCell = (typeof heat)[number];
  const heatWeeks = useMemo(() => {
    if (heat.length === 0) return [] as (HeatCell | null)[][];
    const first = parseISO(heat[0].date);
    const startPad = (first.getDay() + 6) % 7;
    const cells: (HeatCell | null)[] = [...Array(startPad).fill(null), ...heat];
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (HeatCell | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  }, [heat]);

  return (
    <div className={`${jn.page} space-y-6`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={jn.h1}>Journal</h1>
          <p className={jn.sub}>Performance, habits, and execution — in one place.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {accounts[0] && (
            <button
              type="button"
              className={jn.btnGhost}
              disabled={!!syncing}
              onClick={() => void onSync(accounts[0].id)}
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              Sync
            </button>
          )}
          <button type="button" className={jn.btnPrimary} onClick={() => setModal(true)}>
            <Plus className="h-4 w-4" />
            Add account
          </button>
          <Link href="/app/journaling/trades" className={`${jn.btnGhost} no-underline`}>
            All trades
          </Link>
        </div>
      </div>

      {useSeed && trades.length === 0 && (
        <p
          className={`rounded-xl border border-[#ff8c00]/30 bg-[#ff8c00]/10 px-4 py-3 text-sm text-[#ff8c00] ${jn.mono}`}
        >
          Demo preview: showing sample trades until your journal has closed trades in the database.
        </p>
      )}

      {loading ? (
        <p className="text-slate-500 font-[family-name:var(--font-mono)] text-sm">Loading…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className={jn.card}>
              <p className={jn.label}>Total P&amp;L</p>
              <p
                className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold"
                style={{ color: stats.netPl >= 0 ? jn.green : jn.accentRed }}
              >
                {stats.netPl >= 0 ? "+" : ""}
                {stats.netPl.toFixed(2)}
              </p>
            </div>
            <div className={jn.card}>
              <p className={jn.label}>Win rate</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-white">
                {stats.wr.toFixed(1)}%
              </p>
            </div>
            <div className={jn.card}>
              <p className={jn.label}>Avg R:R</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-200">
                {stats.arr.toFixed(2)}
              </p>
            </div>
            <div className={jn.card}>
              <p className={jn.label}>Closed trades</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-white">
                {stats.n}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className={`${jn.card} min-h-[320px]`}>
              <p className={jn.label}>Equity curve</p>
              <div className="mt-4 h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={equity}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 10 }} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={tipStyle} labelStyle={{ color: "#94a3b8" }} />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="#ff3c3c"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className={`${jn.card} min-h-[320px]`}>
              <p className={jn.label}>Win / loss (abs $)</p>
              <div className="mt-4 h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {pie.map((e, i) => (
                        <Cell key={i} fill={e.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className={`mt-2 flex justify-center gap-6 text-xs ${jn.mono} text-slate-500`}>
                {pie.map((p) => (
                  <span key={p.name} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.fill }} />
                    {p.name}: {p.value.toFixed(0)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className={`${jn.card} min-h-[280px]`}>
              <p className={jn.label}>P&amp;L by weekday</p>
              <div className="mt-4 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dow}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
                    <Tooltip contentStyle={tipStyle} />
                    <Bar dataKey="pl" radius={[4, 4, 0, 0]}>
                      {dow.map((e, i) => (
                        <Cell key={i} fill={e.pl >= 0 ? "#00e676" : "#ff3c3c"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`${jn.card} min-h-[280px]`}>
              <p className={jn.label}>P&amp;L by symbol</p>
              <div className="mt-4 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={sym.slice(0, 6)} margin={{ left: 8 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} />
                    <YAxis type="category" dataKey="symbol" width={56} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                    <Tooltip contentStyle={tipStyle} />
                    <Bar dataKey="pl" radius={[0, 4, 4, 0]}>
                      {sym.slice(0, 6).map((e, i) => (
                        <Cell key={i} fill={e.pl >= 0 ? "#00e676" : "#ff3c3c"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`${jn.card} min-h-[280px]`}>
              <p className={jn.label}>P&amp;L by session (UTC)</p>
              <div className="mt-4 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sess}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="session" tick={{ fill: "#64748b", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
                    <Tooltip contentStyle={tipStyle} />
                    <Bar dataKey="pl" radius={[4, 4, 0, 0]}>
                      {sess.map((e, i) => (
                        <Cell key={i} fill={e.pl >= 0 ? "#00e676" : "#ff3c3c"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={jn.card}>
              <p className={jn.label}>Best tags (net P&amp;L)</p>
              <ul className="mt-3 space-y-2">
                {bestTags.map((t) => (
                  <li
                    key={t.tag}
                    className={`flex justify-between text-sm ${jn.mono} border-b border-white/[0.05] pb-2 last:border-0`}
                  >
                    <span className="text-slate-300">{t.tag}</span>
                    <span style={{ color: t.pl >= 0 ? jn.green : jn.accentRed }}>
                      {t.pl >= 0 ? "+" : ""}
                      {t.pl.toFixed(0)} <span className="text-slate-600">({t.count})</span>
                    </span>
                  </li>
                ))}
                {bestTags.length === 0 && <li className="text-xs text-slate-600">No tags yet.</li>}
              </ul>
            </div>

            <div className={jn.card}>
              <p className={jn.label}>Weakest tags (net P&amp;L)</p>
              <ul className="mt-3 space-y-2">
                {worstTags.map((t, i) => (
                  <li
                    key={`${t.tag}-worst-${i}`}
                    className={`flex justify-between text-sm ${jn.mono} border-b border-white/[0.05] pb-2 last:border-0`}
                  >
                    <span className="text-slate-300">{t.tag}</span>
                    <span style={{ color: t.pl >= 0 ? jn.green : jn.accentRed }}>
                      {t.pl >= 0 ? "+" : ""}
                      {t.pl.toFixed(0)} <span className="text-slate-600">({t.count})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={jn.card}>
              <p className={jn.label}>Avg hold (hours)</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                  <p className="text-[10px] uppercase text-slate-500">Winners</p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-xl text-[#00e676]">
                    {hold.winners}h
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                  <p className="text-[10px] uppercase text-slate-500">Losers</p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-xl text-[#ff3c3c]">
                    {hold.losers}h
                  </p>
                </div>
              </div>
            </div>

            <div className={`${jn.card} md:col-span-2 xl:col-span-3`}>
              <p className={jn.label}>Monthly P&amp;L heatmap ({format(heatRefDate, "MMMM yyyy")})</p>
              <div className="mt-4 overflow-x-auto">
                <div className="inline-grid gap-1" style={{ gridTemplateColumns: "repeat(7, minmax(36px,1fr))" }}>
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                    <div key={d} className={`text-center text-[9px] ${jn.mono} text-slate-600`}>
                      {d}
                    </div>
                  ))}
                  {heatWeeks.flatMap((row, ri) =>
                    row.map((cell, ci) => {
                      if (cell == null) {
                        return <div key={`${ri}-${ci}`} className="aspect-square rounded-md bg-transparent" />;
                      }
                      const intensity =
                        cell.pl === 0 ? 0 : Math.min(1, Math.abs(cell.pl) / 500);
                      const bg =
                        cell.pl === 0
                          ? "rgba(255,255,255,0.04)"
                          : cell.pl > 0
                            ? `rgba(0,230,118,${0.15 + intensity * 0.45})`
                            : `rgba(255,60,60,${0.15 + intensity * 0.45})`;
                      return (
                        <div
                          key={cell.date}
                          title={`${cell.date}: ${cell.pl >= 0 ? "+" : ""}${cell.pl}`}
                          className="flex aspect-square flex-col items-center justify-center rounded-md border border-white/[0.06] text-[10px] font-mono"
                          style={{
                            background: bg,
                            color: cell.pl === 0 ? "#64748b" : cell.pl > 0 ? "#00e676" : "#ff3c3c"
                          }}
                        >
                          {cell.day}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {accounts.length > 0 && (
            <div className={jn.card}>
              <p className={jn.label}>Connected accounts</p>
              <ul className="mt-3 space-y-2">
                {accounts.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-white">{a.nickname}</p>
                      <p className={`text-xs text-slate-500 ${jn.mono}`}>
                        {a.platform} · {maskNumber(a.account_number)} · {a.broker_server}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-mono uppercase ${
                          a.status === "active"
                            ? "bg-[#00e676]/15 text-[#00e676]"
                            : "bg-slate-600/30 text-slate-400"
                        }`}
                      >
                        {a.status}
                      </span>
                      <button
                        type="button"
                        className={jn.btnGhost}
                        disabled={syncing === a.id}
                        onClick={() => void onSync(a.id)}
                      >
                        Sync
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <AddAccountModal open={modal} onClose={() => setModal(false)} onCreated={() => void load()} />
    </div>
  );
}
