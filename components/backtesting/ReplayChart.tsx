"use client";

import { useEffect, useLayoutEffect, useRef, useImperativeHandle, forwardRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type UTCTimestamp,
  type PriceLineOptions,
  type MouseEventParams,
  type Time
} from "lightweight-charts";
import type { Candle } from "@/lib/backtesting/btTypes";

export type DrawingTool = "cursor" | "hline";

export type ReplayChartHandle = {
  addHLine: (price: number, color?: string, title?: string) => void;
  clearHLines: () => void;
  scrollToIndex: (index: number, candles: Candle[]) => void;
};

type Props = {
  candles: Candle[];
  currentIndex: number;
  entryPrice?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  tool?: DrawingTool;
  onChartClick?: (price: number, time: number) => void;
};

function toBarData(c: Candle): CandlestickData {
  const isBull = c.close >= c.open;
  return {
    time: c.time as UTCTimestamp,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    color: isBull ? "#26a69a" : "#ef5350",
    wickColor: isBull ? "#26a69a" : "#ef5350",
    borderColor: "transparent"
  };
}

export const ReplayChart = forwardRef<ReplayChartHandle, Props>(function ReplayChart(
  {
    candles,
    currentIndex,
    entryPrice,
    stopLoss,
    takeProfit,
    tool = "cursor",
    onChartClick
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const tradeLinesRef = useRef<ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]>[]>([]);
  const userLinesRef = useRef<ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]>[]>([]);
  const prevIndexRef = useRef(-1);
  const prevCandlesLenRef = useRef(0);

  useImperativeHandle(ref, () => ({
    addHLine(price, color = "#f59e0b", title = "") {
      const s = seriesRef.current;
      if (!s) return;
      const line = s.createPriceLine({
        price,
        color,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        title,
        axisLabelVisible: true
      } as PriceLineOptions);
      userLinesRef.current.push(line);
    },
    clearHLines() {
      const s = seriesRef.current;
      if (!s) return;
      for (const l of userLinesRef.current) s.removePriceLine(l);
      userLinesRef.current = [];
    },
    scrollToIndex(index, cs) {
      const chart = chartRef.current;
      if (!chart || cs.length === 0) return;
      const from = Math.max(0, index - 100);
      const to = Math.min(cs.length - 1, index + 30);
      if (cs[from] && cs[to]) {
        chart.timeScale().setVisibleRange({
          from: cs[from].time as UTCTimestamp,
          to: cs[to].time as UTCTimestamp
        });
      }
    }
  }));

  // ── Chart init ───────────────────────────────────────────────────
  useLayoutEffect(() => {
    let chart: IChartApi | null = null;
    let ro: ResizeObserver | null = null;
    let raf: number;

    const init = () => {
      const el = containerRef.current;
      if (!el) return;

      const w = Math.max(el.offsetWidth || el.getBoundingClientRect().width, 300);
      const h = Math.max(el.offsetHeight || el.getBoundingClientRect().height, 400);

      chart = createChart(el, {
        width: w,
        height: h,
        layout: {
          background: { type: ColorType.Solid, color: "#131722" },
          textColor: "#d1d4dc",
          fontFamily: "'JetBrains Mono', monospace"
        },
        grid: {
          vertLines: { color: "rgba(42,46,57,0.8)", style: LineStyle.Solid },
          horzLines: { color: "rgba(42,46,57,0.8)", style: LineStyle.Solid }
        },
        crosshair: {
          mode: 1,
          vertLine: {
            color: "rgba(224,227,235,0.4)",
            width: 1,
            style: LineStyle.Solid,
            labelBackgroundColor: "#2a2e39"
          },
          horzLine: {
            color: "rgba(224,227,235,0.4)",
            width: 1,
            style: LineStyle.Dashed,
            labelBackgroundColor: "#2a2e39"
          }
        },
        rightPriceScale: {
          borderColor: "rgba(42,46,57,1)",
          scaleMargins: { top: 0.1, bottom: 0.1 },
          textColor: "#787b86"
        },
        leftPriceScale: { visible: false },
        timeScale: {
          borderColor: "rgba(42,46,57,1)",
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 12,
          barSpacing: 8,
          minBarSpacing: 2,
          fixLeftEdge: false,
          fixRightEdge: false
        },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
        handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true }
      });

      const series = chart.addSeries(CandlestickSeries, {
        upColor: "#26a69a",
        downColor: "#ef5350",
        borderVisible: false,
        wickUpColor: "#26a69a",
        wickDownColor: "#ef5350"
      });

      chartRef.current = chart;
      seriesRef.current = series;
      prevIndexRef.current = -1;
      prevCandlesLenRef.current = 0;

      ro = new ResizeObserver(() => {
        const container = containerRef.current;
        const c = chartRef.current;
        if (!container || !c) return;
        c.applyOptions({
          width: Math.max(container.offsetWidth, 300),
          height: Math.max(container.offsetHeight, 400)
        });
      });
      ro.observe(el);
    };

    raf = requestAnimationFrame(init);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      chart?.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // ── Click handler for drawing tools ─────────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const handler = (param: MouseEventParams<Time>) => {
      if (!param.point || param.time === undefined) return;
      if (typeof param.time !== "number") return;
      const series = seriesRef.current;
      if (!series) return;

      const price = series.coordinateToPrice(param.point.y);
      if (price == null) return;

      if (tool === "hline") {
        const line = series.createPriceLine({
          price,
          color: "#f59e0b",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          title: "",
          axisLabelVisible: true,
          lineVisible: true,
          axisLabelColor: "#f59e0b",
          axisLabelTextColor: "#0f172a"
        } satisfies PriceLineOptions);
        userLinesRef.current.push(line);
      }

      onChartClick?.(price, param.time);
    };

    chart.subscribeClick(handler);
    return () => { chart.unsubscribeClick(handler); };
  }, [tool, onChartClick]);

  // ── Data update ──────────────────────────────────────────────────
  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart || candles.length === 0) return;

    const isNewDataset = candles.length !== prevCandlesLenRef.current;
    const prevIdx = prevIndexRef.current;
    const isIncrementalForward = !isNewDataset && currentIndex === prevIdx + 1;

    prevCandlesLenRef.current = candles.length;
    prevIndexRef.current = currentIndex;

    // Slice: only candles up to currentIndex (inclusive)
    const visible = candles.slice(0, currentIndex + 1);

    if (isNewDataset || currentIndex < prevIdx) {
      // Full rebuild (new TF, new candles, or stepped back)
      const data: CandlestickData[] = visible
        .filter(c => Number.isFinite(c.time) && Number.isFinite(c.open))
        .map(c => toBarData(c));
      series.setData(data);

      // Scroll to show ~100 bars of context ending at currentIndex
      const fromCandle = candles[Math.max(0, currentIndex - 100)];
      const toCandle = candles[currentIndex];
      if (fromCandle && toCandle) {
        chart.timeScale().setVisibleRange({
          from: fromCandle.time as UTCTimestamp,
          to: toCandle.time as UTCTimestamp
        });
      }
    } else if (isIncrementalForward) {
      // Fast path: add new candle only (no amber to undo)
      const curr = candles[currentIndex];
      if (curr) {
        series.update(toBarData(curr));
      }
      // Auto-scroll if current candle is beyond visible range
      try {
        const vr = chart.timeScale().getVisibleRange();
        if (vr && curr) {
          const rightEdge = vr.to as number;
          const leftEdge = vr.from as number;
          if (curr.time > rightEdge || curr.time < leftEdge) {
            chart.timeScale().setVisibleRange({
              from: candles[Math.max(0, currentIndex - 100)].time as UTCTimestamp,
              to: curr.time as UTCTimestamp
            });
          }
        }
      } catch { /* noop */ }
    } else {
      // Forward jump (played fast or loaded saved index)
      const data: CandlestickData[] = visible
        .filter(c => Number.isFinite(c.time) && Number.isFinite(c.open))
        .map(c => toBarData(c));
      series.setData(data);
    }
  }, [candles, currentIndex]);

  // ── Trade lines (entry / SL / TP) ────────────────────────────────
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    for (const l of tradeLinesRef.current) series.removePriceLine(l);
    tradeLinesRef.current = [];

    if (entryPrice != null && Number.isFinite(entryPrice)) {
      tradeLinesRef.current.push(series.createPriceLine({
        price: entryPrice,
        color: "#f59e0b",
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        title: "Entry",
        axisLabelVisible: true
      } as PriceLineOptions));
    }
    if (stopLoss != null && Number.isFinite(stopLoss)) {
      tradeLinesRef.current.push(series.createPriceLine({
        price: stopLoss,
        color: "#ef5350",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        title: "SL",
        axisLabelVisible: true
      } as PriceLineOptions));
    }
    if (takeProfit != null && Number.isFinite(takeProfit)) {
      tradeLinesRef.current.push(series.createPriceLine({
        price: takeProfit,
        color: "#26a69a",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        title: "TP",
        axisLabelVisible: true
      } as PriceLineOptions));
    }
  }, [entryPrice, stopLoss, takeProfit]);

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0 }}
    />
  );
});
