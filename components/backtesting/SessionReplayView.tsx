"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import type { BtTimeframe, BtTradeDirection, BtTradeRow, Candle } from "@/lib/backtesting/btTypes";
import { checkSlTpHit, unrealizedPl } from "@/lib/backtesting/replayEngine";
import { TradingViewChart, type TradingViewChartHandle } from "./TradingViewChart";
import { TradeOpenModal } from "./TradeOpenModal";
import { bt } from "./btClasses";

type SessionPayload = {
  id: string;
  symbol: string;
  date_from: string;
  date_to: string;
  initial_balance: number;
  current_balance: number;
  name: string;
};

type Props = {
  sessionId: string;
  basePath: string;
};

const CHART_TIMEFRAMES: BtTimeframe[] = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"];

function lsKeyTf(id: string) { return `bt_chart_tf_${id}`; }
function lsKeyCandles(id: string, tf: string) { return `bt_candles_${id}_${tf}`; }
function lsKeyIndex(id: string, tf: string) { return `bt_replay_idx_${id}_${tf}`; }
function lsKeyOpenMeta(id: string, tf: string) { return `bt_open_meta_${id}_${tf}`; }

export function SessionReplayView({ sessionId, basePath }: Props) {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [trades, setTrades] = useState<BtTradeRow[]>([]);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modal, setModal] = useState<{ open: boolean; direction: BtTradeDirection }>({
    open: false,
    direction: "BUY"
  });
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 5>(1);
  const [timeframe, setTimeframe] = useState<BtTimeframe>("H1");
  const entryIndexRef = useRef<number | null>(null);
  const chartRef = useRef<TradingViewChartHandle | null>(null);

  const currentCandle = candles[currentIndex] ?? null;
  const openTrade = useMemo(() => trades.find((t) => t.status === "open") ?? null, [trades]);

  const loadSession = useCallback(async () => {
    const res = await fetch(`/api/backtesting/sessions/${sessionId}`);
    if (!res.ok) { setLoadErr("Session not found or unauthorized"); return; }
    const j = await res.json();
    setSession(j.session);
    setTrades(j.trades ?? []);
  }, [sessionId]);

  useEffect(() => { void loadSession(); }, [loadSession]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(lsKeyTf(sessionId));
      if (raw && (CHART_TIMEFRAMES as string[]).includes(raw)) {
        setTimeframe(raw as BtTimeframe);
      }
    } catch { /* ignore */ }
  }, [sessionId]);

  const hydrateCandles = useCallback(
    async (sess: SessionPayload, tf: BtTimeframe) => {
      setLoadErr(null);
      const cacheKey = lsKeyCandles(sessionId, tf);
      const cached = typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null;
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as Candle[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCandles(parsed);
            const idxRaw = localStorage.getItem(lsKeyIndex(sessionId, tf));
            const idx = idxRaw ? Math.min(Number(idxRaw), parsed.length - 1) : 0;
            setCurrentIndex(Number.isFinite(idx) ? idx : 0);
            return;
          }
        } catch { /* fall through */ }
      }
      const q = new URLSearchParams({
        symbol: sess.symbol,
        timeframe: tf,
        from: sess.date_from,
        to: sess.date_to
      });
      const res = await fetch(`/api/backtesting/ohlcv?${q}`);
      const j = await res.json();
      if (!res.ok) { setLoadErr(j.error ?? "Failed to load OHLCV"); setCandles([]); return; }
      const list = j.candles as Candle[];
      setCandles(list);
      setCurrentIndex(0);
      try { localStorage.setItem(cacheKey, JSON.stringify(list)); } catch { /* ignore */ }
    },
    [sessionId]
  );

  useEffect(() => {
    if (!session) return;
    void hydrateCandles(session, timeframe);
  }, [session, timeframe, hydrateCandles]);

  useEffect(() => {
    try { localStorage.setItem(lsKeyIndex(sessionId, timeframe), String(currentIndex)); } catch { /* ignore */ }
  }, [currentIndex, sessionId, timeframe]);

  useEffect(() => {
    const t = candles[currentIndex]?.time;
    if (t == null || !Number.isFinite(t)) return;
    chartRef.current?.goToDate(t);
  }, [currentIndex, candles]);

  useEffect(() => {
    try { localStorage.setItem(lsKeyTf(sessionId), timeframe); } catch { /* ignore */ }
  }, [sessionId, timeframe]);

  useEffect(() => {
    if (!openTrade) { entryIndexRef.current = null; return; }
    const raw = localStorage.getItem(lsKeyOpenMeta(sessionId, timeframe));
    if (raw) {
      try {
        const meta = JSON.parse(raw) as { tradeId?: string; entryIndex?: number };
        if (meta.tradeId === openTrade.id && typeof meta.entryIndex === "number") {
          entryIndexRef.current = meta.entryIndex;
          return;
        }
      } catch { /* ignore */ }
    }
    if (entryIndexRef.current == null) entryIndexRef.current = 0;
  }, [openTrade, sessionId, timeframe]);

  const closeTradeApi = useCallback(
    async (tradeId: string, exitPrice: number, exitIso: string) => {
      const res = await fetch(`/api/backtesting/trades/${tradeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exit_price: exitPrice, exit_time: exitIso, status: "closed" })
      });
      if (!res.ok) return;
      await loadSession();
      try { localStorage.removeItem(lsKeyOpenMeta(sessionId, timeframe)); } catch { /* ignore */ }
    },
    [loadSession, sessionId, timeframe]
  );

  const stepForward = useCallback(async () => {
    if (candles.length === 0) return;
    if (currentIndex >= candles.length - 1) return;
    const nextIndex = currentIndex + 1;
    const candle = candles[nextIndex];
    const ot = trades.find((t) => t.status === "open");
    if (ot && entryIndexRef.current != null && nextIndex > entryIndexRef.current) {
      const hit = checkSlTpHit(candle, ot.direction, ot.stop_loss, ot.take_profit);
      if (hit.hit !== "none") {
        const exitIso = new Date(candle.time * 1000).toISOString();
        await closeTradeApi(ot.id, hit.price, exitIso);
        setCurrentIndex(nextIndex);
        return;
      }
    }
    setCurrentIndex(nextIndex);
  }, [candles, currentIndex, trades, closeTradeApi]);

  const stepBack = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (candles.length > 0 && currentIndex >= candles.length - 1) { setPlaying(false); return; }
    const ms = 800 / speed;
    const id = window.setInterval(() => { void stepForward(); }, ms);
    return () => window.clearInterval(id);
  }, [playing, speed, stepForward, candles.length, currentIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        void stepForward();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepForward]);

  const onOpenTrade = async (direction: BtTradeDirection) => {
    if (!currentCandle || openTrade) return;
    setModal({ open: true, direction });
  };

  const confirmTrade = async (payload: { lot_size: number; stop_loss: number; take_profit: number }) => {
    if (!session || !currentCandle) return;
    const entry = currentCandle.close;
    const entryIso = new Date(currentCandle.time * 1000).toISOString();
    const res = await fetch("/api/backtesting/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        symbol: session.symbol,
        direction: modal.direction,
        entry_price: entry,
        stop_loss: payload.stop_loss,
        take_profit: payload.take_profit,
        lot_size: payload.lot_size,
        entry_time: entryIso
      })
    });
    if (!res.ok) return;
    const j = await res.json();
    const tr = j.trade as BtTradeRow;
    entryIndexRef.current = currentIndex;
    try {
      localStorage.setItem(
        lsKeyOpenMeta(sessionId, timeframe),
        JSON.stringify({ tradeId: tr.id, entryIndex: currentIndex })
      );
    } catch { /* ignore */ }
    setModal((m) => ({ ...m, open: false }));
    await loadSession();
  };

  const analytics = useMemo(() => {
    const closed = trades.filter((t) => t.status === "closed" && t.pl != null);
    const wins = closed.filter((t) => (t.pl as number) > 0).length;
    const losses = closed.filter((t) => (t.pl as number) < 0).length;
    const decided = wins + losses;
    const winRate = decided > 0 ? (wins / decided) * 100 : 0;
    const rrVals = closed.map((t) => t.risk_reward).filter((x): x is number => x != null && Number.isFinite(x));
    const avgRr = rrVals.length ? rrVals.reduce((a, b) => a + b, 0) / rrVals.length : 0;
    const totalPl = closed.reduce((a, t) => a + (t.pl ?? 0), 0);
    const init = session?.initial_balance ?? 0;
    const plPct = init > 0 ? (totalPl / init) * 100 : 0;
    let peak = session?.initial_balance ?? 0;
    let maxDd = 0;
    let bal = session?.initial_balance ?? 0;
    const sorted = [...closed].sort(
      (a, b) => new Date(a.exit_time ?? "").getTime() - new Date(b.exit_time ?? "").getTime()
    );
    for (const t of sorted) {
      bal += t.pl ?? 0;
      if (bal > peak) peak = bal;
      const dd = peak > 0 ? ((peak - bal) / peak) * 100 : 0;
      if (dd > maxDd) maxDd = dd;
    }
    const mark = currentCandle?.close ?? 0;
    let unreal = 0;
    if (openTrade) { unreal = unrealizedPl(mark, openTrade.entry_price, openTrade.lot_size, openTrade.direction); }
    return { wins, losses, winRate, avgRr, totalPl, plPct, maxDd, unreal };
  }, [trades, session, currentCandle, openTrade]);

  if (loadErr && !session) {
    return (
      <div className={bt.page}>
        <p className="text-red-400 font-mono text-sm">{loadErr}</p>
        <Link href={basePath} className="mt-4 inline-block text-[#6366f1] underline text-sm">Back</Link>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500 font-mono text-sm">
        Loading session…
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${bt.page} space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={basePath}
            className="mb-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 font-mono"
          >
            <ChevronLeft className="h-3 w-3" />
            Dashboard
          </Link>
          <h1 className={bt.h1}>{session.name}</h1>
          <p className={bt.sub}>
            {session.symbol} · chart {timeframe} · {session.date_from} → {session.date_to}
          </p>
        </div>
        <div className="text-right font-mono text-xs text-slate-500">
          Candle{" "}
          <span className="text-[#ff8c00]">
            {candles.length ? currentIndex + 1 : 0} / {candles.length}
          </span>
        </div>
      </div>

      {loadErr && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{loadErr}</p>
      )}

      <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)] lg:items-stretch">
        <div className={`${bt.card} flex min-h-[600px] flex-col p-0 overflow-hidden lg:min-h-[calc(100vh-220px)]`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
            <span className={bt.label}>Chart timeframe</span>
            <select
              className={`${bt.input} max-w-[160px] py-2`}
              value={timeframe}
              disabled={!!openTrade}
              title={openTrade ? "Close or finish the open trade before changing timeframe" : undefined}
              onChange={(e) => setTimeframe(e.target.value as BtTimeframe)}
            >
              {CHART_TIMEFRAMES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* CHART CONTAINER — altezza esplicita */}
          <div
            className="p-4"
            style={{ flex: "1 1 0", minHeight: "400px", position: "relative" }}
          >
            <TradingViewChart
              ref={chartRef}
              symbol={session.symbol}
              timeframe={timeframe}
              sessionDateFrom={session.date_from}
              sessionDateTo={session.date_to}
              replayVisibleEndSec={candles[currentIndex]?.time ?? null}
              entryPrice={openTrade?.entry_price ?? null}
              stopLoss={openTrade?.stop_loss ?? null}
              takeProfit={openTrade?.take_profit ?? null}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-4 py-3">
            <button
              type="button"
              className={bt.btnGhost}
              onClick={stepBack}
              disabled={currentIndex <= 0}
              title="Previous candle"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={bt.btnGhost}
              onClick={() => void stepForward()}
              disabled={!candles.length || currentIndex >= candles.length - 1}
              title="Next candle (Space)"
            >
              <SkipForward className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={bt.btnGhost}
              onClick={() => setPlaying((p) => !p)}
              disabled={!candles.length || currentIndex >= candles.length - 1}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <div className="flex items-center gap-1 pl-2 font-mono text-[11px] text-slate-500">
              Speed
              {([1, 2, 5] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`rounded-lg px-2 py-1 ${speed === s ? "bg-[#6366f1]/20 text-[#6366f1]" : "text-slate-500"}`}
                  onClick={() => setSpeed(s)}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-white/[0.06] px-4 py-4">
            <button
              type="button"
              disabled={!!openTrade || !currentCandle}
              onClick={() => void onOpenTrade("BUY")}
              className="rounded-2xl bg-gradient-to-r from-[#00e676] to-[#00a056] py-4 text-center text-sm font-bold text-black shadow-lg shadow-[#00e676]/30 disabled:opacity-40"
            >
              BUY
            </button>
            <button
              type="button"
              disabled={!!openTrade || !currentCandle}
              onClick={() => void onOpenTrade("SELL")}
              className="rounded-2xl bg-gradient-to-r from-[#ff3c3c] to-[#991b1b] py-4 text-center text-sm font-bold text-white shadow-lg shadow-[#ff3c3c]/30 disabled:opacity-40"
            >
              SELL
            </button>
          </div>
        </div>

        <aside className={`${bt.card} flex max-h-[calc(100vh-140px)] flex-col gap-4 overflow-y-auto`}>
          <div>
            <p className={bt.label}>Balance</p>
            <p className="font-display text-2xl font-bold text-white">
              {session.current_balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            {openTrade && (
              <p className="mt-1 text-xs text-[#ff8c00] font-mono">
                Open P&amp;L (mark) {analytics.unreal >= 0 ? "+" : ""}{analytics.unreal.toFixed(2)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm font-mono">
            <div className="rounded-xl bg-black/30 px-3 py-2">
              <p className="text-[10px] uppercase text-slate-500">Trades</p>
              <p className="text-slate-200">{trades.filter((t) => t.status === "closed").length}</p>
            </div>
            <div className="rounded-xl bg-black/30 px-3 py-2">
              <p className="text-[10px] uppercase text-slate-500">Win rate</p>
              <p className="text-[#00e676]">{analytics.winRate.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl bg-black/30 px-3 py-2">
              <p className="text-[10px] uppercase text-slate-500">Avg R:R</p>
              <p className="text-slate-200">{analytics.avgRr.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-black/30 px-3 py-2">
              <p className="text-[10px] uppercase text-slate-500">Max DD</p>
              <p className="text-[#ff3c3c]">{analytics.maxDd.toFixed(2)}%</p>
            </div>
          </div>

          <div>
            <p className={bt.label}>Total P&amp;L</p>
            <p className={`font-mono text-lg ${analytics.totalPl >= 0 ? "text-[#00e676]" : "text-[#ff3c3c]"}`}>
              {analytics.totalPl >= 0 ? "+" : ""}{analytics.totalPl.toFixed(2)}{" "}
              <span className="text-slate-500">
                ({analytics.plPct >= 0 ? "+" : ""}{analytics.plPct.toFixed(2)}%)
              </span>
            </p>
          </div>

          <div>
            <p className={bt.label}>Closed trades</p>
            <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1">
              {trades.filter((t) => t.status === "closed").map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-black/20 px-2 py-2 text-[11px] font-mono"
                >
                  <span className={t.direction === "BUY" ? "rounded bg-[#00e676]/15 px-1.5 py-0.5 text-[#00e676]" : "rounded bg-[#ff3c3c]/15 px-1.5 py-0.5 text-[#ff3c3c]"}>
                    {t.direction}
                  </span>
                  <span className="text-slate-400">
                    {t.entry_price.toFixed(5)} → {t.exit_price?.toFixed(5) ?? "—"}
                  </span>
                  <span className={t.pl != null && t.pl >= 0 ? "text-[#00e676]" : "text-[#ff3c3c]"}>
                    {(t.pl ?? 0) >= 0 ? "+" : ""}{(t.pl ?? 0).toFixed(0)}
                  </span>
                </li>
              ))}
              {trades.filter((t) => t.status === "closed").length === 0 && (
                <li className="text-xs text-slate-600">No closed trades yet.</li>
              )}
            </ul>
          </div>

          <Link
            href={`${basePath}/session/${sessionId}`}
            className="mt-auto block text-center text-xs text-[#6366f1] underline font-mono"
          >
            Session summary →
          </Link>
        </aside>
      </div>

      <TradeOpenModal
        open={modal.open}
        direction={modal.direction}
        symbol={session.symbol}
        entryPrice={currentCandle?.close ?? 0}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        onConfirm={(p) => void confirmTrade(p)}
      />
    </motion.div>
  );
}