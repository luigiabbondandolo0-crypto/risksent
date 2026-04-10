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

// Quante candele mostrare nel viewport
const VISIBLE_CANDLES = 80;

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
  const initialFitDone = useRef(false);

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
          rightOffset: 5,
          barSpacing: 8
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
      initialFitDone.current = false;

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
      initialFitDone.current = false;
    };
  }, []);

  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart) return;
    if (candles.length === 0) return;

    // Solo le candele fino a currentIndex
    const slice = candles
      .slice(0, currentIndex + 1)
      .filter(
        (c) =>
          Number.isFinite(c.time) &&
          Number.isFinite(c.open) &&
          Number.isFinite(c.high) &&
          Number.isFinite(c.low) &&
          Number.isFinite(c.close)
      );

    const data: CandlestickData[] = slice.map((c, i) => {
      const isCurrent = i === slice.length - 1;
      const isBull = c.close >= c.open;
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

    // Prima volta: fit completo
    if (!initialFitDone.current && data.length > 0) {
      chart.timeScale().fitContent();
      initialFitDone.current = true;
      return;
    }

    // Poi: scrolla solo per tenere la candela corrente visibile a destra
    if (data.length > 0) {
      const lastTime = data[data.length - 1].time;
      chart.timeScale().scrollToRealTime();
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