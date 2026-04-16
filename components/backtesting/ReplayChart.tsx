"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type UTCTimestamp
} from "lightweight-charts";
import type { Candle } from "@/lib/backtesting/btTypes";

type Props = {
  candles: Candle[];
  currentIndex: number;
  entryPrice?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  accentEntry?: string;
  accentSl?: string;
  accentTp?: string;
  /** When true, chart auto-scrolls to keep current candle visible (default: true). */
  autoFollow?: boolean;
};

export function ReplayChart({
  candles,
  currentIndex,
  entryPrice,
  stopLoss,
  takeProfit,
  accentEntry = "#ff8c00",
  accentSl = "#ff3c3c",
  accentTp = "#00e676",
  autoFollow = true
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const linesRef = useRef<ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]>[]>([]);
  const prevCandlesLen = useRef(0);

  useLayoutEffect(() => {
    let chart: IChartApi | null = null;
    let ro: ResizeObserver | null = null;
    let raf: number;

    const init = () => {
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const w = Math.max(rect.width, 300);
      const h = Math.max(rect.height, 300);

      chart = createChart(el, {
        width: w,
        height: h,
        layout: {
          background: { type: ColorType.Solid, color: "#07070f" },
          textColor: "#64748b"
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.03)" },
          horzLines: { color: "rgba(255,255,255,0.03)" }
        },
        crosshair: {
          mode: 1,
          vertLine: { color: "rgba(255,255,255,0.2)", labelBackgroundColor: "#1e1e2e" },
          horzLine: { color: "rgba(255,255,255,0.2)", labelBackgroundColor: "#1e1e2e" }
        },
        rightPriceScale: {
          borderColor: "rgba(255,255,255,0.05)",
          scaleMargins: { top: 0.08, bottom: 0.08 },
          textColor: "#64748b"
        },
        timeScale: {
          borderColor: "rgba(255,255,255,0.05)",
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 12,
          barSpacing: 8,
          minBarSpacing: 2,
          fixLeftEdge: false,
          fixRightEdge: false
        },
        handleScroll: true,
        handleScale: true
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
      prevCandlesLen.current = 0;

      ro = new ResizeObserver(() => {
        const container = containerRef.current;
        const c = chartRef.current;
        if (!container || !c) return;
        const r = container.getBoundingClientRect();
        c.applyOptions({
          width: Math.max(r.width, 300),
          height: Math.max(r.height, 300)
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
      prevCandlesLen.current = 0;
    };
  }, []);

  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart) return;
    if (candles.length === 0) return;

    const isFirstLoad = prevCandlesLen.current === 0;
    prevCandlesLen.current = candles.length;

    const data: CandlestickData[] = candles
      .filter(
        (c) =>
          Number.isFinite(c.time) &&
          Number.isFinite(c.open) &&
          Number.isFinite(c.high) &&
          Number.isFinite(c.low) &&
          Number.isFinite(c.close)
      )
      .map((c, i) => {
        const isFuture = i > currentIndex;
        const isCurrent = i === currentIndex;
        const isBull = c.close >= c.open;

        if (isFuture) {
          return {
            time: c.time as UTCTimestamp,
            open: c.close,
            high: c.close,
            low: c.close,
            close: c.close,
            color: "rgba(255,255,255,0.04)",
            wickColor: "rgba(255,255,255,0.04)",
            borderColor: "transparent"
          };
        }

        return {
          time: c.time as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          color: isCurrent ? "#f59e0b" : isBull ? "#26a69a" : "#ef5350",
          wickColor: isCurrent ? "#f59e0b" : isBull ? "#26a69a" : "#ef5350",
          borderColor: "transparent"
        };
      });

    series.setData(data);

    const currentCandle = candles[currentIndex];

    if (isFirstLoad) {
      // First load: center on current candle with context
      const visibleFrom = Math.max(0, currentIndex - 80);
      const visibleTo = Math.min(candles.length - 1, currentIndex + 20);
      if (candles[visibleFrom] && candles[visibleTo]) {
        chart.timeScale().setVisibleRange({
          from: candles[visibleFrom].time as UTCTimestamp,
          to: candles[visibleTo].time as UTCTimestamp
        });
      }
    } else if (autoFollow && currentCandle) {
      // Only scroll if current candle is outside the visible range
      try {
        const visibleRange = chart.timeScale().getVisibleRange();
        if (visibleRange) {
          const isOutOfView =
            currentCandle.time > (visibleRange.to as number) ||
            currentCandle.time < (visibleRange.from as number);

          if (isOutOfView) {
            const visibleFrom = Math.max(0, currentIndex - 80);
            const visibleTo = Math.min(candles.length - 1, currentIndex + 20);
            if (candles[visibleFrom] && candles[visibleTo]) {
              chart.timeScale().setVisibleRange({
                from: candles[visibleFrom].time as UTCTimestamp,
                to: candles[visibleTo].time as UTCTimestamp
              });
            }
          }
        }
      } catch {
        /* getVisibleRange may fail if chart not yet ready */
      }
    }
  }, [candles, currentIndex, autoFollow]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    for (const l of linesRef.current) {
      series.removePriceLine(l);
    }
    linesRef.current = [];

    if (entryPrice != null && Number.isFinite(entryPrice)) {
      linesRef.current.push(
        series.createPriceLine({
          price: entryPrice,
          color: accentEntry,
          lineWidth: 1,
          lineStyle: 0,
          title: "Entry"
        })
      );
    }
    if (stopLoss != null && Number.isFinite(stopLoss)) {
      linesRef.current.push(
        series.createPriceLine({
          price: stopLoss,
          color: accentSl,
          lineWidth: 1,
          lineStyle: 2,
          title: "SL"
        })
      );
    }
    if (takeProfit != null && Number.isFinite(takeProfit)) {
      linesRef.current.push(
        series.createPriceLine({
          price: takeProfit,
          color: accentTp,
          lineWidth: 1,
          lineStyle: 2,
          title: "TP"
        })
      );
    }
  }, [entryPrice, stopLoss, takeProfit, accentEntry, accentSl, accentTp]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
