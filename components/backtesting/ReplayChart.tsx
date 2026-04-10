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
  entryPrice?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  accentEntry?: string;
  accentSl?: string;
  accentTp?: string;
};

export function ReplayChart({
  candles,
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

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let chart: IChartApi | null = null;
    let ro: ResizeObserver | null = null;

    const init = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const w = Math.max(rect.width, 200);
      const h = Math.max(rect.height, 320);

      chart = createChart(containerRef.current, {
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
        rightPriceScale: { borderColor: "rgba(255,255,255,0.07)" },
        timeScale: {
          borderColor: "rgba(255,255,255,0.07)",
          timeVisible: true,
          secondsVisible: false
        }
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

      ro = new ResizeObserver(() => {
        if (!containerRef.current || !chartRef.current) return;
        const { width, height } = containerRef.current.getBoundingClientRect();
        chartRef.current.applyOptions({
          width: Math.max(width, 200),
          height: Math.max(height, 320)
        });
      });
      ro.observe(containerRef.current);
    };

    const raf = requestAnimationFrame(init);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      chart?.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    const data: CandlestickData[] = candles
      .filter(
        (c) =>
          Number.isFinite(c.time) &&
          Number.isFinite(c.open) &&
          Number.isFinite(c.high) &&
          Number.isFinite(c.low) &&
          Number.isFinite(c.close)
      )
      .map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close
      }));

    series.setData(data);
    if (data.length > 0) {
      chartRef.current?.timeScale().fitContent();
    }
  }, [candles]);

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
      className="h-full min-h-[320px] w-full rounded-xl border border-white/[0.06]"
    />
  );
}