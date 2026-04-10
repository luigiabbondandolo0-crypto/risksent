/**
 * Minimal TradingView Charting Library typings for RiskSent.
 * When you receive the full library from TradingView, you can replace this file
 * with the official `charting_library.d.ts` from the bundle (same path).
 */

export type ResolutionString = string;

export interface DatafeedConfiguration {
  exchanges?: ExchangeDescriptor[];
  symbols_types?: DatafeedSymbolType[];
  supported_resolutions: ResolutionString[];
  supports_marks?: boolean;
  supports_timescale_marks?: boolean;
  supports_time?: boolean;
  currency_codes?: string[];
  units?: Record<string, unknown>;
}

export interface ExchangeDescriptor {
  value: string;
  name: string;
  desc: string;
}

export interface DatafeedSymbolType {
  name: string;
  value: string;
}

export interface LibrarySymbolInfo {
  name: string;
  full_name: string;
  description: string;
  type: string;
  session: string;
  session_display?: string;
  timezone: string;
  ticker: string;
  exchange: string;
  listed_exchange?: string;
  minmov: number;
  pricescale: number;
  has_intraday: boolean;
  has_daily: boolean;
  has_weekly_and_monthly?: boolean;
  visible_plots_set?: string;
  data_status?: string;
  format?: string;
  currency_code?: string;
  original_currency_code?: string;
  unit_id?: string;
  original_unit_id?: string;
  unit_conversion_types?: string[];
  subsessions?: SubsessionInfo[];
}

export interface SubsessionInfo {
  description: string;
  id: string;
  session: string;
  "session-display"?: string;
}

export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface HistoryMetadata {
  noData?: boolean;
  nextTime?: number | null;
}

export type OnReadyCallback = (config: DatafeedConfiguration) => void;
export type ErrorCallback = (reason: string) => void;
export type HistoryCallback = (bars: Bar[], meta?: HistoryMetadata) => void;
export type ResolveCallback = (symbolInfo: LibrarySymbolInfo) => void;
export type SearchSymbolsCallback = (items: SearchSymbolResultItem[]) => void;

export interface SearchSymbolResultItem {
  symbol: string;
  full_name: string;
  description: string;
  exchange: string;
  ticker: string;
  type: string;
}

export interface PeriodParams {
  from: number;
  to: number;
  firstDataRequest: boolean;
  countBack?: number;
}

export type SubscribeBarsCallback = (bar: Bar) => void;

export interface IBasicDataFeed {
  onReady: (callback: OnReadyCallback) => void;
  searchSymbols: (
    userInput: string,
    exchange: string,
    symbolType: string,
    onResult: SearchSymbolsCallback
  ) => void;
  resolveSymbol: (
    symbolName: string,
    onResolve: ResolveCallback,
    onError: ErrorCallback,
    extension?: unknown
  ) => void;
  getBars: (
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: PeriodParams,
    onHistoryCallback: HistoryCallback,
    onErrorCallback: ErrorCallback
  ) => void;
  subscribeBars: (
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    onTick: SubscribeBarsCallback,
    listenerGuid: string,
    onResetCacheNeededCallback: () => void
  ) => void;
  unsubscribeBars: (listenerGuid: string) => void;
}

export interface ChartingLibraryWidgetOptions {
  container: HTMLElement | string;
  library_path: string;
  locale?: string;
  disabled_features?: string[];
  enabled_features?: string[];
  client_id?: string;
  user_id?: string;
  fullscreen?: boolean;
  autosize?: boolean;
  symbol: string;
  interval: ResolutionString;
  datafeed: IBasicDataFeed;
  theme?: "light" | "dark";
  custom_css_url?: string;
  loading_screen?: { backgroundColor?: string; foregroundColor?: string };
  overrides?: Record<string, string | number | boolean>;
  studies_overrides?: Record<string, string | number | boolean>;
  width?: number;
  height?: number;
  time_frames?: { text: string; resolution: string }[];
  symbol_search_complete?: boolean;
}

export interface IChartWidgetApi {
  setVisibleRange: (range: { from: number; to: number }, options?: { percentRightMargin?: number }) => void;
  resetData: () => void;
  getVisibleRange: () => { from: number; to: number } | null;
  /** Returns entity id (implementation varies by library version). */
  createMultipointShape: (
    points: { time: number; price: number }[],
    options: Record<string, unknown>
  ) => Promise<unknown>;
  removeEntity: (entityId: unknown) => void;
}

export interface IChartingLibraryWidget {
  onChartReady: (callback: () => void) => void;
  activeChart: () => IChartWidgetApi;
  remove: () => void;
  resize: (width: number, height: number) => void;
}

declare module "/charting_library/charting_library.esm.js" {
  export function widget(
    options: import("./charting_library").ChartingLibraryWidgetOptions
  ): import("./charting_library").IChartingLibraryWidget;
}
