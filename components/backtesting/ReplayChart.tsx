"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
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
};

type Props = {
  symbol?: string;
  onCrosshairMove?: (data: CandleOhlc | null) => void;
};

export const ReplayChart = forwardRef<ReplayChartHandle, Props>(
  function ReplayChart({ symbol = "", onCrosshairMove }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const tradeLineRefs = useRef<{
      entry: ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null;
      sl: ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null;
      tp: ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null;
    }>({ entry: null, sl: null, tp: null });

    // Keep crosshair callback in a ref to avoid stale closure in chart init
    const crosshairCbRef = useRef(onCrosshairMove);
    useEffect(() => { crosshairCbRef.current = onCrosshairMove; }, [onCrosshairMove]);

    // ── Chart init ──────────────────────────────────────────────────────────
    useLayoutEffect(() => {
      const el = containerRef.current;
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
          vertLine: {
            color: "rgba(255,255,255,0.3)",
            width: 1,
            style: LineStyle.Dashed,
            labelBackgroundColor: "#1e1e2e",
          },
          horzLine: {
            color: "rgba(255,255,255,0.3)",
            width: 1,
            style: LineStyle.Dashed,
            labelBackgroundColor: "#1e1e2e",
          },
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
        upColor: "#26a69a",
        downColor: "#ef5350",
        borderUpColor: "#26a69a",
        borderDownColor: "#ef5350",
        wickUpColor: "#26a69a",
        wickDownColor: "#ef5350",
        borderVisible: true,
      });

      chartRef.current = chart;
      seriesRef.current = series;

      // Watermark
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createTextWatermark } = require("lightweight-charts") as {
          createTextWatermark: (pane: unknown, opts: unknown) => void;
        };
        const pane = chart.panes()[0];
        if (pane && symbol) {
          createTextWatermark(pane, {
            horzAlign: "center",
            vertAlign: "center",
            lines: [{
              text: symbol,
              color: "rgba(255,255,255,0.03)",
              fontSize: 60,
              fontStyle: "bold",
              fontFamily: "Outfit, sans-serif",
            }],
          });
        }
      } catch { /* older API */ }

      // Crosshair subscription
      chart.subscribeCrosshairMove((param) => {
        const cb = crosshairCbRef.current;
        if (!cb || !seriesRef.current) return;
        if (!param.time) {
          cb(null);
          return;
        }
        const raw = param.seriesData.get(seriesRef.current);
        if (raw && typeof (raw as { open?: unknown }).open === "number") {
          const bar = raw as { open: number; high: number; low: number; close: number };
          cb({
            time: typeof param.time === "number" ? param.time : 0,
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
          });
        } else {
          cb(null);
        }
      });

      // ResizeObserver
      const ro = new ResizeObserver(() => {
        if (!el || !chartRef.current) return;
        chartRef.current.applyOptions({ width: el.clientWidth, height: el.clientHeight });
      });
      ro.observe(el);

      return () => {
        ro.disconnect();
        chart.remove();
        chartRef.current = null;
        seriesRef.current = null;
        tradeLineRefs.current = { entry: null, sl: null, tp: null };
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Imperative handle ──────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      setCandles(candles: Candle[], upTo: number) {
        const s = seriesRef.current;
        if (!s) return;
        const slice = candles.slice(0, upTo + 1).map((c) => ({
          time: c.time as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));
        s.setData(slice);
        chartRef.current?.timeScale().scrollToRealTime();
      },

      appendCandle(candle: Candle) {
        const s = seriesRef.current;
        if (!s) return;
        s.update({
          time: candle.time as UTCTimestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        });
      },

      setTradeLines(entry: number | null, sl: number | null, tp: number | null) {
        const s = seriesRef.current;
        if (!s) return;
        const refs = tradeLineRefs.current;

        if (refs.entry) { try { s.removePriceLine(refs.entry); } catch { /* */ } refs.entry = null; }
        if (entry != null) {
          refs.entry = s.createPriceLine({ price: entry, color: "#ff8c00", lineWidth: 1, lineStyle: LineStyle.Dashed, title: "Entry", axisLabelVisible: true });
        }
        if (refs.sl) { try { s.removePriceLine(refs.sl); } catch { /* */ } refs.sl = null; }
        if (sl != null) {
          refs.sl = s.createPriceLine({ price: sl, color: "#ef5350", lineWidth: 1, lineStyle: LineStyle.Dashed, title: "SL", axisLabelVisible: true });
        }
        if (refs.tp) { try { s.removePriceLine(refs.tp); } catch { /* */ } refs.tp = null; }
        if (tp != null) {
          refs.tp = s.createPriceLine({ price: tp, color: "#26a69a", lineWidth: 1, lineStyle: LineStyle.Dashed, title: "TP", axisLabelVisible: true });
        }
      },

      clearTradeLines() {
        const s = seriesRef.current;
        if (!s) return;
        const refs = tradeLineRefs.current;
        for (const key of ["entry", "sl", "tp"] as const) {
          if (refs[key]) { try { s.removePriceLine(refs[key]!); } catch { /* */ } refs[key] = null; }
        }
      },
    }));

    return <div ref={containerRef} className="h-full w-full" />;
  }
);
