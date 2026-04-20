"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";
import type { BtTimeframe } from "@/lib/backtesting/btTypes";
import { createBacktestingDatafeed } from "@/lib/backtesting/tradingview/datafeed";
import { btTimeframeToTvResolution, secondsPerBarForResolution } from "@/lib/backtesting/tradingview/resolutionMap";
import type { ChartingLibraryWidgetOptions, IChartingLibraryWidget } from "@/types/charting_library";

export type TradingViewChartHandle = {
  /** Scroll the chart so `timestampSec` (Unix seconds, UTC) is in view with replay-style margins. */
  goToDate: (timestampSec: number) => void;
};

type Props = {
  symbol: string;
  timeframe: BtTimeframe;
  sessionDateFrom: string;
  sessionDateTo: string;
  entryPrice?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  /**
   * Bars after this Unix time (seconds) are hidden via the datafeed (replay).
   * `null` = show the full session range returned by the API.
   */
  replayVisibleEndSec: number | null;
};

type WidgetFactory = (options: ChartingLibraryWidgetOptions) => IChartingLibraryWidget;

async function loadChartingLibraryWidget(): Promise<WidgetFactory> {
  try {
    const href =
      typeof window !== "undefined"
        ? new URL("/charting_library/charting_library.esm.js", window.location.origin).href
        : "";
    const mod = await import(/* webpackIgnore: true */ href);
    const w = (mod as { widget?: WidgetFactory; default?: { widget?: WidgetFactory } }).widget
      ?? (mod as { default?: { widget?: WidgetFactory } }).default?.widget;
    if (typeof w === "function") return w;
  } catch {
    /* try standalone below */
  }

  await new Promise<void>((resolve, reject) => {
    const src = "/charting_library/charting_library.standalone.js";
    if (document.querySelector(`script[data-rs-tv="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.rsTv = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });

  const TV = (
    window as unknown as {
      TradingView?: { widget: new (options: ChartingLibraryWidgetOptions) => IChartingLibraryWidget };
    }
  ).TradingView;

  if (!TV?.widget) {
    throw new Error(
      "TradingView Charting Library not found. Copy the `charting_library` folder into `public/charting_library/`."
    );
  }

  const Ctor = TV.widget;
  return (options) => new Ctor(options);
}

const TV_OVERRIDES: Record<string, string | number | boolean> = {
  "paneProperties.background": "#131722",
  "paneProperties.backgroundType": "solid",
  "paneProperties.vertGridProperties.color": "rgba(42,46,57,0.8)",
  "paneProperties.horzGridProperties.color": "rgba(42,46,57,0.8)",
  "scalesProperties.textColor": "#d1d4dc",
  "scalesProperties.lineColor": "rgba(42,46,57,1)",
  "mainSeriesProperties.candleStyle.upColor": "#26a69a",
  "mainSeriesProperties.candleStyle.downColor": "#ef5350",
  "mainSeriesProperties.candleStyle.borderUpColor": "#26a69a",
  "mainSeriesProperties.candleStyle.borderDownColor": "#ef5350",
  "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
  "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350"
};

export const TradingViewChart = forwardRef<TradingViewChartHandle, Props>(function TradingViewChart(
  {
    symbol,
    timeframe,
    sessionDateFrom,
    sessionDateTo,
    entryPrice = null,
    stopLoss = null,
    takeProfit = null,
    replayVisibleEndSec
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetRef = useRef<IChartingLibraryWidget | null>(null);
  const replayEndRef = useRef<number | undefined>(undefined);
  const pendingSeekRef = useRef<number | null>(null);
  const lineIdsRef = useRef<unknown[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    replayEndRef.current = replayVisibleEndSec ?? undefined;
  }, [replayVisibleEndSec]);

  const drawPriceLines = useCallback(async () => {
    const w = widgetRef.current;
    if (!w || !ready) return;
    const chart = w.activeChart();

    for (const id of lineIdsRef.current) {
      try {
        chart.removeEntity(id);
      } catch {
        /* ignore */
      }
    }
    lineIdsRef.current = [];

    const vr = chart.getVisibleRange();
    if (!vr) return;

    const t0 = vr.from;
    const t1 = vr.to;

    const addLine = async (price: number, color: string, width: number, linestyle: number) => {
      try {
        const res = chart.createMultipointShape(
          [
            { time: t0, price },
            { time: t1, price }
          ],
          {
            shape: "trend_line",
            lock: true,
            disableSelection: true,
            overrides: {
              linecolor: color,
              linewidth: width,
              linestyle
            }
          }
        );
        const id = res instanceof Promise ? await res : res;
        if (id != null) lineIdsRef.current.push(id);
      } catch {
        /* shape API may differ by library version */
      }
    };

    if (entryPrice != null && Number.isFinite(entryPrice)) {
      await addLine(entryPrice, "#ff8c00", 2, 0);
    }
    if (stopLoss != null && Number.isFinite(stopLoss)) {
      await addLine(stopLoss, "#ff3c3c", 1, 2);
    }
    if (takeProfit != null && Number.isFinite(takeProfit)) {
      await addLine(takeProfit, "#00e676", 1, 2);
    }
  }, [entryPrice, stopLoss, takeProfit, ready]);

  const applySeek = useCallback(
    (timestampSec: number) => {
      if (!ready) return;
      const w = widgetRef.current;
      if (!w || !Number.isFinite(timestampSec)) return;
      try {
        const chart = w.activeChart();
        const tvRes = btTimeframeToTvResolution(timeframe);
        const barSec = secondsPerBarForResolution(tvRes);
        const left = 80;
        const right = 20;
        chart.setVisibleRange({
          from: timestampSec - left * barSec,
          to: timestampSec + right * barSec
        });
        queueMicrotask(() => {
          void drawPriceLines();
        });
      } catch {
        /* ignore */
      }
    },
    [drawPriceLines, ready, timeframe]
  );

  useImperativeHandle(
    ref,
    () => ({
      goToDate(timestampSec: number) {
        pendingSeekRef.current = timestampSec;
        applySeek(timestampSec);
      }
    }),
    [applySeek]
  );

  useEffect(() => {
    if (ready && pendingSeekRef.current != null) {
      applySeek(pendingSeekRef.current);
    }
  }, [ready, applySeek]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    let widget: IChartingLibraryWidget | null = null;
    let ro: ResizeObserver | null = null;

    const run = async () => {
      setLoadError(null);
      setReady(false);
      try {
        const widgetFactory = await loadChartingLibraryWidget();
        if (cancelled || !containerRef.current) return;

        const datafeed = createBacktestingDatafeed({
          symbol,
          sessionDateFrom,
          sessionDateTo,
          getReplayVisibleEndSec: () => replayEndRef.current
        });

        const interval = btTimeframeToTvResolution(timeframe);
        const rect = containerRef.current.getBoundingClientRect();
        const wPx = Math.max(Math.floor(rect.width), 320);
        const hPx = Math.max(Math.floor(rect.height), 400);

        widget = widgetFactory({
          container: containerRef.current,
          library_path: "/charting_library/",
          locale: "en",
          symbol,
          interval,
          datafeed,
          theme: "dark",
          autosize: false,
          width: wPx,
          height: hPx,
          loading_screen: { backgroundColor: "#131722", foregroundColor: "#d1d4dc" },
          overrides: TV_OVERRIDES,
          enabled_features: ["study_templates"],
          time_frames: [
            { text: "1d", resolution: "5" },
            { text: "5d", resolution: "30" },
            { text: "1m", resolution: "240" },
            { text: "3m", resolution: "1D" },
            { text: "6m", resolution: "1D" },
            { text: "12m", resolution: "1D" },
            { text: "60m", resolution: "1D" },
            { text: "120m", resolution: "1D" }
          ]
        });

        widgetRef.current = widget;

        widget.onChartReady(() => {
          if (cancelled) return;
          setReady(true);
        });

        ro = new ResizeObserver(() => {
          const c = containerRef.current;
          const wr = widgetRef.current;
          if (!c || !wr) return;
          const r = c.getBoundingClientRect();
          wr.resize(Math.max(Math.floor(r.width), 320), Math.max(Math.floor(r.height), 400));
        });
        ro.observe(containerRef.current);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load chart");
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      ro?.disconnect();
      try {
        widget?.remove();
      } catch {
        /* ignore */
      }
      widgetRef.current = null;
      lineIdsRef.current = [];
      setReady(false);
    };
  }, [symbol, timeframe, sessionDateFrom, sessionDateTo]);

  const prevReplayRef = useRef<number | null | undefined>(undefined);
  const replayInitRef = useRef(false);

  useEffect(() => {
    if (!ready || !widgetRef.current) return;

    if (!replayInitRef.current) {
      replayInitRef.current = true;
      prevReplayRef.current = replayVisibleEndSec;
      return;
    }

    if (prevReplayRef.current === replayVisibleEndSec) return;
    prevReplayRef.current = replayVisibleEndSec;

    try {
      widgetRef.current.activeChart().resetData();
    } catch {
      /* ignore */
    }

    const seek = pendingSeekRef.current;
    window.setTimeout(() => {
      if (seek != null && Number.isFinite(seek)) {
        applySeek(seek);
      }
    }, 280);
  }, [replayVisibleEndSec, ready, applySeek]);

  useEffect(() => {
    replayInitRef.current = false;
    prevReplayRef.current = undefined;
  }, [symbol, timeframe, sessionDateFrom, sessionDateTo]);

  useEffect(() => {
    void drawPriceLines();
  }, [drawPriceLines]);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {loadError && (
        <p className="absolute top-2 left-2 right-2 z-10 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 font-mono">
          {loadError}
        </p>
      )}
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0, overflow: "hidden" }}
      />
    </div>
  );
});

TradingViewChart.displayName = "TradingViewChart";
