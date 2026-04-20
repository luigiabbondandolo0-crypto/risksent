"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  use,
} from "react";
import Link from "next/link";
import { ChevronLeft, TrendingUp, TrendingDown, BarChart2 } from "lucide-react";
import { ReplayChart, type ReplayChartHandle } from "@/components/backtesting/ReplayChart";
import { ReplayControls, type ReplaySpeed } from "@/components/backtesting/ReplayControls";
import { TradePanel } from "@/components/backtesting/TradePanel";
import { OpenPositions } from "@/components/backtesting/OpenPositions";
import { fmtPrice } from "@/lib/backtesting/symbolMap";
import type { Session, Trade, Candle } from "@/lib/backtesting/types";

type SessionResponse = { session: Session; trades: Trade[] };
type OhlcvResponse = { candles: Candle[] };

const BOTTOM_TABS = ["Trade", "Positions"] as const;
type BottomTab = (typeof BOTTOM_TABS)[number];

function lsKey(sessionId: string) {
  return `bt_replay_idx_${sessionId}`;
}

export default function ReplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [session, setSession] = useState<Session | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<ReplaySpeed>(1);
  const [loadingOhlcv, setLoadingOhlcv] = useState(false);
  const [ohlcvErr, setOhlcvErr] = useState<string | null>(null);
  const [bottomTab, setBottomTab] = useState<BottomTab>("Trade");
  const [tradePanel, setTradePanel] = useState<{ open: boolean; dir: "BUY" | "SELL" }>({ open: false, dir: "BUY" });
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);

  const chartRef = useRef<ReplayChartHandle>(null);
  const prevIndexRef = useRef(-1);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load session ─────────────────────────────────────────────────────────
  const loadSession = useCallback(async () => {
    const res = await fetch(`/api/backtesting/sessions/${id}`);
    if (!res.ok) return;
    const j = await res.json() as SessionResponse;
    setSession(j.session);
    setTrades(j.trades ?? []);
    return j.session;
  }, [id]);

  // ── Load OHLCV ──────────────────────────────────────────────────────────
  const loadOhlcv = useCallback(async (sess: Session) => {
    setLoadingOhlcv(true);
    setOhlcvErr(null);
    const q = new URLSearchParams({
      symbol: sess.symbol,
      timeframe: sess.timeframe,
      from: sess.date_from,
      to: sess.date_to,
    });
    const res = await fetch(`/api/backtesting/ohlcv?${q.toString()}`);
    const j = await res.json() as OhlcvResponse & { error?: string };
    setLoadingOhlcv(false);
    if (!res.ok) { setOhlcvErr(j.error ?? "Failed to load data"); return; }
    const list = j.candles ?? [];
    setCandles(list);

    // Restore saved index from localStorage
    const saved = localStorage.getItem(lsKey(id));
    const idx = saved ? Math.min(Number(saved), Math.max(0, list.length - 1)) : 0;
    setCurrentIndex(idx);
    prevIndexRef.current = -1; // force full setData

    chartRef.current?.setCandles(list, idx);
  }, [id]);

  useEffect(() => {
    loadSession().then((sess) => {
      if (sess) void loadOhlcv(sess);
    }).catch(console.error);
  }, [loadSession, loadOhlcv]);

  // ── Sync chart when index changes ────────────────────────────────────────
  useEffect(() => {
    if (!candles.length) return;
    const prev = prevIndexRef.current;
    if (currentIndex === prev + 1 && prev >= 0) {
      chartRef.current?.appendCandle(candles[currentIndex]);
    } else {
      chartRef.current?.setCandles(candles, currentIndex);
    }
    prevIndexRef.current = currentIndex;

    // Persist index
    try { localStorage.setItem(lsKey(id), String(currentIndex)); } catch { /* */ }
  }, [candles, currentIndex, id]);

  // ── Trade price lines ───────────────────────────────────────────────────
  const openTrade = trades.find((t) => t.status === "open") ?? null;
  useEffect(() => {
    if (openTrade) {
      chartRef.current?.setTradeLines(
        openTrade.entry_price,
        openTrade.stop_loss ?? null,
        openTrade.take_profit ?? null,
      );
    } else {
      chartRef.current?.clearTradeLines();
    }
  }, [openTrade]);

  // ── Auto-close SL/TP ────────────────────────────────────────────────────
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

  // ── Step forward ────────────────────────────────────────────────────────
  const stepForward = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = Math.min(prev + 1, candles.length - 1);
      if (next !== prev && candles[next]) {
        void checkAutoClose(candles[next]);
      }
      return next;
    });
  }, [candles, checkAutoClose]);

  const stepBack = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const reset = useCallback(() => {
    setPlaying(false);
    setCurrentIndex(0);
  }, []);

  // ── Auto-play ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (autoPlayRef.current) { clearInterval(autoPlayRef.current); autoPlayRef.current = null; }
    if (!playing) return;
    if (currentIndex >= candles.length - 1) { setPlaying(false); return; }
    const ms = Math.round(800 / speed);
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = Math.min(prev + 1, candles.length - 1);
        if (next >= candles.length - 1) setPlaying(false);
        if (next !== prev && candles[next]) void checkAutoClose(candles[next]);
        return next;
      });
    }, ms);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [playing, speed, candles.length, currentIndex, candles, checkAutoClose]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space" || e.code === "ArrowRight") { e.preventDefault(); stepForward(); }
      if (e.code === "ArrowLeft") { e.preventDefault(); stepBack(); }
      if (e.key.toLowerCase() === "b") { setTradePanel({ open: true, dir: "BUY" }); setBottomTab("Trade"); }
      if (e.key.toLowerCase() === "s") { setTradePanel({ open: true, dir: "SELL" }); setBottomTab("Trade"); }
      if (e.code === "Escape") setTradePanel((p) => ({ ...p, open: false }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepForward, stepBack]);

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

  const currentCandle = candles[currentIndex] ?? null;
  const pl = session ? session.current_balance - session.initial_balance : 0;
  const isProfit = pl >= 0;

  return (
    <div
      className="-mx-4 -my-6 flex flex-col overflow-hidden sm:-mx-6 lg:-mx-8 lg:-my-8"
      style={{ height: "calc(100dvh - 56px)", background: "#080809" }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#0a0a12] px-4">
        <Link href="/app/backtesting" className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden font-mono text-[11px] sm:block">Lab</span>
        </Link>
        <div className="h-4 w-px bg-white/[0.07]" />

        {/* Symbol + TF */}
        {session && (
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-bold text-white">{session.symbol}</span>
            <span className="rounded bg-[#6366f1]/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#818cf8] uppercase">
              {session.timeframe}
            </span>
          </div>
        )}

        {/* OHLCV */}
        {currentCandle && (
          <>
            <div className="h-4 w-px bg-white/[0.07]" />
            <div className="hidden items-center gap-3 font-mono text-[11px] md:flex">
              <span><span className="text-slate-600">O </span><span className="text-slate-300">{fmtPrice(session?.symbol ?? "", currentCandle.open)}</span></span>
              <span><span className="text-slate-600">H </span><span className="text-[#00e676]">{fmtPrice(session?.symbol ?? "", currentCandle.high)}</span></span>
              <span><span className="text-slate-600">L </span><span className="text-[#ff3c3c]">{fmtPrice(session?.symbol ?? "", currentCandle.low)}</span></span>
              <span><span className="text-slate-600">C </span><span className="font-semibold text-white">{fmtPrice(session?.symbol ?? "", currentCandle.close)}</span></span>
            </div>
          </>
        )}

        {/* Right: balance + stats */}
        <div className="ml-auto flex items-center gap-4">
          {session && (
            <div className="text-right">
              <div className="font-display text-sm font-bold text-white">
                ${session.current_balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className={`font-mono text-[10px] ${isProfit ? "text-[#00e676]" : "text-[#ff3c3c]"}`}>
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

      {/* ── Chart area (~75%) ─────────────────────────────────────────────── */}
      <div className="relative flex-1 min-h-0" style={{ flexBasis: "75%" }}>
        {loadingOhlcv && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#080809]/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 font-mono text-sm text-slate-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#6366f1]" />
              Loading candles…
            </div>
          </div>
        )}
        {ohlcvErr && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="font-mono text-sm text-red-400">{ohlcvErr}</div>
          </div>
        )}
        <ReplayChart ref={chartRef} symbol={session?.symbol} />

        {/* Replay controls */}
        <div className="absolute inset-x-0 bottom-0">
          <ReplayControls
            currentIndex={currentIndex}
            total={candles.length}
            playing={playing}
            speed={speed}
            onPrev={stepBack}
            onNext={stepForward}
            onReset={reset}
            onEnd={() => setCurrentIndex(candles.length - 1)}
            onTogglePlay={() => setPlaying((p) => !p)}
            onSpeedChange={setSpeed}
          />
        </div>
      </div>

      {/* ── Bottom panel (~25%) ──────────────────────────────────────────── */}
      <div className="relative flex flex-col border-t border-white/[0.06]" style={{ flexBasis: "25%", minHeight: 160 }}>
        {/* Tabs */}
        <div className="flex h-9 shrink-0 items-center gap-1 border-b border-white/[0.05] bg-[#0a0a12] px-3">
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
              {tab === "Positions" && trades.filter((t) => t.status === "open").length > 0 && (
                <span className="ml-1.5 rounded-full bg-[#6366f1]/30 px-1.5 py-0.5 text-[9px] text-[#818cf8]">
                  {trades.filter((t) => t.status === "open").length}
                </span>
              )}
            </button>
          ))}

          {/* Quick BUY/SELL buttons */}
          <div className="ml-auto flex gap-1.5">
            <button
              type="button"
              onClick={() => { setTradePanel({ open: true, dir: "BUY" }); setBottomTab("Trade"); }}
              className="flex items-center gap-1 rounded-lg bg-[#00e676]/15 px-3 py-1 font-mono text-[11px] font-bold text-[#00e676] transition-all hover:bg-[#00e676]/25"
            >
              <TrendingUp className="h-3 w-3" />
              BUY
            </button>
            <button
              type="button"
              onClick={() => { setTradePanel({ open: true, dir: "SELL" }); setBottomTab("Trade"); }}
              className="flex items-center gap-1 rounded-lg bg-[#ff3c3c]/15 px-3 py-1 font-mono text-[11px] font-bold text-[#ff3c3c] transition-all hover:bg-[#ff3c3c]/25"
            >
              <TrendingDown className="h-3 w-3" />
              SELL
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {bottomTab === "Trade" && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <p className="font-mono text-sm text-slate-600">
                {currentCandle ? `Mark: ${fmtPrice(session?.symbol ?? "", currentCandle.close)}` : "No candle loaded"}
              </p>
              <p className="font-mono text-[11px] text-slate-700">Press B to buy · S to sell · Space for next candle</p>
            </div>
          )}
          {bottomTab === "Positions" && (
            <OpenPositions
              trades={trades}
              currentCandle={currentCandle}
              onClose={closeTrade}
              closing={closingTradeId}
            />
          )}
        </div>

        {/* Trade panel slide-up */}
        {session && (
          <TradePanel
            open={tradePanel.open}
            defaultDirection={tradePanel.dir}
            currentCandle={currentCandle}
            symbol={session.symbol}
            sessionId={id}
            onClose={() => setTradePanel((p) => ({ ...p, open: false }))}
            onTradeOpened={() => void loadSession()}
          />
        )}
      </div>
    </div>
  );
}
