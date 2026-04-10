import type {
  Bar,
  DatafeedConfiguration,
  HistoryCallback,
  IBasicDataFeed,
  LibrarySymbolInfo,
  OnReadyCallback,
  PeriodParams,
  ResolutionString,
  SearchSymbolsCallback
} from "@/types/charting_library";
import type { Candle } from "@/lib/backtesting/btTypes";
import { btTimeframeToTvResolution, tvResolutionToBtTimeframe, TV_RESOLUTIONS } from "./resolutionMap";
import { guessSymbolMeta, SUPPORTED_SYMBOLS } from "./supportedSymbols";

export type BacktestingDatafeedParams = {
  /** Display symbol (e.g. EURUSD) — passed to `/api/backtesting/ohlcv` as `symbol`. */
  symbol: string;
  /** Session window (YYYY-MM-DD) — same as backtesting session. */
  sessionDateFrom: string;
  sessionDateTo: string;
  /**
   * During replay, only bars at or before this Unix time (seconds) are returned.
   * Return `undefined` to show the full downloaded range (e.g. chart reset / no replay cap).
   */
  getReplayVisibleEndSec: () => number | undefined;
};

function dateOnlyToUnixStartUtc(isoDate: string): number {
  const t = Date.parse(`${isoDate.trim()}T00:00:00.000Z`);
  return Number.isFinite(t) ? Math.floor(t / 1000) : 0;
}

function dateOnlyToUnixEndUtc(isoDate: string): number {
  const t = Date.parse(`${isoDate.trim()}T23:59:59.999Z`);
  return Number.isFinite(t) ? Math.floor(t / 1000) : 0;
}

function unixSecToDateOnly(sec: number): string {
  return new Date(sec * 1000).toISOString().slice(0, 10);
}

function librarySymbolInfo(ticker: string): LibrarySymbolInfo {
  const meta = guessSymbolMeta(ticker);
  const t = meta.ticker.toUpperCase();

  let pricescale = 100000;
  let minmov = 1;
  if (meta.type === "crypto") {
    pricescale = t.includes("BTC") ? 100 : 100;
    minmov = 1;
  } else if (meta.type === "metal" || meta.type === "commodity") {
    pricescale = 100;
  } else if (meta.type === "index") {
    pricescale = 100;
  }

  return {
    name: meta.ticker,
    full_name: meta.full_name,
    description: meta.description,
    type: meta.type,
    session: "24x7",
    timezone: "Etc/UTC",
    ticker: meta.ticker,
    exchange: meta.exchange,
    minmov,
    pricescale,
    has_intraday: true,
    has_daily: true,
    visible_plots_set: "ohlcv",
    format: "price"
  };
}

function candlesToBars(candles: Candle[]): Bar[] {
  const out: Bar[] = [];
  for (const c of candles) {
    if (
      !Number.isFinite(c.time) ||
      !Number.isFinite(c.open) ||
      !Number.isFinite(c.high) ||
      !Number.isFinite(c.low) ||
      !Number.isFinite(c.close)
    ) {
      continue;
    }
    out.push({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: 0
    });
  }
  return out.sort((a, b) => a.time - b.time);
}

function parseTickerFromSymbolName(symbolName: string): string {
  const s = symbolName.trim();
  const idx = s.lastIndexOf(":");
  if (idx >= 0 && idx < s.length - 1) return s.slice(idx + 1).trim();
  return s;
}

export function createBacktestingDatafeed(params: BacktestingDatafeedParams): IBasicDataFeed {
  const configuration: DatafeedConfiguration = {
    supported_resolutions: [...TV_RESOLUTIONS],
    exchanges: [{ value: "", name: "All", desc: "" }],
    symbols_types: [
      { name: "All", value: "" },
      { name: "Forex", value: "forex" },
      { name: "Index", value: "index" },
      { name: "Crypto", value: "crypto" }
    ],
    supports_marks: false,
    supports_timescale_marks: false,
    supports_time: true
  };

  return {
    onReady(callback: OnReadyCallback) {
      setTimeout(() => callback(configuration), 0);
    },

    searchSymbols(userInput, _exchange, _symbolType, onResult: SearchSymbolsCallback) {
      const q = userInput.trim().toUpperCase();
      const list = SUPPORTED_SYMBOLS.filter(
        (s) =>
          s.ticker.includes(q) ||
          s.description.toUpperCase().includes(q) ||
          s.full_name.toUpperCase().includes(q)
      ).map((s) => ({
        symbol: s.symbol,
        full_name: s.full_name,
        description: s.description,
        exchange: s.exchange,
        ticker: s.ticker,
        type: s.type
      }));
      setTimeout(() => onResult(list.slice(0, 80)), 0);
    },

    resolveSymbol(symbolName, onResolve, onError) {
      try {
        const ticker = parseTickerFromSymbolName(symbolName) || params.symbol;
        onResolve(librarySymbolInfo(ticker));
      } catch (e) {
        onError(e instanceof Error ? e.message : "resolveSymbol failed");
      }
    },

    getBars(
      symbolInfo: LibrarySymbolInfo,
      resolution: ResolutionString,
      periodParams: PeriodParams,
      onHistoryCallback: HistoryCallback,
      onErrorCallback: (reason: string) => void
    ) {
      void (async () => {
        try {
          const tf = tvResolutionToBtTimeframe(resolution);
          if (!tf) {
            onErrorCallback(`Unsupported resolution: ${resolution}`);
            return;
          }

          const sessionFromSec = dateOnlyToUnixStartUtc(params.sessionDateFrom);
          const sessionToSec = dateOnlyToUnixEndUtc(params.sessionDateTo);

          const reqFromSec = Math.max(periodParams.from, sessionFromSec);
          const reqToSec = Math.min(periodParams.to, sessionToSec);

          const fromDay = unixSecToDateOnly(reqFromSec);
          const toDay = unixSecToDateOnly(reqToSec);

          if (fromDay > toDay) {
            onHistoryCallback([], { noData: true });
            return;
          }

          const ticker = symbolInfo.ticker || params.symbol;
          const q = new URLSearchParams({
            symbol: ticker,
            timeframe: tf,
            from: fromDay,
            to: toDay
          });

          const res = await fetch(`/api/backtesting/ohlcv?${q}`);
          const j = (await res.json()) as { candles?: Candle[]; error?: string };

          if (!res.ok) {
            onErrorCallback(typeof j.error === "string" ? j.error : "OHLCV request failed");
            return;
          }

          let bars = candlesToBars(j.candles ?? []);

          const cap = params.getReplayVisibleEndSec();
          if (cap != null && Number.isFinite(cap)) {
            bars = bars.filter((b) => b.time <= cap);
          }

          if (bars.length === 0) {
            onHistoryCallback([], { noData: true });
            return;
          }

          onHistoryCallback(bars, { noData: false });
        } catch (e) {
          onErrorCallback(e instanceof Error ? e.message : "getBars failed");
        }
      })();
    },

    subscribeBars() {
      /* backtesting — no realtime stream */
    },

    unsubscribeBars() {
      /* no-op */
    }
  };
}

export { btTimeframeToTvResolution };
