"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  use,
} from "react";
import Link from "next/link";
import {
  BarChart2,
  SkipBack,
  ChevronRight as ChevronRightIcon,
  SkipForward,
  Play,
  Pause,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { ReplayChart, type ReplayChartHandle, type CandleOhlc, type ChartSettings, type ChartObject, DEFAULT_SETTINGS } from "@/components/backtesting/ReplayChart";
import { DrawingToolbar, type DrawingTool } from "@/components/backtesting/DrawingToolbar";
import { ChartContextMenu } from "@/components/backtesting/ChartContextMenu";
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
  return `bt_replay_idx_${sessionId}`;
}

function ChevLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ReplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

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
  const [chartSettings, setChartSettings] = useState<ChartSettings>(DEFAULT_SETTINGS);
  const [chartObjects, setChartObjects] = useState<ChartObject[]>([]);

  const chartRef = useRef<ReplayChartHandle>(null);
  const prevIndexRef = useRef(-1);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef<Session | null>(null);

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
  const loadOhlcv = useCallback(async (sess: Session, tf: BtTimeframe) => {
    setLoadingOhlcv(true);
    setOhlcvErr(null);
    prevIndexRef.current = -1;

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
      const sCandles = sessionJson.candles ?? [];

      setPreloadCandles(pCandles);
      setSessionCandles(sCandles);

      const saved = localStorage.getItem(lsKey(id));
      const idx = saved && tf === sess.timeframe
        ? Math.min(Number(saved), Math.max(0, sCandles.length - 1))
        : 0;
      setCurrentIndex(idx);

      const allCandles = [...pCandles, ...sCandles];
      chartRef.current?.setCandles(allCandles, pCandles.length + idx);
    } catch {
      setOhlcvErr("Network error loading candles");
    } finally {
      setLoadingOhlcv(false);
    }
  }, [id]);

  useEffect(() => {
    loadSession().then((sess) => {
      if (!sess) return;
      const tf = sess.timeframe;
      setTimeframe(tf);
      void loadOhlcv(sess, tf);
    }).catch(console.error);
  }, [loadSession, loadOhlcv]);

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
    try { localStorage.setItem(lsKey(id), String(currentIndex)); } catch { /* */ }
  }, [preloadCandles, sessionCandles, currentIndex, id]);

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
      await fetch(`/api/backtesting/trades/${ot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exit_price: exitPrice,
          exit_time: new Date(candle.time * 1000).toISOString(),
        }),
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

  async function closeTradeById(tradeId: string) {
    const cur = sessionCandles[currentIndex];
    if (!cur) return;
    await closeTrade(tradeId, cur.close, new Date(cur.time * 1000).toISOString());
  }

  async function updateTradeSLTP(tradeId: string, sl: number | null, tp: number | null) {
    const res = await fetch(`/api/backtesting/trades/${tradeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stop_loss: sl, take_profit: tp }),
    });
    if (res.ok) {
      // Optimistic local update
      setTrades((ts) => ts.map((t) => (t.id === tradeId ? { ...t, stop_loss: sl, take_profit: tp } : t)));
    } else {
      void loadSession();
    }
  }

  function handleTfChange(tf: BtTimeframe) {
    if (tf === timeframe || !session) return;
    setPlaying(false);
    setCurrentIndex(0);
    setTimeframe(tf);
    void loadOhlcv(session, tf);
  }

  const refreshObjects = useCallback(() => {
    const list = chartRef.current?.listObjects() ?? [];
    setChartObjects(list);
  }, []);

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
      className="-mx-4 -my-6 flex flex-col overflow-hidden sm:-mx-6 lg:-mx-8 lg:-my-8"
      style={{ height: "calc(100dvh - 56px)", background: "#080809" }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-white/[0.06] bg-[#0a0a12] px-3">
        <Link
          href="/app/backtesting"
          className="flex items-center gap-1 shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ChevLeft />
          <span className="hidden font-mono text-[11px] sm:block">Lab</span>
        </Link>
        <div className="h-4 w-px bg-white/[0.07] shrink-0" />

        {session && (
          <span className="font-display text-sm font-bold text-white shrink-0">{session.symbol}</span>
        )}

        {displayCandle && session && (
          <>
            <div className="h-4 w-px bg-white/[0.07] shrink-0" />
            <div className="hidden items-center gap-2 font-mono text-[11px] md:flex">
              <span>
                <span className="text-slate-600">O </span>
                <span className="text-slate-300">{fmtPrice(session.symbol, displayCandle.open)}</span>
              </span>
              <span>
                <span className="text-slate-600">H </span>
                <span className="text-[#26a69a]">{fmtPrice(session.symbol, displayCandle.high)}</span>
              </span>
              <span>
                <span className="text-slate-600">L </span>
                <span className="text-[#ef5350]">{fmtPrice(session.symbol, displayCandle.low)}</span>
              </span>
              <span>
                <span className="text-slate-600">C </span>
                <span className="font-semibold text-white">{fmtPrice(session.symbol, displayCandle.close)}</span>
              </span>
            </div>
          </>
        )}

        <div className="h-4 w-px bg-white/[0.07] shrink-0" />
        <div className="flex items-center gap-0.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              type="button"
              title={openTradeExists ? "Close open trades first" : undefined}
              disabled={openTradeExists}
              onClick={() => handleTfChange(tf)}
              className={`rounded px-2 py-1 font-mono text-[11px] transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                tf === timeframe
                  ? "bg-[#ff3c3c]/20 text-[#ff3c3c] ring-1 ring-[#ff3c3c]/30"
                  : "text-slate-600 hover:bg-white/[0.07] hover:text-slate-300"
              }`}
            >
              {TIMEFRAME_LABELS[tf]}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3 shrink-0">
          {session && (
            <div className="text-right">
              <div className="font-display text-sm font-bold text-white leading-tight">
                ${session.current_balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className={`font-mono text-[10px] leading-tight ${isProfit ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                {isProfit ? "+" : ""}{pl.toFixed(2)}
              </div>
            </div>
          )}
          <Link
            href={`/app/backtesting/session/${id}/results`}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] px-3 py-1.5 font-mono text-[11px] text-slate-400 transition-all hover:border-white/[0.15] hover:text-slate-200"
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

        <div className="relative flex-1 min-w-0">
          {loadingOhlcv && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#080809]/80 backdrop-blur-sm">
              <div className="flex items-center gap-3 font-mono text-sm text-slate-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#6366f1]" />
                Loading candles…
              </div>
            </div>
          )}
          {ohlcvErr && !loadingOhlcv && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="font-mono text-sm text-red-400">{ohlcvErr}</div>
            </div>
          )}
          <ReplayChart
            ref={chartRef}
            symbol={session?.symbol}
            activeTool={activeTool}
            settings={chartSettings}
            onCrosshairMove={setHoveredCandle}
            onContextMenu={(price, x, y) => setCtxMenu({ price, x, y })}
            onToolComplete={() => setActiveTool("cursor")}
            onPlacePosition={(dir, entry, sl, tp, lot) => {
              setTradePanel({ open: true, dir, presetSL: sl, presetTP: tp, presetLot: lot });
              setBottomTab("Trade");
            }}
            onUpdateTradeSLTP={(tradeId, sl, tp) => { void updateTradeSLTP(tradeId, sl, tp); }}
            onObjectsChange={refreshObjects}
          />
        </div>
      </div>

      {/* ── Bottom panel ─────────────────────────────────────────────────── */}
      <div
        className="flex shrink-0 flex-col border-t border-white/[0.06]"
        style={{ height: 220 }}
      >
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-white/[0.05] bg-[#080809] px-3">
          <div className="flex items-center gap-0.5">
            <TBtn title="Reset" onClick={reset} disabled={atStart}>
              <SkipBack className="h-3.5 w-3.5" />
            </TBtn>
            <TBtn title="← Prev" onClick={stepBack} disabled={atStart}>
              <ChevLeft />
            </TBtn>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              disabled={!sessionCandles.length || atEnd}
              className="mx-1 flex h-7 w-7 items-center justify-center rounded-lg bg-[#6366f1]/20 text-[#818cf8] ring-1 ring-[#6366f1]/30 transition-all hover:bg-[#6366f1]/30 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <TBtn title="Next →" onClick={stepForward} disabled={atEnd}>
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </TBtn>
            <TBtn title="Go to End" onClick={goToEnd} disabled={atEnd}>
              <SkipForward className="h-3.5 w-3.5" />
            </TBtn>
          </div>

          <div className="flex items-center gap-0.5 border-l border-white/[0.06] pl-2">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`rounded px-2 py-0.5 font-mono text-[11px] transition-colors ${
                  s === speed ? "bg-[#6366f1]/20 text-[#818cf8]" : "text-slate-700 hover:text-slate-400"
                }`}
              >
                {s}×
              </button>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2 border-l border-white/[0.06] pl-2">
            <div
              className="h-1 flex-1 min-w-0 cursor-pointer rounded-full"
              style={{ background: `linear-gradient(to right, #6366f1 ${progress}%, rgba(255,255,255,0.06) ${progress}%)` }}
            />
            <span className="shrink-0 font-mono text-[11px] text-slate-700 tabular-nums">
              {currentIndex + 1}<span className="text-slate-800">/{sessionCandles.length}</span>
            </span>
          </div>

          {currentCandle && (
            <span className="hidden shrink-0 font-mono text-[11px] text-slate-700 md:block border-l border-white/[0.06] pl-2">
              {new Date(currentCandle.time * 1000).toLocaleString(undefined, {
                month: "short", day: "numeric", year: "numeric",
                hour: "2-digit", minute: "2-digit",
                timeZone: chartSettings.timezone === "utc" ? "UTC" : undefined,
              })}
            </span>
          )}
        </div>

        <div className="flex h-8 shrink-0 items-center gap-1 border-b border-white/[0.05] bg-[#0a0a12] px-3">
          {BOTTOM_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setBottomTab(tab)}
              className={`rounded-lg px-3 py-1 font-mono text-[11px] transition-colors ${
                tab === bottomTab ? "bg-white/[0.06] text-slate-200" : "text-slate-600 hover:text-slate-400"
              }`}
            >
              {tab}
              {tab === "Positions" && openTrades.length > 0 && (
                <span className="ml-1.5 rounded-full bg-[#6366f1]/30 px-1.5 py-0.5 text-[9px] text-[#818cf8]">
                  {openTrades.length}
                </span>
              )}
            </button>
          ))}

          <div className="ml-auto flex gap-1.5">
            <button
              type="button"
              onClick={() => { setTradePanel({ open: true, dir: "BUY" }); setBottomTab("Trade"); }}
              className="flex items-center gap-1 rounded-lg bg-[#26a69a]/15 px-3 py-1 font-mono text-[11px] font-bold text-[#26a69a] transition-all hover:bg-[#26a69a]/25"
            >
              <TrendingUp className="h-3 w-3" />
              BUY
            </button>
            <button
              type="button"
              onClick={() => { setTradePanel({ open: true, dir: "SELL" }); setBottomTab("Trade"); }}
              className="flex items-center gap-1 rounded-lg bg-[#ef5350]/15 px-3 py-1 font-mono text-[11px] font-bold text-[#ef5350] transition-all hover:bg-[#ef5350]/25"
            >
              <TrendingDown className="h-3 w-3" />
              SELL
            </button>
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden">
          {bottomTab === "Trade" && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <p className="font-mono text-sm text-slate-600">
                {currentCandle
                  ? `Mark: ${fmtPrice(session?.symbol ?? "", currentCandle.close)}`
                  : "No candle loaded"}
              </p>
              <p className="font-mono text-[11px] text-slate-700">
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
              onTradeOpened={() => void loadSession()}
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
          openTrades={openTrades}
          settings={chartSettings}
          onClose={() => setCtxMenu(null)}
          onBuy={() => { setTradePanel({ open: true, dir: "BUY" }); setBottomTab("Trade"); setCtxMenu(null); }}
          onSell={() => { setTradePanel({ open: true, dir: "SELL" }); setBottomTab("Trade"); setCtxMenu(null); }}
          onResetView={() => { chartRef.current?.resetView(); setCtxMenu(null); }}
          onFocusObject={(objId) => chartRef.current?.focusObject(objId)}
          onRemoveObject={(objId) => { chartRef.current?.removeObject(objId); }}
          onCloseTrade={(tradeId) => { void closeTradeById(tradeId); setCtxMenu(null); }}
          onSettingsChange={setChartSettings}
        />
      )}
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
      className="flex h-7 w-7 items-center justify-center rounded text-slate-600 transition-colors hover:bg-white/[0.06] hover:text-slate-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-25"
    >
      {children}
    </button>
  );
}
