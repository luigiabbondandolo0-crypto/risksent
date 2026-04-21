"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import {
  createChart,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/lib/backtesting/types";
import type { DrawingTool } from "./DrawingToolbar";

export type CandleOhlc = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type ReplayChartHandle = {
  setCandles: (candles: Candle[], upTo: number) => void;
  appendCandle: (candle: Candle) => void;
  setTradeLines: (entry: number | null, sl: number | null, tp: number | null) => void;
  clearTradeLines: () => void;
  clearDrawings: () => void;
  resetView: () => void;
};

type Props = {
  symbol?: string;
  activeTool?: DrawingTool;
  onCrosshairMove?: (data: CandleOhlc | null) => void;
  onContextMenu?: (price: number, clientX: number, clientY: number) => void;
  onLongTool?: () => void;
  onShortTool?: () => void;
};

// ── Price format per symbol ─────────────────────────────────────────────────
function getPriceFormat(symbol: string): { precision: number; minMove: number } {
  const s = symbol.toUpperCase();
  if (s.includes("JPY")) return { precision: 3, minMove: 0.001 };
  if (s === "BTCUSD")    return { precision: 1, minMove: 0.5 };
  if (s === "ETHUSD")    return { precision: 2, minMove: 0.01 };
  if (["US30", "JPN225"].includes(s))                   return { precision: 1, minMove: 0.1 };
  if (["US500", "US100", "UK100", "GER40"].includes(s)) return { precision: 2, minMove: 0.01 };
  if (["XAUUSD"].includes(s))                           return { precision: 2, minMove: 0.01 };
  if (["XAGUSD", "USOIL"].includes(s))                  return { precision: 3, minMove: 0.001 };
  return { precision: 5, minMove: 0.00001 }; // standard forex
}

// ── Drawing state types ─────────────────────────────────────────────────────
type ChartPoint = { price: number; logical: number };

type HLineEntry = {
  id: string;
  price: number;
  priceLine: ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]>;
};

type SegEntry = {
  id: string;
  type: "trendline" | "rectangle" | "fib";
  p1: ChartPoint;
  p2: ChartPoint;
};

const FIB_LEVELS  = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const FIB_COLORS  = ["#ef5350", "#ff9800", "#ffd600", "#26a69a", "#26a69a", "#ff9800", "#ef5350"];

function uid() { return Math.random().toString(36).slice(2, 9); }

export const ReplayChart = forwardRef<ReplayChartHandle, Props>(
  function ReplayChart(
    {
      symbol = "",
      activeTool = "cursor",
      onCrosshairMove,
      onContextMenu,
      onLongTool,
      onShortTool,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef    = useRef<HTMLCanvasElement>(null);
    const chartRef     = useRef<IChartApi | null>(null);
    const seriesRef    = useRef<ISeriesApi<"Candlestick"> | null>(null);

    const tradeLineRefs = useRef<{
      entry: ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null;
      sl:    ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null;
      tp:    ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null;
    }>({ entry: null, sl: null, tp: null });

    // Drawing state (all in refs, no React re-renders needed)
    const hLinesRef  = useRef<HLineEntry[]>([]);
    const segsRef    = useRef<SegEntry[]>([]);
    const pendingRef = useRef<ChartPoint | null>(null);
    const mousePosRef = useRef<ChartPoint | null>(null);

    // Callback refs (avoids stale closures)
    const activeToolRef    = useRef(activeTool);
    const crosshairCbRef   = useRef(onCrosshairMove);
    const ctxMenuCbRef     = useRef(onContextMenu);
    const longCbRef        = useRef(onLongTool);
    const shortCbRef       = useRef(onShortTool);

    useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
    useEffect(() => { crosshairCbRef.current = onCrosshairMove; }, [onCrosshairMove]);
    useEffect(() => { ctxMenuCbRef.current = onContextMenu; }, [onContextMenu]);
    useEffect(() => { longCbRef.current = onLongTool; }, [onLongTool]);
    useEffect(() => { shortCbRef.current = onShortTool; }, [onShortTool]);

    // Cancel pending drawing when tool changes away from 2-click tools
    useEffect(() => {
      if (!["trendline", "rectangle", "fib"].includes(activeTool)) {
        pendingRef.current = null;
        redrawCanvas(); // eslint-disable-line react-hooks/exhaustive-deps
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTool]);

    // ── Canvas redraw (reads from refs → stable with [] deps) ──────────────
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const redrawCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      const chart  = chartRef.current;
      const series = seriesRef.current;
      if (!canvas || !chart || !series) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      function toScreen(p: ChartPoint): { x: number; y: number } | null {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const x = chart!.timeScale().logicalToCoordinate(p.logical as any);
        const y = series!.priceToCoordinate(p.price);
        if (x == null || y == null) return null;
        return { x: Number(x), y: Number(y) };
      }

      // ── Completed drawings ───────────────────────────────────────────────
      for (const seg of segsRef.current) {
        const s1 = toScreen(seg.p1);
        const s2 = toScreen(seg.p2);
        if (!s1 || !s2) continue;

        if (seg.type === "trendline") {
          ctx.strokeStyle = "#818cf8";
          ctx.lineWidth   = 1.5;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.stroke();
          ctx.fillStyle = "#818cf8";
          ctx.beginPath(); ctx.arc(s1.x, s1.y, 3, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(s2.x, s2.y, 3, 0, Math.PI * 2); ctx.fill();

        } else if (seg.type === "rectangle") {
          const x = Math.min(s1.x, s2.x);
          const y = Math.min(s1.y, s2.y);
          const w = Math.abs(s2.x - s1.x);
          const h = Math.abs(s2.y - s1.y);
          ctx.fillStyle   = "rgba(99,102,241,0.07)";
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = "#818cf8";
          ctx.lineWidth   = 1;
          ctx.setLineDash([]);
          ctx.strokeRect(x, y, w, h);

        } else if (seg.type === "fib") {
          const priceRange = seg.p2.price - seg.p1.price;
          FIB_LEVELS.forEach((level, li) => {
            const price = seg.p1.price + priceRange * level;
            const pt1   = toScreen({ price, logical: seg.p1.logical });
            const pt2   = toScreen({ price, logical: seg.p2.logical });
            if (!pt1 || !pt2) return;
            ctx.strokeStyle = FIB_COLORS[li] + "99";
            ctx.lineWidth   = 1;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(Math.min(pt1.x, pt2.x), pt1.y);
            ctx.lineTo(Math.max(pt1.x, pt2.x), pt1.y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = FIB_COLORS[li];
            ctx.font      = "10px 'JetBrains Mono', monospace";
            ctx.fillText(`${(level * 100).toFixed(1)}%  ${price.toFixed(5)}`, Math.min(pt1.x, pt2.x) + 4, pt1.y - 3);
          });
        }
      }

      // ── Live preview (pending first point + mouse) ───────────────────────
      const pending = pendingRef.current;
      const mouse   = mousePosRef.current;
      if (pending) {
        const s1 = toScreen(pending);
        if (s1) {
          // Dot at first click
          ctx.fillStyle = "#818cf8";
          ctx.beginPath(); ctx.arc(s1.x, s1.y, 4, 0, Math.PI * 2); ctx.fill();

          if (mouse) {
            const s2   = toScreen(mouse);
            const tool = activeToolRef.current;
            if (s2) {
              ctx.strokeStyle = "rgba(129,140,248,0.7)";
              ctx.lineWidth   = 1.5;
              ctx.setLineDash([6, 4]);
              if (tool === "trendline") {
                ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke();
              } else if (tool === "rectangle" || tool === "fib") {
                const x = Math.min(s1.x, s2.x);
                const y = Math.min(s1.y, s2.y);
                const w = Math.abs(s2.x - s1.x);
                const h = Math.abs(s2.y - s1.y);
                ctx.strokeRect(x, y, w, h);
              }
              ctx.setLineDash([]);
            }
          }
        }
      }
    }, []); // stable – reads refs

    // ── Chart init ──────────────────────────────────────────────────────────
    useLayoutEffect(() => {
      const el     = containerRef.current;
      const canvas = canvasRef.current;
      if (!el) return;

      const chart = createChart(el, {
        layout: {
          background: { type: ColorType.Solid, color: "#080809" },
          textColor: "#94a3b8",
          fontSize: 12,
          fontFamily: "'JetBrains Mono', monospace",
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.04)", style: LineStyle.Solid },
          horzLines: { color: "rgba(255,255,255,0.04)", style: LineStyle.Solid },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: "rgba(255,255,255,0.3)", width: 1, style: LineStyle.Dashed, labelBackgroundColor: "#1e1e2e" },
          horzLine: { color: "rgba(255,255,255,0.3)", width: 1, style: LineStyle.Dashed, labelBackgroundColor: "#1e1e2e" },
        },
        rightPriceScale: {
          borderColor: "rgba(255,255,255,0.07)",
          textColor: "#94a3b8",
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        leftPriceScale: { visible: false },
        timeScale: {
          borderColor: "rgba(255,255,255,0.07)",
          timeVisible: true,
          secondsVisible: false,
          barSpacing: 8,
          rightOffset: 10,
          minBarSpacing: 2,
        },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
        handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
        width: el.clientWidth,
        height: el.clientHeight,
      });

      const series = chart.addSeries(CandlestickSeries, {
        upColor:       "#26a69a",
        downColor:     "#ef5350",
        borderUpColor: "#26a69a",
        borderDownColor: "#ef5350",
        wickUpColor:   "#26a69a",
        wickDownColor: "#ef5350",
        borderVisible: true,
      });

      chartRef.current  = chart;
      seriesRef.current = series;

      // Watermark
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createTextWatermark } = require("lightweight-charts") as {
          createTextWatermark: (pane: unknown, opts: unknown) => void;
        };
        const pane = chart.panes()[0];
        if (pane) {
          createTextWatermark(pane, {
            horzAlign: "center",
            vertAlign: "center",
            lines: [{ text: "", color: "rgba(255,255,255,0.03)", fontSize: 60, fontStyle: "bold", fontFamily: "Outfit, sans-serif" }],
          });
        }
      } catch { /* older API */ }

      // ── Crosshair + mouse tracking for drawing preview ──────────────────
      chart.subscribeCrosshairMove((param) => {
        // Update mouse pos for live drawing preview
        if (param.point && seriesRef.current) {
          const price   = seriesRef.current.coordinateToPrice(param.point.y);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const logical = chart.timeScale().coordinateToLogical(param.point.x as any);
          if (price != null && logical != null) {
            mousePosRef.current = { price, logical: Number(logical) };
            if (pendingRef.current) redrawCanvas();
          }
        }

        const cb = crosshairCbRef.current;
        if (!cb || !seriesRef.current) return;
        if (!param.time) { cb(null); return; }
        const raw = param.seriesData.get(seriesRef.current);
        if (raw && typeof (raw as { open?: unknown }).open === "number") {
          const bar = raw as { open: number; high: number; low: number; close: number };
          cb({
            time: typeof param.time === "number" ? param.time : 0,
            open: bar.open, high: bar.high, low: bar.low, close: bar.close,
          });
        } else { cb(null); }
      });

      // ── Click handler for drawing tools ─────────────────────────────────
      chart.subscribeClick((param) => {
        const tool = activeToolRef.current;
        const s    = seriesRef.current;
        if (!param.point || !s) return;
        if (tool === "cursor" || tool === "magnet") return;

        const price   = s.coordinateToPrice(param.point.y);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const logical = chart.timeScale().coordinateToLogical(param.point.x as any);
        if (price == null || logical == null) return;
        const pt: ChartPoint = { price, logical: Number(logical) };

        if (tool === "hline") {
          const priceLine = s.createPriceLine({
            price,
            color: "#818cf8",
            lineWidth: 1,
            lineStyle: LineStyle.Solid,
            title: "",
            axisLabelVisible: true,
          });
          hLinesRef.current.push({ id: uid(), price, priceLine });

        } else if (tool === "trendline" || tool === "rectangle" || tool === "fib") {
          if (!pendingRef.current) {
            pendingRef.current = pt;
            redrawCanvas();
          } else {
            segsRef.current.push({ id: uid(), type: tool, p1: pendingRef.current, p2: pt });
            pendingRef.current = null;
            redrawCanvas();
          }

        } else if (tool === "eraser") {
          const clickY = param.point.y;
          const clickX = param.point.x;

          // Remove nearest hline (by pixel distance)
          let minDist = 14; // px threshold
          let minIdx  = -1;
          hLinesRef.current.forEach((hl, i) => {
            const coord = s.priceToCoordinate(hl.price);
            if (coord == null) return;
            const dist = Math.abs(Number(coord) - clickY);
            if (dist < minDist) { minDist = dist; minIdx = i; }
          });
          if (minIdx >= 0) {
            const removed = hLinesRef.current.splice(minIdx, 1)[0];
            try { s.removePriceLine(removed.priceLine); } catch { /* */ }
          }

          // Remove nearest segment (by proximity to either endpoint)
          segsRef.current = segsRef.current.filter((seg) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const x1 = chart.timeScale().logicalToCoordinate(seg.p1.logical as any);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const x2 = chart.timeScale().logicalToCoordinate(seg.p2.logical as any);
            const y1 = s.priceToCoordinate(seg.p1.price);
            const y2 = s.priceToCoordinate(seg.p2.price);
            if (x1 == null || x2 == null || y1 == null || y2 == null) return true;
            const d1 = Math.hypot(Number(x1) - clickX, Number(y1) - clickY);
            const d2 = Math.hypot(Number(x2) - clickX, Number(y2) - clickY);
            return d1 > 14 && d2 > 14;
          });
          redrawCanvas();

        } else if (tool === "long") {
          longCbRef.current?.();
        } else if (tool === "short") {
          shortCbRef.current?.();
        }
      });

      // ── Context menu ────────────────────────────────────────────────────
      el.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const s = seriesRef.current;
        if (!s) return;
        const rect  = el.getBoundingClientRect();
        const price = s.coordinateToPrice(e.clientY - rect.top);
        if (price != null) {
          ctxMenuCbRef.current?.(price, e.clientX, e.clientY);
        }
      });

      // ── Redraw canvas on chart scroll/zoom ──────────────────────────────
      chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
        redrawCanvas();
      });

      // ── ResizeObserver ──────────────────────────────────────────────────
      const ro = new ResizeObserver(() => {
        if (!el || !chartRef.current) return;
        chartRef.current.applyOptions({ width: el.clientWidth, height: el.clientHeight });
        if (canvas) {
          canvas.width  = el.clientWidth;
          canvas.height = el.clientHeight;
          redrawCanvas();
        }
      });
      ro.observe(el);

      if (canvas) {
        canvas.width  = el.clientWidth;
        canvas.height = el.clientHeight;
      }

      return () => {
        ro.disconnect();
        chart.remove();
        chartRef.current  = null;
        seriesRef.current = null;
        tradeLineRefs.current = { entry: null, sl: null, tp: null };
        hLinesRef.current  = [];
        segsRef.current    = [];
        pendingRef.current = null;
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Price format when symbol changes ────────────────────────────────────
    useEffect(() => {
      const s = seriesRef.current;
      if (!s || !symbol) return;
      const fmt = getPriceFormat(symbol);
      s.applyOptions({ priceFormat: { type: "price", precision: fmt.precision, minMove: fmt.minMove } });
    }, [symbol]);

    // ── Imperative handle ──────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      setCandles(candles: Candle[], upTo: number) {
        const s = seriesRef.current;
        if (!s) return;
        const slice = candles.slice(0, upTo + 1).map((c) => ({
          time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close,
        }));
        s.setData(slice);
        chartRef.current?.timeScale().scrollToRealTime();
      },

      appendCandle(candle: Candle) {
        const s = seriesRef.current;
        if (!s) return;
        s.update({ time: candle.time as UTCTimestamp, open: candle.open, high: candle.high, low: candle.low, close: candle.close });
      },

      setTradeLines(entry: number | null, sl: number | null, tp: number | null) {
        const s = seriesRef.current;
        if (!s) return;
        const refs = tradeLineRefs.current;
        if (refs.entry) { try { s.removePriceLine(refs.entry); } catch { /* */ } refs.entry = null; }
        if (entry != null) { refs.entry = s.createPriceLine({ price: entry, color: "#ff8c00", lineWidth: 1, lineStyle: LineStyle.Dashed, title: "Entry", axisLabelVisible: true }); }
        if (refs.sl)    { try { s.removePriceLine(refs.sl); }    catch { /* */ } refs.sl = null; }
        if (sl != null) { refs.sl = s.createPriceLine({ price: sl, color: "#ef5350", lineWidth: 1, lineStyle: LineStyle.Dashed, title: "SL", axisLabelVisible: true }); }
        if (refs.tp)    { try { s.removePriceLine(refs.tp); }    catch { /* */ } refs.tp = null; }
        if (tp != null) { refs.tp = s.createPriceLine({ price: tp, color: "#26a69a", lineWidth: 1, lineStyle: LineStyle.Dashed, title: "TP", axisLabelVisible: true }); }
      },

      clearTradeLines() {
        const s = seriesRef.current;
        if (!s) return;
        const refs = tradeLineRefs.current;
        for (const key of ["entry", "sl", "tp"] as const) {
          if (refs[key]) { try { s.removePriceLine(refs[key]!); } catch { /* */ } refs[key] = null; }
        }
      },

      clearDrawings() {
        const s = seriesRef.current;
        if (s) {
          for (const hl of hLinesRef.current) {
            try { s.removePriceLine(hl.priceLine); } catch { /* */ }
          }
        }
        hLinesRef.current  = [];
        segsRef.current    = [];
        pendingRef.current = null;
        redrawCanvas();
      },

      resetView() {
        chartRef.current?.timeScale().fitContent();
      },
    }));

    return (
      <div className="relative h-full w-full">
        <div ref={containerRef} className="h-full w-full" />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 z-10"
        />
      </div>
    );
  },
);
