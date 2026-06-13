"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  BarChart2,
  SkipBack,
  ChevronRight as ChevronRightIcon,
  Play,
  Pause,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { ReplayChart, type ReplayChartHandle, type CandleOhlc, type ChartSettings, type ChartObject, type PersistedState, DEFAULT_SETTINGS } from "@/components/backtesting/ReplayChart";
import { DrawingToolbar, type DrawingTool } from "@/components/backtesting/DrawingToolbar";
import { ChartContextMenu } from "@/components/backtesting/ChartContextMenu";
import { DrawingContextMenu } from "@/components/backtesting/DrawingContextMenu";
import { TradePanel } from "@/components/backtesting/TradePanel";
import { OpenPositions } from "@/components/backtesting/OpenPositions";
import { fmtPrice, TIMEFRAMES, TIMEFRAME_LABELS } from "@/lib/backtesting/symbolMap";
import type { Session, Trade, Candle } from "@/lib/backtesting/types";
import type { BtTimeframe } from "@/lib/backtesting/types";
type SessionResponse = { session: Session; trades: Trade[] };
type OhlcvResponse = { candles: Candle[]; error?: string };

const BOTTOM_TABS = ["Trade", "Positions"] as const;
type BottomTab = (typeof BOTTOM_TABS)[number];

type ReplaySpeed = 1 | 2 | 5 | 10;
const SPEEDS: ReplaySpeed[] = [1, 2, 5, 10];

const SETTINGS_KEY = "bt_chart_settings";

function lsKey(sessionId: string) {
  return `bt_replay_state_${sessionId}`;
}

function saveReplayState(sessionId: string, index: number, timeframe: string) {
  try { localStorage.setItem(lsKey(sessionId), JSON.stringify({ index, timeframe })); } catch { /* */ }
}

function loadReplayState(sessionId: string): { index: number; timeframe: string } | null {
  try {
    const raw = localStorage.getItem(lsKey(sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === "object" && parsed !== null && "index" in parsed && "timeframe" in parsed) {
      return parsed as { index: number; timeframe: string };
    }
    // Legacy: plain number saved by old code
    const n = Number(raw);
    if (Number.isFinite(n)) return { index: n, timeframe: "" };
    return null;
  } catch { return null; }
}

function drawingsKey(sessionId: string) {
  return `bt_drawings_${sessionId}`;
}

function ChevLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export type BacktestingReplayViewProps = {
  sessionId: string;
  backHref: string;
  resultsHref: string;
};

export function BacktestingReplayView({ sessionId, backHref, resultsHref }: BacktestingReplayViewProps) {
  const id = sessionId;

  const [session, setSession] = useState<Session | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [preloadCandles, setPreloadCandles] = useState<Candle[]>([]);
  const [sessionCandles, setSessionCandles] = useState<Candle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeframe, setTimeframe] = useState<BtTimeframe>("H1");
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<ReplaySpeed>(1);
  const [loadingOhlcv, setLoadingOhlcv] = useState(false);
  const [ohlcvErr, setOhlcvErr] = useState<string | null>(null);
  const [bottomTab, setBottomTab] = useState<BottomTab>("Trade");
  const [tradePanel, setTradePanel] = useState<{
    open: boolean;
    dir: "BUY" | "SELL";
    presetSL?: number;
    presetTP?: number;
    presetLot?: number;
  }>({ open: false, dir: "BUY" });
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<DrawingTool>("cursor");
  const [hoveredCandle, setHoveredCandle] = useState<CandleOhlc | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ price: number; x: number; y: number } | null>(null);
  const [drawingMenu, setDrawingMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [chartSettings, setChartSettings] = useState<ChartSettings>(DEFAULT_SETTINGS);
  const [chartObjects, setChartObjects] = useState<ChartObject[]>([]);

  const chartRef = useRef<ReplayChartHandle>(null);
  const prevIndexRef = useRef(-1);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const drawingsLoadedRef = useRef(false);

  useEffect(() => { sessionRef.current = session; }, [session]);

  // ── Load settings from localStorage ─────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) setChartSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch { /* */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(chartSettings)); } catch { /* */ }
  }, [chartSettings]);

  // ── Load session ─────────────────────────────────────────────────────────
  const loadSession = useCallback(async () => {
    const res = await fetch(`/api/backtesting/sessions/${id}`);
    if (!res.ok) return null;
    const j = await res.json() as SessionResponse;
    setSession(j.session);
    setTrades(j.trades ?? []);
    return j.session;
  }, [id]);

  // ── Load OHLCV ───────────────────────────────────────────────────────────
  const loadOhlcv = useCallback(async (sess: Session, tf: BtTimeframe, targetTime?: number) => {
    setLoadingOhlcv(true);
    setOhlcvErr(null);
    // Reset prevIndexRef so the candle-sync effect won't skip the first render
    prevIndexRef.current = -2;

    try {
      const preloadQ = new URLSearchParams({
        symbol: sess.symbol,
        timeframe: tf,
        from: sess.date_from,
        preload: "true",
      });
      const sessionQ = new URLSearchParams({
        symbol: sess.symbol,
        timeframe: tf,
        from: sess.date_from,
        to: sess.date_to,
      });

      const [preloadRes, sessionRes] = await Promise.all([
        fetch(`/api/backtesting/ohlcv?${preloadQ.toString()}`),
        fetch(`/api/backtesting/ohlcv?${sessionQ.toString()}`),
      ]);

      const [preloadJson, sessionJson] = await Promise.all([
        preloadRes.json() as Promise<OhlcvResponse>,
        sessionRes.json() as Promise<OhlcvResponse>,
      ]);

      if (!sessionRes.ok) {
        setOhlcvErr(sessionJson.error ?? "Failed to load candles");
        return;
      }

      const pCandles = preloadRes.ok ? (preloadJson.candles ?? []) : [];
      const rawSCandles = sessionJson.candles ?? [];

      // Deduplicate: session candles may overlap preload at boundary
      const preloadTimes = new Set(pCandles.map((c) => c.time));
      const sCandles = rawSCandles.filter((c) => !preloadTimes.has(c.time));

      // Find index: if targetTime provided (TF switch), find closest candle;
      // else restore saved index for the session's original TF.
      let idx = 0;
      if (targetTime != null && sCandles.length > 0) {
        // Find the last session candle with time <= targetTime
        let best = 0;
        for (let i = 0; i < sCandles.length; i++) {
          if (sCandles[i].time <= targetTime) best = i;
          else break;
        }
        idx = best;
      } else {
        const saved = loadReplayState(id);
        if (saved && saved.timeframe === tf && sCandles.length > 0) {
          idx = Math.min(saved.index, sCandles.length - 1);
        }
      }

      const allCandles = [...pCandles, ...sCandles];

      // Update chart directly first, then sync React state.
      // prevIndexRef=-2 ensures the follow-up effect always calls setCandles, not appendCandle.
      chartRef.current?.setCandles(allCandles, pCandles.length + idx);
      prevIndexRef.current = idx;

      setPreloadCandles(pCandles);
      setSessionCandles(sCandles);
      setCurrentIndex(idx);
    } catch {
      setOhlcvErr("Network error loading candles");
    } finally {
      setLoadingOhlcv(false);
    }
  }, [id]);

  useEffect(() => {
    loadSession().then((sess) => {
      if (!sess) return;
      const saved = loadReplayState(id);
      // Restore saved timeframe if valid, else fall back to session default
      const tf = (saved?.timeframe && (["M1","M5","M15","M30","H1","H4","D1"] as string[]).includes(saved.timeframe))
        ? saved.timeframe as BtTimeframe
        : sess.timeframe as BtTimeframe;
      setTimeframe(tf);
      void loadOhlcv(sess, tf);
    }).catch(console.error);
  }, [loadSession, loadOhlcv, id]);

  useEffect(() => {
    if (!sessionCandles.length) return;
    const prev = prevIndexRef.current;
    if (currentIndex === prev + 1 && prev >= 0) {
      chartRef.current?.appendCandle(sessionCandles[currentIndex]);
    } else if (prev !== currentIndex) {
      const all = [...preloadCandles, ...sessionCandles];
      chartRef.current?.setCandles(all, preloadCandles.length + currentIndex);
    }
    prevIndexRef.current = currentIndex;
    saveReplayState(id, currentIndex, timeframe);
  }, [preloadCandles, sessionCandles, currentIndex, id, timeframe]);

  // ── Trade price lines ───────────────────────────────────────────────────
  const openTrade = trades.find((t) => t.status === "open") ?? null;
  useEffect(() => {
    if (openTrade) {
      chartRef.current?.setTradeLines({
        id: openTrade.id,
        direction: openTrade.direction,
        entry_price: openTrade.entry_price,
        stop_loss: openTrade.stop_loss,
        take_profit: openTrade.take_profit,
      });
    } else {
      chartRef.current?.clearTradeLines();
    }
  }, [openTrade]);

  // ── Auto-close SL/TP ─────────────────────────────────────────────────────
  const checkAutoClose = useCallback(async (candle: Candle) => {
    const ot = trades.find((t) => t.status === "open");
    if (!ot) return;
    let hit = false;
    let exitPrice = candle.close;
    if (ot.direction === "BUY") {
      if (ot.stop_loss != null && candle.low <= ot.stop_loss) { hit = true; exitPrice = ot.stop_loss; }
      else if (ot.take_profit != null && candle.high >= ot.take_profit) { hit = true; exitPrice = ot.take_profit; }
    } else {
      if (ot.stop_loss != null && candle.high >= ot.stop_loss) { hit = true; exitPrice = ot.stop_loss; }
      else if (ot.take_profit != null && candle.low <= ot.take_profit) { hit = true; exitPrice = ot.take_profit; }
    }
    if (hit) {
      const exitTime = new Date(candle.time * 1000).toISOString();
      await fetch(`/api/backtesting/trades/${ot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exit_price: exitPrice, exit_time: exitTime }),
      });
      void loadSession();
    }
  }, [trades, loadSession]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const stepForward = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = Math.min(prev + 1, sessionCandles.length - 1);
      if (next !== prev && sessionCandles[next]) void checkAutoClose(sessionCandles[next]);
      return next;
    });
  }, [sessionCandles, checkAutoClose]);

  const stepBack = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const reset = useCallback(() => {
    setPlaying(false);
    setCurrentIndex(0);
  }, []);

  const goToEnd = useCallback(() => {
    setCurrentIndex(sessionCandles.length - 1);
  }, [sessionCandles.length]);

  // ── Auto-play ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (autoPlayRef.current) { clearInterval(autoPlayRef.current); autoPlayRef.current = null; }
    if (!playing) return;
    if (currentIndex >= sessionCandles.length - 1) { setPlaying(false); return; }
    const ms = Math.round(800 / speed);
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = Math.min(prev + 1, sessionCandles.length - 1);
        if (next >= sessionCandles.length - 1) setPlaying(false);
        if (next !== prev && sessionCandles[next]) void checkAutoClose(sessionCandles[next]);
        return next;
      });
    }, ms);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [playing, speed, sessionCandles, currentIndex, checkAutoClose]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Ctrl+Z undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        chartRef.current?.undo();
        return;
      }

      if (e.code === "Space" || e.code === "ArrowRight") { e.preventDefault(); stepForward(); }
      if (e.code === "ArrowLeft") { e.preventDefault(); stepBack(); }
      if (e.key.toLowerCase() === "b") { setTradePanel({ open: true, dir: "BUY" }); setBottomTab("Trade"); }
      if (e.key.toLowerCase() === "s") { setTradePanel({ open: true, dir: "SELL" }); setBottomTab("Trade"); }
      if (e.code === "Escape") setTradePanel((p) => ({ ...p, open: false }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepForward, stepBack]);

  // ── Trade actions ─────────────────────────────────────────────────────────
  async function closeTrade(tradeId: string, exitPrice: number, exitTime: string) {
    setClosingTradeId(tradeId);
    await fetch(`/api/backtesting/trades/${tradeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exit_price: exitPrice, exit_time: exitTime }),
    });
    setClosingTradeId(null);
    void loadSession();
  }

  async function updateTradeSLTP(tradeId: string, sl: number | null, tp: number | null) {
    const res = await fetch(`/api/backtesting/trades/${tradeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stop_loss: sl, take_profit: tp }),
    });
    if (res.ok) {
      setTrades((ts) => ts.map((t) => (t.id === tradeId ? { ...t, stop_loss: sl, take_profit: tp } : t)));
    } else {
      void loadSession();
    }
  }

  function handleTfChange(tf: BtTimeframe) {
    if (tf === timeframe || !session) return;
    setPlaying(false);
    // Capture current timestamp to restore position in new TF
    const currentTime = sessionCandles[currentIndex]?.time;
    setTimeframe(tf);
    void loadOhlcv(session, tf, currentTime);
  }

  const refreshObjects = useCallback(() => {
    const list = chartRef.current?.listObjects() ?? [];
    setChartObjects(list);
  }, []);

  // Persist drawings (throttled by the ReplayChart onStateChange callback)
  const saveDrawings = useCallback(() => {
    if (!drawingsLoadedRef.current) return; // avoid clobbering before first load
    const st = chartRef.current?.getState();
    if (!st) return;
    try { localStorage.setItem(drawingsKey(id), JSON.stringify(st)); } catch { /* */ }
  }, [id]);

  useEffect(() => {
    drawingsLoadedRef.current = false;
  }, [id]);

  // Load drawings once after session candles are ready
  useEffect(() => {
    if (drawingsLoadedRef.current) return;
    if (!sessionCandles.length) return;
    if (!chartRef.current) return;
    try {
      const raw = localStorage.getItem(drawingsKey(id));
      if (raw) {
        const st = JSON.parse(raw) as PersistedState;
        chartRef.current.setState(st);
        refreshObjects();
      }
    } catch { /* */ }
    drawingsLoadedRef.current = true;
  }, [sessionCandles, id, refreshObjects]);

  const openTrades = trades.filter((t) => t.status === "open");

  const currentCandle = sessionCandles[currentIndex] ?? null;
  const displayCandle = hoveredCandle ?? (currentCandle ? currentCandle : null);
  const pl = session ? session.current_balance - session.initial_balance : 0;
  const isProfit = pl >= 0;
  const atStart = currentIndex <= 0;
  const atEnd = currentIndex >= sessionCandles.length - 1;
  const openTradeExists = !!openTrade;

  const progress = sessionCandles.length > 1
    ? (currentIndex / (sessionCandles.length - 1)) * 100
    : 0;

  return (
    <div
      className="relative -mx-4 -my-6 flex flex-col overflow-hidden sm:-mx-6 lg:-mx-8 lg:-my-8"
      style={{ height: "calc(100dvh - 56px)", background: "#FFFFFF" }}
    >
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
      {/* ── Top bar — TradingView style ──────────────────────────────────── */}
      <div
        className="flex h-11 shrink-0 items-center gap-0 border-b"
        style={{ background: "#FFFFFF", borderColor: "#E1E3EA" }}
      >
        {/* Back button */}
        <Link
          href={backHref}
          className="flex h-full items-center gap-1.5 border-r px-3 text-xs transition-colors hover:bg-[#F1F3F8]"
          style={{ borderColor: "#E1E3EA", color: "#6B7280" }}
        >
          <ChevLeft />
          <span className="hidden font-mono text-[11px] sm:block">Lab</span>
        </Link>

        {/* Symbol */}
        {session && (
          <div
            className="flex h-full items-center border-r px-3"
            style={{ borderColor: "#E1E3EA" }}
          >
            <span className="font-[family-name:var(--font-display)] text-[13px] font-bold" style={{ color: "#131722" }}>
              {session.symbol}
            </span>
          </div>
        )}

        {/* OHLC */}
        {displayCandle && session && (
          <div
            className="hidden h-full items-center gap-3 border-r px-3 font-mono text-[11px] md:flex"
            style={{ borderColor: "#E1E3EA" }}
          >
            <span>
              <span style={{ color: "#9CA3AF" }}>O </span>
              <span style={{ color: "#131722" }}>{fmtPrice(session.symbol, displayCandle.open)}</span>
            </span>
            <span>
              <span style={{ color: "#9CA3AF" }}>H </span>
              <span style={{ color: "#26a69a" }}>{fmtPrice(session.symbol, displayCandle.high)}</span>
            </span>
            <span>
              <span style={{ color: "#9CA3AF" }}>L </span>
              <span style={{ color: "#ef5350" }}>{fmtPrice(session.symbol, displayCandle.low)}</span>
            </span>
            <span>
              <span style={{ color: "#9CA3AF" }}>C </span>
              <span className="font-semibold" style={{ color: "#131722" }}>{fmtPrice(session.symbol, displayCandle.close)}</span>
            </span>
          </div>
        )}

        {/* Timeframes */}
        <div
          className="flex h-full items-center border-r px-2"
          style={{ borderColor: "#E1E3EA" }}
        >
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              type="button"
              title={openTradeExists ? "Close open trades first" : undefined}
              disabled={openTradeExists}
              onClick={() => handleTfChange(tf)}
              className="flex h-7 items-center rounded px-2 font-mono text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={
                tf === timeframe
                  ? { background: "#2962FF18", color: "#2962FF", boxShadow: "inset 0 0 0 1px #2962FF30" }
                  : { color: "#6B7280" }
              }
              onMouseEnter={(e) => {
                if (tf !== timeframe && !openTradeExists) (e.currentTarget as HTMLElement).style.background = "#F1F3F8";
              }}
              onMouseLeave={(e) => {
                if (tf !== timeframe) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {TIMEFRAME_LABELS[tf]}
            </button>
          ))}
        </div>

        {/* Right: balance + results */}
        <div className="ml-auto flex h-full items-center gap-0">
          {session && (
            <div
              className="flex h-full items-center gap-2 border-l px-3"
              style={{ borderColor: "#E1E3EA" }}
            >
              <div className="text-right">
                <div className="font-[family-name:var(--font-display)] text-sm font-bold leading-tight" style={{ color: "#131722" }}>
                  ${session.current_balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className={`font-mono text-[10px] leading-tight ${isProfit ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                  {isProfit ? "+" : ""}{pl.toFixed(2)}
                </div>
              </div>
            </div>
          )}
          <Link
            href={resultsHref}
            className="flex h-full items-center gap-1.5 border-l px-3 font-mono text-[11px] transition-colors hover:bg-[#F1F3F8]"
            style={{ borderColor: "#E1E3EA", color: "#6B7280" }}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span className="hidden sm:block">Results</span>
          </Link>
        </div>
      </div>

      {/* ── Chart area ──────────────────────────────────────────────────── */}
      <div className="relative flex min-h-0 flex-1 flex-row">
        <DrawingToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onClearAll={() => { chartRef.current?.clearDrawings(); refreshObjects(); }}
        />

        <div className="relative flex-1 min-w-0" style={{ background: "#FFFFFF" }}>
          {loadingOhlcv && (
            <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)" }}>
              <div className="flex items-center gap-3 font-mono text-sm" style={{ color: "#6B7280" }}>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "#2962FF" }} />
                Loading candles…
              </div>
            </div>
          )}
          {ohlcvErr && !loadingOhlcv && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 rounded-xl border px-6 py-5 text-center shadow-sm" style={{ background: "#FFFFFF", borderColor: "#E1E3EA" }}>
                <p className="font-mono text-sm text-red-500">{ohlcvErr}</p>
                <button
                  type="button"
                  onClick={() => session && void loadOhlcv(session, timeframe)}
                  className="rounded-lg border px-4 py-1.5 font-mono text-xs transition hover:bg-gray-50"
                  style={{ borderColor: "#E1E3EA", color: "#6B7280" }}
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          <ReplayChart
            ref={chartRef}
            symbol={session?.symbol}
            activeTool={activeTool}
            settings={chartSettings}
            onCrosshairMove={setHoveredCandle}
            onContextMenu={(price, x, y) => { setDrawingMenu(null); setCtxMenu({ price, x, y }); }}
            onDrawingContextMenu={(objId, x, y) => { setCtxMenu(null); setDrawingMenu({ id: objId, x, y }); }}
            onToolComplete={() => setActiveTool("cursor")}
            onPlacePosition={(dir, entry, sl, tp, lot) => {
              setTradePanel({ open: true, dir, presetSL: sl, presetTP: tp, presetLot: lot });
              setBottomTab("Trade");
            }}
            onUpdateTradeSLTP={(tradeId, sl, tp) => { void updateTradeSLTP(tradeId, sl, tp); }}
            onObjectsChange={refreshObjects}
            onStateChange={saveDrawings}
          />
        </div>
      </div>

      {/* ── Bottom panel — TradingView style ─────────────────────────────── */}
      <div
        className="flex shrink-0 flex-col border-t"
        style={{ height: 220, background: "#FFFFFF", borderColor: "#E1E3EA" }}
      >
        {/* Replay controls row */}
        <div
          className="flex h-16 shrink-0 items-center gap-3 border-b px-4"
          style={{ background: "#FAFBFC", borderColor: "#E1E3EA" }}
        >
          {/* Reset */}
          <TBtn title="Reset" onClick={reset} disabled={atStart}>
            <SkipBack className="h-3.5 w-3.5" />
          </TBtn>

          {/* Core replay controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              title="← Prev candle"
              onClick={stepBack}
              disabled={atStart}
              className="flex h-10 w-10 items-center justify-center rounded-lg border transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
              style={{ borderColor: "#E1E3EA", color: "#374151", background: "#FFFFFF" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F1F3F8"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#FFFFFF"; }}
            >
              <ChevLeft />
            </button>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              disabled={!sessionCandles.length || atEnd}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-white shadow-md transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
              style={{ background: "#2962FF", boxShadow: "0 2px 8px rgba(41,98,255,0.3)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#1E4BCC"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#2962FF"; }}
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button
              type="button"
              title="Next candle →"
              onClick={stepForward}
              disabled={atEnd}
              className="flex h-10 w-10 items-center justify-center rounded-lg border transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
              style={{ borderColor: "#E1E3EA", color: "#374151", background: "#FFFFFF" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F1F3F8"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#FFFFFF"; }}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Speed */}
          <div className="flex items-center gap-0.5 border-l pl-3" style={{ borderColor: "#E1E3EA" }}>
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className="rounded px-2 py-0.5 font-mono text-[11px] transition-colors"
                style={
                  s === speed
                    ? { background: "#2962FF18", color: "#2962FF", boxShadow: "inset 0 0 0 1px #2962FF30" }
                    : { color: "#9CA3AF" }
                }
              >
                {s}×
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="flex min-w-0 flex-1 items-center gap-2 border-l pl-3" style={{ borderColor: "#E1E3EA" }}>
            <div
              className="h-1 flex-1 min-w-0 cursor-pointer rounded-full"
              style={{ background: `linear-gradient(to right, #2962FF ${progress}%, #E1E3EA ${progress}%)` }}
            />
            <span className="shrink-0 font-mono text-[11px] tabular-nums" style={{ color: "#9CA3AF" }}>
              {currentIndex + 1}<span style={{ color: "#CBD5E1" }}>/{sessionCandles.length}</span>
            </span>
          </div>

          {currentCandle && (
            <span
              className="hidden shrink-0 font-mono text-[11px] md:block border-l pl-3"
              style={{ borderColor: "#E1E3EA", color: "#9CA3AF" }}
            >
              {new Date(currentCandle.time * 1000).toLocaleString(undefined, {
                month: "short", day: "numeric", year: "numeric",
                hour: "2-digit", minute: "2-digit",
                timeZone: chartSettings.timezone && chartSettings.timezone !== "local" ? chartSettings.timezone : undefined,
              })}
            </span>
          )}
        </div>

        {/* Tab bar + BUY/SELL */}
        <div
          className="flex h-8 shrink-0 items-center gap-1 border-b px-3"
          style={{ background: "#FAFBFC", borderColor: "#E1E3EA" }}
        >
          {BOTTOM_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setBottomTab(tab)}
              className="rounded px-3 py-1 font-mono text-[11px] transition-colors"
              style={
                tab === bottomTab
                  ? { background: "#2962FF18", color: "#2962FF", boxShadow: "inset 0 0 0 1px #2962FF30" }
                  : { color: "#9CA3AF" }
              }
            >
              {tab}
              {tab === "Positions" && openTrades.length > 0 && (
                <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[9px]" style={{ background: "#2962FF20", color: "#2962FF" }}>
                  {openTrades.length}
                </span>
              )}
            </button>
          ))}

          <div className="ml-auto flex gap-1.5">
            <button
              type="button"
              onClick={() => { setTradePanel({ open: true, dir: "BUY" }); setBottomTab("Trade"); }}
              className="flex items-center gap-1 rounded px-3 py-1 font-mono text-[11px] font-bold transition-colors"
              style={{ background: "#26a69a18", color: "#26a69a", border: "1px solid #26a69a30" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#26a69a25"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#26a69a18"; }}
            >
              <TrendingUp className="h-3 w-3" />
              BUY
            </button>
            <button
              type="button"
              onClick={() => { setTradePanel({ open: true, dir: "SELL" }); setBottomTab("Trade"); }}
              className="flex items-center gap-1 rounded px-3 py-1 font-mono text-[11px] font-bold transition-colors"
              style={{ background: "#ef535018", color: "#ef5350", border: "1px solid #ef535030" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#ef535025"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#ef535018"; }}
            >
              <TrendingDown className="h-3 w-3" />
              SELL
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="relative flex-1 overflow-hidden" style={{ background: "#FFFFFF" }}>
          {bottomTab === "Trade" && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <p className="font-mono text-sm" style={{ color: "#9CA3AF" }}>
                {currentCandle
                  ? `Mark: ${fmtPrice(session?.symbol ?? "", currentCandle.close)}`
                  : "No candle loaded"}
              </p>
              <p className="font-mono text-[11px]" style={{ color: "#CBD5E1" }}>
                B to buy · S to sell · Space / → for next candle · Ctrl+Z to undo
              </p>
            </div>
          )}
          {bottomTab === "Positions" && (
            <div className="h-full overflow-y-auto px-4 py-3">
              <OpenPositions
                trades={trades}
                currentCandle={currentCandle}
                onClose={closeTrade}
                closing={closingTradeId}
              />
            </div>
          )}

          {session && (
            <TradePanel
              open={tradePanel.open}
              defaultDirection={tradePanel.dir}
              currentCandle={currentCandle}
              symbol={session.symbol}
              sessionId={id}
              presetSL={tradePanel.presetSL}
              presetTP={tradePanel.presetTP}
              presetLot={tradePanel.presetLot}
              onClose={() => setTradePanel((p) => ({ ...p, open: false }))}
              onTradeOpened={() => { void loadSession(); }}
            />
          )}
        </div>
      </div>

      {/* ── Chart context menu ───────────────────────────────────────────── */}
      {ctxMenu && (
        <ChartContextMenu
          price={ctxMenu.price}
          clientX={ctxMenu.x}
          clientY={ctxMenu.y}
          symbol={session?.symbol ?? ""}
          objects={chartObjects}
          settings={chartSettings}
          onClose={() => setCtxMenu(null)}
          onBuy={() => { setTradePanel({ open: true, dir: "BUY" }); setBottomTab("Trade"); setCtxMenu(null); }}
          onSell={() => { setTradePanel({ open: true, dir: "SELL" }); setBottomTab("Trade"); setCtxMenu(null); }}
          onResetView={() => { chartRef.current?.resetView(); setCtxMenu(null); }}
          onFocusObject={(objId) => chartRef.current?.focusObject(objId)}
          onRemoveObject={(objId) => { chartRef.current?.removeObject(objId); }}
          onSettingsChange={setChartSettings}
        />
      )}

      {/* ── Drawing right-click menu ─────────────────────────────────────── */}
      {drawingMenu && (
        <DrawingContextMenu
          clientX={drawingMenu.x}
          clientY={drawingMenu.y}
          onClose={() => setDrawingMenu(null)}
          onRemove={() => { chartRef.current?.removeObject(drawingMenu.id); setDrawingMenu(null); }}
          onFocus={() => { chartRef.current?.focusObject(drawingMenu.id); setDrawingMenu(null); }}
        />
      )}
      </div>
    </div>
  );
}

function TBtn({
  children, title, onClick, disabled,
}: {
  children: React.ReactNode;
  title?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded transition-colors active:scale-95 disabled:cursor-not-allowed disabled:opacity-25"
      style={{ color: "#6B7280" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F1F3F8"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}
