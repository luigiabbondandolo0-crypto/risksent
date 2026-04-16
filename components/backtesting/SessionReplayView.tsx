"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  TrendingUp,
  TrendingDown,
  X,
  Target,
  Shield,
  Crosshair,
  ChevronsRight
} from "lucide-react";
import type { BtTimeframe, BtTradeDirection, BtTradeRow, Candle } from "@/lib/backtesting/btTypes";
import { checkSlTpHit, unrealizedPl } from "@/lib/backtesting/replayEngine";
import { ReplayChart } from "./ReplayChart";
import { TradeOpenModal } from "./TradeOpenModal";

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

function fmt5(n: number): string {
  if (n >= 100) return n.toFixed(2);
  if (n >= 10) return n.toFixed(3);
  return n.toFixed(5);
}

function fmtPl(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(2);
}

function formatCandleTime(unix: number, tf: BtTimeframe): string {
  const d = new Date(unix * 1000);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dy = String(d.getUTCDate()).padStart(2, "0");
  const hr = String(d.getUTCHours()).padStart(2, "0");
  const mn = String(d.getUTCMinutes()).padStart(2, "0");
  if (tf === "D1") return `${y}-${mo}-${dy}`;
  return `${y}-${mo}-${dy} ${hr}:${mn}`;
}

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
  const [loadingCandles, setLoadingCandles] = useState(false);
  const [closingTrade, setClosingTrade] = useState(false);
  const entryIndexRef = useRef<number | null>(null);

  const currentCandle = candles[currentIndex] ?? null;
  const prevCandle = currentIndex > 0 ? (candles[currentIndex - 1] ?? null) : null;
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
      setLoadingCandles(true);
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
            setLoadingCandles(false);
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
      if (!res.ok) {
        setLoadErr(j.error ?? "Failed to load OHLCV");
        setCandles([]);
        setLoadingCandles(false);
        return;
      }
      const list = j.candles as Candle[];
      setCandles(list);
      setCurrentIndex(0);
      setLoadingCandles(false);
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

  const closeAtMarket = useCallback(async () => {
    if (!openTrade || !currentCandle) return;
    setClosingTrade(true);
    const exitIso = new Date(currentCandle.time * 1000).toISOString();
    await closeTradeApi(openTrade.id, currentCandle.close, exitIso);
    setClosingTrade(false);
  }, [openTrade, currentCandle, closeTradeApi]);

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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        void stepForward();
      }
      if (e.code === "ArrowLeft") { e.preventDefault(); stepBack(); }
      if (e.code === "ArrowRight") { e.preventDefault(); void stepForward(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepForward, stepBack]);

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
    const totalPl = closed.reduce((a, t) => a + (t.pl ?? 0), 0);
    const init = session?.initial_balance ?? 0;
    const plPct = init > 0 ? (totalPl / init) * 100 : 0;
    const mark = currentCandle?.close ?? 0;
    let unreal = 0;
    if (openTrade) { unreal = unrealizedPl(mark, openTrade.entry_price, openTrade.lot_size, openTrade.direction); }
    return { wins, losses, winRate, totalPl, plPct, unreal };
  }, [trades, session, currentCandle, openTrade]);

  const candleChange = useMemo(() => {
    if (!currentCandle || !prevCandle) return null;
    const diff = currentCandle.close - prevCandle.close;
    const pct = prevCandle.close !== 0 ? (diff / prevCandle.close) * 100 : 0;
    return { diff, pct };
  }, [currentCandle, prevCandle]);

  // === LOADING STATE ===
  if (loadErr && !session) {
    return (
      <div className="flex h-[calc(100dvh-56px)] items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400 font-mono text-sm">{loadErr}</p>
          <Link href={basePath} className="inline-block text-[#6366f1] underline text-sm font-mono">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-[calc(100dvh-56px)] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 font-mono text-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#6366f1] animate-pulse" />
          Loading session…
        </div>
      </div>
    );
  }

  const progress = candles.length > 0 ? ((currentIndex + 1) / candles.length) * 100 : 0;

  // === TERMINAL LAYOUT ===
  return (
    <div
      className="-mx-4 -my-6 sm:-mx-6 lg:-mx-8 lg:-my-8 flex flex-col overflow-hidden bg-[#07070f]"
      style={{ height: "calc(100dvh - 56px)" }}
    >
      {/* ── TOP INFO BAR ───────────────────────────────────────────── */}
      <div className="flex h-11 shrink-0 items-center gap-3 border-b border-white/[0.05] bg-[#0a0a12] px-3">
        {/* Back + Symbol */}
        <Link
          href={basePath}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="text-[11px] font-mono hidden sm:block">Dashboard</span>
        </Link>
        <div className="h-4 w-px bg-white/[0.07]" />
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-white text-sm tracking-wide">
            {session.symbol}
          </span>
          <span className="rounded bg-[#6366f1]/20 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-[#818cf8] uppercase">
            {timeframe}
          </span>
        </div>

        {/* OHLCV */}
        {currentCandle && (
          <>
            <div className="h-4 w-px bg-white/[0.07]" />
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>
                <span className="text-slate-500">O </span>
                <span className="text-slate-200">{fmt5(currentCandle.open)}</span>
              </span>
              <span>
                <span className="text-slate-500">H </span>
                <span className="text-emerald-400">{fmt5(currentCandle.high)}</span>
              </span>
              <span>
                <span className="text-slate-500">L </span>
                <span className="text-red-400">{fmt5(currentCandle.low)}</span>
              </span>
              <span>
                <span className="text-slate-500">C </span>
                <span className="text-white font-semibold">{fmt5(currentCandle.close)}</span>
              </span>
              {candleChange && (
                <span className={candleChange.diff >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {candleChange.diff >= 0 ? "▲" : "▼"}{Math.abs(candleChange.pct).toFixed(3)}%
                </span>
              )}
              <span className="text-slate-600 hidden md:block">
                {formatCandleTime(currentCandle.time, timeframe)}
              </span>
            </div>
          </>
        )}

        {/* Right: session name + balance */}
        <div className="ml-auto flex items-center gap-4">
          <span className="hidden lg:block text-[11px] text-slate-600 font-mono truncate max-w-[160px]">
            {session.name}
          </span>
          <div className="text-right">
            <div className="text-xs font-display font-bold text-white">
              ${session.current_balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            {analytics.unreal !== 0 && openTrade && (
              <div className={`text-[10px] font-mono ${analytics.unreal >= 0 ? "text-amber-400" : "text-red-400"}`}>
                {fmtPl(analytics.unreal)} unreal.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN AREA (chart + right panel) ──────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Chart column */}
        <div className="flex flex-1 min-w-0 flex-col">

          {/* Error banner */}
          {loadErr && (
            <div className="mx-3 mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 font-mono">
              {loadErr}
            </div>
          )}

          {/* Chart */}
          <div className="flex-1 min-h-0 relative">
            {loadingCandles && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#07070f]/80 backdrop-blur-sm">
                <div className="flex items-center gap-3 text-slate-500 font-mono text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#6366f1] animate-pulse" />
                  Loading candles…
                </div>
              </div>
            )}
            <ReplayChart
              candles={candles}
              currentIndex={currentIndex}
              entryPrice={openTrade?.entry_price ?? null}
              stopLoss={openTrade?.stop_loss ?? null}
              takeProfit={openTrade?.take_profit ?? null}
            />
          </div>

          {/* ── BOTTOM CONTROLS BAR ─────────────────────────────── */}
          <div className="flex h-11 shrink-0 items-center gap-2 border-t border-white/[0.05] bg-[#0a0a12] px-3">

            {/* Timeframe tabs */}
            <div className="flex items-center gap-0.5">
              {CHART_TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  disabled={!!openTrade && tf !== timeframe}
                  onClick={() => setTimeframe(tf)}
                  title={openTrade && tf !== timeframe ? "Close trade before changing timeframe" : undefined}
                  className={`rounded px-2 py-0.5 text-[11px] font-mono font-medium transition-colors ${
                    timeframe === tf
                      ? "bg-[#6366f1]/25 text-[#818cf8]"
                      : "text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-white/[0.07]" />

            {/* Replay controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={stepBack}
                disabled={currentIndex <= 0}
                title="Previous candle (←)"
                className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-30 transition-colors"
              >
                <SkipBack className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                disabled={!candles.length || currentIndex >= candles.length - 1}
                className="flex h-7 w-7 items-center justify-center rounded bg-white/[0.06] text-white hover:bg-white/[0.1] disabled:opacity-30 transition-colors"
              >
                {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => void stepForward()}
                disabled={!candles.length || currentIndex >= candles.length - 1}
                title="Next candle (→ or Space)"
                className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-30 transition-colors"
              >
                <SkipForward className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Speed */}
            <div className="flex items-center gap-0.5">
              {([1, 2, 5] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  className={`rounded px-2 py-0.5 text-[11px] font-mono transition-colors ${
                    speed === s
                      ? "bg-amber-500/20 text-amber-400"
                      : "text-slate-600 hover:text-slate-400"
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-white/[0.07]" />

            {/* Progress bar + counter */}
            <div className="flex flex-1 items-center gap-2 min-w-0">
              <div className="relative h-1 flex-1 max-w-[180px] rounded-full bg-white/[0.05]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-[#6366f1]/60 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="font-mono text-[11px] text-slate-500 whitespace-nowrap">
                {candles.length ? currentIndex + 1 : 0}
                <span className="text-slate-700">/{candles.length}</span>
              </span>
            </div>

            {/* Session summary link */}
            <Link
              href={`${basePath}/session/${sessionId}`}
              className="ml-auto hidden lg:flex items-center gap-1 text-[11px] text-slate-600 hover:text-[#6366f1] font-mono transition-colors"
            >
              Summary
              <ChevronsRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* ── RIGHT TRADING PANEL ──────────────────────────────────── */}
        <aside className="w-60 xl:w-64 shrink-0 border-l border-white/[0.05] bg-[#09090f] flex flex-col overflow-y-auto">

          {/* Account */}
          <div className="border-b border-white/[0.05] px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-600 mb-1">Balance</p>
            <p className="font-display text-xl font-bold text-white leading-none">
              ${session.current_balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] font-mono">
              <div className="rounded-lg bg-white/[0.03] px-2 py-1.5">
                <p className="text-slate-600 text-[10px]">Total P&L</p>
                <p className={analytics.totalPl >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {fmtPl(analytics.totalPl)}
                </p>
              </div>
              <div className="rounded-lg bg-white/[0.03] px-2 py-1.5">
                <p className="text-slate-600 text-[10px]">Win rate</p>
                <p className="text-slate-200">
                  {analytics.winRate.toFixed(0)}%
                </p>
              </div>
            </div>
            {openTrade && (
              <div className="mt-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-1.5">
                <p className="text-[10px] text-amber-500/70 font-mono">Unrealized</p>
                <p className={`font-mono text-xs font-semibold ${analytics.unreal >= 0 ? "text-amber-400" : "text-red-400"}`}>
                  {fmtPl(analytics.unreal)}
                </p>
              </div>
            )}
          </div>

          {/* BUY / SELL */}
          <div className="border-b border-white/[0.05] p-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!!openTrade || !currentCandle || loadingCandles}
              onClick={() => void onOpenTrade("BUY")}
              className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20 py-3 text-emerald-400 font-bold text-sm transition-all hover:bg-emerald-500/25 hover:border-emerald-500/40 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <TrendingUp className="h-4 w-4" />
              BUY
            </button>
            <button
              type="button"
              disabled={!!openTrade || !currentCandle || loadingCandles}
              onClick={() => void onOpenTrade("SELL")}
              className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-red-500/15 border border-red-500/20 py-3 text-red-400 font-bold text-sm transition-all hover:bg-red-500/25 hover:border-red-500/40 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <TrendingDown className="h-4 w-4" />
              SELL
            </button>
            {currentCandle && !openTrade && (
              <p className="col-span-2 text-center text-[10px] font-mono text-slate-600">
                Mark: {fmt5(currentCandle.close)}
              </p>
            )}
          </div>

          {/* Open position */}
          {openTrade && currentCandle && (
            <div className="border-b border-white/[0.05] p-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-600 mb-2">Open Position</p>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`rounded px-2 py-0.5 text-xs font-bold font-mono ${
                    openTrade.direction === "BUY"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {openTrade.direction}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {openTrade.lot_size} lot
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                  <div>
                    <span className="text-slate-600">Entry</span>
                    <div className="text-slate-200">{fmt5(openTrade.entry_price)}</div>
                  </div>
                  <div>
                    <span className="text-slate-600">Mark</span>
                    <div className="text-white font-semibold">{fmt5(currentCandle.close)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-red-400/60" />
                    <div>
                      <span className="text-slate-600">SL </span>
                      <span className="text-red-400">{fmt5(openTrade.stop_loss)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-emerald-400/60" />
                    <div>
                      <span className="text-slate-600">TP </span>
                      <span className="text-emerald-400">{fmt5(openTrade.take_profit)}</span>
                    </div>
                  </div>
                </div>
                <div className={`rounded-lg px-2 py-1.5 text-center text-sm font-mono font-bold ${
                  analytics.unreal >= 0
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}>
                  {fmtPl(analytics.unreal)}
                </div>
                <button
                  type="button"
                  disabled={closingTrade}
                  onClick={() => void closeAtMarket()}
                  className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] py-1.5 text-[11px] font-mono text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <X className="h-3 w-3" />
                  {closingTrade ? "Closing…" : "Close @ Market"}
                </button>
              </div>
            </div>
          )}

          {/* Trade history */}
          <div className="flex-1 p-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-600 mb-2">
              Trades ({trades.filter((t) => t.status === "closed").length})
            </p>
            <div className="space-y-1.5">
              {trades.filter((t) => t.status === "closed").length === 0 && (
                <p className="text-[11px] text-slate-700 font-mono">No closed trades yet.</p>
              )}
              {trades
                .filter((t) => t.status === "closed")
                .slice()
                .reverse()
                .map((t) => (
                  <div
                    key={t.id}
                    className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-2 text-[11px] font-mono"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        t.direction === "BUY"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-red-500/15 text-red-400"
                      }`}>
                        {t.direction}
                      </span>
                      <span className={`font-semibold ${(t.pl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {fmtPl(t.pl ?? 0)}
                      </span>
                    </div>
                    <div className="text-slate-600 text-[10px]">
                      {fmt5(t.entry_price)} → {t.exit_price != null ? fmt5(t.exit_price) : "—"}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Keyboard hints */}
          <div className="shrink-0 border-t border-white/[0.04] px-3 py-2">
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-700">
              <Crosshair className="h-3 w-3 shrink-0" />
              <span>Space / ← → to step</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Trade open modal */}
      {session && (
        <TradeOpenModal
          open={modal.open}
          direction={modal.direction}
          symbol={session.symbol}
          entryPrice={currentCandle?.close ?? 0}
          onClose={() => setModal((m) => ({ ...m, open: false }))}
          onConfirm={(p) => void confirmTrade(p)}
        />
      )}
    </div>
  );
}
