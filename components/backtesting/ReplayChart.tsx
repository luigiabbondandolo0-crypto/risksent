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
};

export function ReplayChart({
  candles,
  currentIndex,
  entryPrice,
  stopLoss,
  takeProfit,
  accentEntry = "#ff8c00",
  accentSl = "#ff3c3c",
  accentTp = "#00e676"
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
      const h = Math.max(rect.height, 400);

      chart = createChart(el, {
        width: w,
        height: h,
        layout: {
          background: { type: ColorType.Solid, color: "#080809" },
          textColor: "#94a3b8"
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.04)" },
          horzLines: { color: "rgba(255,255,255,0.04)" }
        },
        crosshair: { mode: 1 },
        rightPriceScale: {
          borderColor: "rgba(255,255,255,0.07)",
          scaleMargins: { top: 0.1, bottom: 0.1 }
        },
        timeScale: {
          borderColor: "rgba(255,255,255,0.07)",
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 10,
          barSpacing: 6,
          minBarSpacing: 2
        },
        handleScroll: true,
        handleScale: true
      });

      const series = chart.addSeries(CandlestickSeries, {
        upColor: "#00e676",
        downColor: "#ff3c3c",
        borderVisible: false,
        wickUpColor: "#00e676",
        wickDownColor: "#ff3c3c"
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
          height: Math.max(r.height, 400)
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

    // Tutte le candele — passate visibili, future grigie
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
            color: "rgba(255,255,255,0.06)",
            wickColor: "rgba(255,255,255,0.06)",
            borderColor: "transparent"
          };
        }

        return {
          time: c.time as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          color: isCurrent ? "#ff8c00" : isBull ? "#00e676" : "#ff3c3c",
          wickColor: isCurrent ? "#ff8c00" : isBull ? "#00e676" : "#ff3c3c",
          borderColor: "transparent"
        };
      });

    series.setData(data);

    if (isFirstLoad) {
      // Prima volta: vai alla candela corrente con 80 candele di contesto a sinistra
      const visibleFrom = Math.max(0, currentIndex - 80);
      const visibleTo = Math.min(candles.length - 1, currentIndex + 20);
      if (candles[visibleFrom] && candles[visibleTo]) {
        chart.timeScale().setVisibleRange({
          from: candles[visibleFrom].time as UTCTimestamp,
          to: candles[visibleTo].time as UTCTimestamp
        });
      }
    } else {
      // Ad ogni step: mantieni la candela corrente visibile con contesto
      const visibleFrom = Math.max(0, currentIndex - 80);
      const visibleTo = Math.min(candles.length - 1, currentIndex + 20);
      if (candles[visibleFrom] && candles[visibleTo]) {
        chart.timeScale().setVisibleRange({
          from: candles[visibleFrom].time as UTCTimestamp,
          to: candles[visibleTo].time as UTCTimestamp
        });
      }
    }
  }, [candles, currentIndex]);

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
          lineWidth: 2,
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
      style={{ width: "100%", height: "100%", minHeight: "400px" }}
      className="rounded-xl border border-white/[0.06]"
    />
  );
}