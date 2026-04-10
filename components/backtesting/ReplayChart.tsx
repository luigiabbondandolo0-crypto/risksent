"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const w = Math.max(el.clientWidth || el.offsetWidth, 200);
    const h = Math.max(el.clientHeight || el.offsetHeight, 280);

    const chart = createChart(el, {
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
      timeScale: { borderColor: "rgba(255,255,255,0.07)", timeVisible: true, secondsVisible: false }
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

    const ro = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      chart.applyOptions({ width, height });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    const data: CandlestickData[] = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
    }));
    series.setData(data);
    chartRef.current?.timeScale().fitContent();
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
  }, [entryPrice, stopLoss, takeProfit, accentEntry, accentSl, accentTp, candles]);

  return <div ref={containerRef} className="h-full min-h-[320px] w-full rounded-xl border border-white/[0.06]" />;
}
