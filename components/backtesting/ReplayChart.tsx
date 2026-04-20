"use client";

import { useEffect, useLayoutEffect, useRef, useImperativeHandle, forwardRef } from "react";
import {
  CandlestickSeries,
  LineSeries,
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

export type DrawingTool = "cursor" | "hline" | "trendline" | "eraser";

export type IndicatorData = {
  sma20?: Array<{ time: number; value: number }>;
  sma50?: Array<{ time: number; value: number }>;
  sma200?: Array<{ time: number; value: number }>;
  ema20?: Array<{ time: number; value: number }>;
  ema50?: Array<{ time: number; value: number }>;
};

export type ReplayChartHandle = {
  addHLine: (price: number, color?: string, title?: string) => void;
  clearHLines: () => void;
  scrollToIndex: (index: number, candles: Candle[]) => void;
  addTrendLine: (
    p1: { price: number; time: number },
    p2: { price: number; time: number },
    color?: string
  ) => void;
  clearUserDrawings: () => void;
};

type Props = {
  candles: Candle[];
  currentIndex: number;
  entryPrice?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  tool?: DrawingTool;
  onChartClick?: (price: number, time: number) => void;
  indicators?: IndicatorData;
};

const INDICATOR_COLORS: Record<keyof IndicatorData, string> = {
  sma20: "#f59e0b",
  sma50: "#3b82f6",
  sma200: "#ef4444",
  ema20: "#a855f7",
  ema50: "#10b981"
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
    onChartClick,
    indicators = {}
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const tradeLinesRef = useRef<ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]>[]>([]);
  const userHLinesRef = useRef<ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]>[]>([]);
  const userTrendLinesRef = useRef<ISeriesApi<"Line">[]>([]);
  const indicatorSeriesRef = useRef<Partial<Record<keyof IndicatorData, ISeriesApi<"Line">>>>({});
  const prevIndexRef = useRef(-1);
  const prevCandlesLenRef = useRef(0);
  // Keep a stable reference to candles for use in imperative handle
  const candlesRef = useRef<Candle[]>([]);
  const currentIndexRef = useRef(0);

  useEffect(() => { candlesRef.current = candles; }, [candles]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

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
      userHLinesRef.current.push(line);
    },
    clearHLines() {
      const s = seriesRef.current;
      if (!s) return;
      for (const l of userHLinesRef.current) s.removePriceLine(l);
      userHLinesRef.current = [];
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
    },
    addTrendLine(p1, p2, color = "#f59e0b") {
      const chart = chartRef.current;
      const cs = candlesRef.current;
      const idx = currentIndexRef.current;
      if (!chart || cs.length === 0) return;

      const slope =
        p1.time !== p2.time ? (p2.price - p1.price) / (p2.time - p1.time) : 0;

      // Extend line across all candles up to currentIndex
      const lineData = cs
        .slice(0, idx + 1)
        .filter(c => Number.isFinite(c.time) && Number.isFinite(c.open))
        .map(c => ({
          time: c.time as UTCTimestamp,
          value: p1.price + slope * (c.time - p1.time)
        }));

      if (lineData.length < 2) return;

      const trendSeries = chart.addSeries(LineSeries, {
        color,
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false
      });
      trendSeries.setData(lineData);
      userTrendLinesRef.current.push(trendSeries);
    },
    clearUserDrawings() {
      const chart = chartRef.current;
      const s = seriesRef.current;
      if (s) {
        for (const l of userHLinesRef.current) {
          try { s.removePriceLine(l); } catch { /* ignore */ }
        }
        userHLinesRef.current = [];
      }
      if (chart) {
        for (const ts of userTrendLinesRef.current) {
          try { chart.removeSeries(ts); } catch { /* ignore */ }
        }
        userTrendLinesRef.current = [];
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
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: false
        },
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
      indicatorSeriesRef.current = {};
      userTrendLinesRef.current = [];
      userHLinesRef.current = [];
    };
  }, []);

  // ── Cursor style ─────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (tool === "cursor") el.style.cursor = "default";
    else if (tool === "eraser") el.style.cursor = "cell";
    else el.style.cursor = "crosshair";
  }, [tool]);

  // ── Click handler ────────────────────────────────────────────────
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
        userHLinesRef.current.push(line);
      }

      onChartClick?.(price, param.time);
    };

    chart.subscribeClick(handler);
    return () => { chart.unsubscribeClick(handler); };
  }, [tool, onChartClick]);

  // ── Candlestick data update ──────────────────────────────────────
  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart || candles.length === 0) return;

    const isNewDataset = candles.length !== prevCandlesLenRef.current;
    const prevIdx = prevIndexRef.current;
    const isIncrementalForward = !isNewDataset && currentIndex === prevIdx + 1;

    prevCandlesLenRef.current = candles.length;
    prevIndexRef.current = currentIndex;

    const visible = candles.slice(0, currentIndex + 1);

    if (isNewDataset || currentIndex < prevIdx) {
      const data: CandlestickData[] = visible
        .filter(c => Number.isFinite(c.time) && Number.isFinite(c.open))
        .map(c => toBarData(c));
      series.setData(data);

      const fromCandle = candles[Math.max(0, currentIndex - 100)];
      const toCandle = candles[currentIndex];
      if (fromCandle && toCandle) {
        chart.timeScale().setVisibleRange({
          from: fromCandle.time as UTCTimestamp,
          to: toCandle.time as UTCTimestamp
        });
      }
    } else if (isIncrementalForward) {
      const curr = candles[currentIndex];
      if (curr) {
        series.update(toBarData(curr));
      }
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
      const data: CandlestickData[] = visible
        .filter(c => Number.isFinite(c.time) && Number.isFinite(c.open))
        .map(c => toBarData(c));
      series.setData(data);
    }
  }, [candles, currentIndex]);

  // ── Indicator series ─────────────────────────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const keys = Object.keys(INDICATOR_COLORS) as (keyof IndicatorData)[];

    for (const key of keys) {
      const data = indicators[key];
      const existing = indicatorSeriesRef.current[key];

      if (!data || data.length === 0) {
        if (existing) {
          try { chart.removeSeries(existing); } catch { /* ignore */ }
          delete indicatorSeriesRef.current[key];
        }
        continue;
      }

      const lineData = data
        .filter(p => Number.isFinite(p.time) && Number.isFinite(p.value))
        .map(p => ({ time: p.time as UTCTimestamp, value: p.value }));

      if (existing) {
        existing.setData(lineData);
      } else {
        const s = chart.addSeries(LineSeries, {
          color: INDICATOR_COLORS[key],
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
          priceLineVisible: false,
          lastValueVisible: true,
          crosshairMarkerVisible: false
        });
        s.setData(lineData);
        indicatorSeriesRef.current[key] = s;
      }
    }
  }, [indicators]);

  // ── Trade price lines ────────────────────────────────────────────
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    for (const l of tradeLinesRef.current) series.removePriceLine(l);
    tradeLinesRef.current = [];

    if (entryPrice != null && Number.isFinite(entryPrice)) {
      tradeLinesRef.current.push(
        series.createPriceLine({
          price: entryPrice,
          color: "#f59e0b",
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          title: "Entry",
          axisLabelVisible: true
        } as PriceLineOptions)
      );
    }
    if (stopLoss != null && Number.isFinite(stopLoss)) {
      tradeLinesRef.current.push(
        series.createPriceLine({
          price: stopLoss,
          color: "#ef5350",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          title: "SL",
          axisLabelVisible: true
        } as PriceLineOptions)
      );
    }
    if (takeProfit != null && Number.isFinite(takeProfit)) {
      tradeLinesRef.current.push(
        series.createPriceLine({
          price: takeProfit,
          color: "#26a69a",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          title: "TP",
          axisLabelVisible: true
        } as PriceLineOptions)
      );
    }
  }, [entryPrice, stopLoss, takeProfit]);

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0 }}
    />
  );
});
