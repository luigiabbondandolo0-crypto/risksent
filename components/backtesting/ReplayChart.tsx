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
  LineSeries,
  ColorType,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/lib/backtesting/types";

export type ReplayChartHandle = {
  /** Replace visible dataset (reset or seek). */
  setCandles: (candles: Candle[], upTo: number) => void;
  /** Append one candle incrementally (fastest path). */
  appendCandle: (candle: Candle) => void;
  /** Set / update the three trade price lines. Pass null to remove. */
  setTradeLines: (entry: number | null, sl: number | null, tp: number | null) => void;
  /** Clear all trade lines. */
  clearTradeLines: () => void;
};

type Props = {
  /** Symbol name used for watermark only. */
  symbol?: string;
};

export const ReplayChart = forwardRef<ReplayChartHandle, Props>(
  function ReplayChart({ symbol = "" }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const tradeLineRefs = useRef<{
      entry: ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null;
      sl: ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null;
      tp: ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null;
    }>({ entry: null, sl: null, tp: null });

    // ── Chart init ──────────────────────────────────────────────────────────
    useLayoutEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const chart = createChart(el, {
        layout: {
          background: { type: ColorType.Solid, color: "#080809" },
          textColor: "#64748b",
          fontFamily: "'JetBrains Mono', monospace",
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.04)" },
          horzLines: { color: "rgba(255,255,255,0.04)" },
        },
        crosshair: { mode: 1 },
        rightPriceScale: {
          borderColor: "rgba(255,255,255,0.06)",
          textColor: "#64748b",
          scaleMargins: { top: 0.08, bottom: 0.08 },
        },
        leftPriceScale: { visible: false },
        timeScale: {
          borderColor: "rgba(255,255,255,0.06)",
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 8,
          barSpacing: 9,
          minBarSpacing: 2,
        },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
        handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
        width: el.clientWidth,
        height: el.clientHeight,
      });

      const series = chart.addSeries(CandlestickSeries, {
        upColor: "#00e676",
        downColor: "#ff3c3c",
        borderVisible: false,
        wickUpColor: "#00e676",
        wickDownColor: "#ff3c3c",
      });

      chartRef.current = chart;
      seriesRef.current = series;

      // Watermark via createTextWatermark (v5)
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
            lines: [{ text: symbol, color: "rgba(255,255,255,0.04)", fontSize: 56, fontStyle: "bold", fontFamily: "Outfit, sans-serif" }],
          });
        }
      } catch { /* older API */ }

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

        // Entry line
        if (refs.entry) { try { s.removePriceLine(refs.entry); } catch { /* */ } refs.entry = null; }
        if (entry != null) {
          refs.entry = s.createPriceLine({ price: entry, color: "#ff8c00", lineWidth: 1, lineStyle: LineStyle.Dashed, title: "Entry", axisLabelVisible: true });
        }
        // SL line
        if (refs.sl) { try { s.removePriceLine(refs.sl); } catch { /* */ } refs.sl = null; }
        if (sl != null) {
          refs.sl = s.createPriceLine({ price: sl, color: "#ff3c3c", lineWidth: 1, lineStyle: LineStyle.Dashed, title: "SL", axisLabelVisible: true });
        }
        // TP line
        if (refs.tp) { try { s.removePriceLine(refs.tp); } catch { /* */ } refs.tp = null; }
        if (tp != null) {
          refs.tp = s.createPriceLine({ price: tp, color: "#00e676", lineWidth: 1, lineStyle: LineStyle.Dashed, title: "TP", axisLabelVisible: true });
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
