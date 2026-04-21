"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useCallback,
  useState,
} from "react";
import {
  createChart,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/lib/backtesting/types";
import type { DrawingTool } from "./DrawingToolbar";
import { fmtPrice } from "@/lib/backtesting/symbolMap";

export type CandleOhlc = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type ChartSettings = {
  upColor: string;
  downColor: string;
  wickVisible: boolean;
  borderVisible: boolean;
  timezone: "utc" | "local";
};

export const DEFAULT_SETTINGS: ChartSettings = {
  upColor: "#26a69a",
  downColor: "#ef5350",
  wickVisible: true,
  borderVisible: true,
  timezone: "local",
};

export type ChartObject = {
  id: string;
  kind: "hline" | "trendline" | "rectangle" | "fib" | "text";
  label: string;
  price: number;
};

export type OpenTradeRef = {
  id: string;
  direction: "BUY" | "SELL";
  entry_price: number;
  stop_loss: number | null;
  take_profit: number | null;
};

export type ReplayChartHandle = {
  setCandles: (candles: Candle[], upTo: number) => void;
  appendCandle: (candle: Candle) => void;
  setTradeLines: (trade: OpenTradeRef | null) => void;
  clearTradeLines: () => void;
  clearDrawings: () => void;
  resetView: () => void;
  listObjects: () => ChartObject[];
  removeObject: (id: string) => void;
  focusObject: (id: string) => void;
  undo: () => void;
  applySettings: (s: ChartSettings) => void;
};

type Props = {
  symbol?: string;
  activeTool?: DrawingTool;
  settings?: ChartSettings;
  onCrosshairMove?: (data: CandleOhlc | null) => void;
  onContextMenu?: (price: number, clientX: number, clientY: number) => void;
  onToolComplete?: () => void;
  onPlacePosition?: (dir: "BUY" | "SELL", entry: number, sl: number, tp: number, lotSize: number) => void;
  onUpdateTradeSLTP?: (tradeId: string, sl: number | null, tp: number | null) => void;
  onObjectsChange?: () => void;
};

// ── Price format per symbol ─────────────────────────────────────────────────
function getPriceFormat(symbol: string): { precision: number; minMove: number } {
  const s = symbol.toUpperCase();
  if (s.includes("JPY")) return { precision: 3, minMove: 0.001 };
  if (s === "BTCUSD")    return { precision: 1, minMove: 0.5 };
  if (s === "ETHUSD")    return { precision: 2, minMove: 0.01 };
  if (["US30", "JPN225"].includes(s))                   return { precision: 1, minMove: 0.1 };
  if (["US500", "US100", "UK100", "GER40"].includes(s)) return { precision: 2, minMove: 0.01 };
  if (["XAUUSD"].includes(s))                           return { precision: 2, minMove: 0.01 };
  if (["XAGUSD", "USOIL"].includes(s))                  return { precision: 3, minMove: 0.001 };
  return { precision: 5, minMove: 0.00001 };
}

type ChartPoint = { price: number; logical: number };

type HLineEntry = { id: string; price: number; priceLine: IPriceLine };
type SegEntry = { id: string; type: "trendline" | "rectangle" | "fib"; p1: ChartPoint; p2: ChartPoint };
type TextEntry = { id: string; pos: ChartPoint; text: string };
type PendingPosition = {
  id: string;
  dir: "BUY" | "SELL";
  entry: number;
  sl: number;
  tp: number;
  lotSize: number;
  logicalLeft: number;
  logicalRight: number;
};

type HistoryAction =
  | { kind: "add-hline"; id: string }
  | { kind: "add-seg"; id: string }
  | { kind: "add-text"; id: string }
  | { kind: "add-pending"; id: string };

type DragState =
  | { kind: "pending-tp"; startPrice: number }
  | { kind: "pending-sl"; startPrice: number }
  | { kind: "trade-sl"; startPrice: number; orig: number }
  | { kind: "trade-tp"; startPrice: number; orig: number }
  | null;

const FIB_LEVELS  = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const FIB_COLORS  = ["#ef5350", "#ff9800", "#ffd600", "#26a69a", "#26a69a", "#ff9800", "#ef5350"];

function uid() { return Math.random().toString(36).slice(2, 9); }

function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x1 - x2, y1 - y2);
}

// Distance from point (px, py) to segment (x1,y1)-(x2,y2)
function distToSeg(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx, cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

export const ReplayChart = forwardRef<ReplayChartHandle, Props>(
  function ReplayChart(
    {
      symbol = "",
      activeTool = "cursor",
      settings = DEFAULT_SETTINGS,
      onCrosshairMove,
      onContextMenu,
      onToolComplete,
      onPlacePosition,
      onUpdateTradeSLTP,
      onObjectsChange,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef    = useRef<HTMLCanvasElement>(null);
    const chartRef     = useRef<IChartApi | null>(null);
    const seriesRef    = useRef<ISeriesApi<"Candlestick"> | null>(null);

    const tradeLineRefs = useRef<{
      entry: IPriceLine | null;
      sl:    IPriceLine | null;
      tp:    IPriceLine | null;
    }>({ entry: null, sl: null, tp: null });
    const openTradeRef = useRef<OpenTradeRef | null>(null);

    // Drawing state
    const hLinesRef  = useRef<HLineEntry[]>([]);
    const segsRef    = useRef<SegEntry[]>([]);
    const textsRef   = useRef<TextEntry[]>([]);
    const pendingRef = useRef<ChartPoint | null>(null);
    const mousePosRef = useRef<ChartPoint | null>(null);
    const pendingPositionRef = useRef<PendingPosition | null>(null);
    const historyRef = useRef<HistoryAction[]>([]);
    const dragStateRef = useRef<DragState>(null);
    const dragMovedRef = useRef(false);

    // Text input overlay
    const [textInput, setTextInput] = useState<{ x: number; y: number; pos: ChartPoint } | null>(null);

    // Callback refs
    const activeToolRef    = useRef(activeTool);
    const crosshairCbRef   = useRef(onCrosshairMove);
    const ctxMenuCbRef     = useRef(onContextMenu);
    const toolCompleteCbRef = useRef(onToolComplete);
    const placePosCbRef    = useRef(onPlacePosition);
    const updateSltpCbRef  = useRef(onUpdateTradeSLTP);
    const objectsChangeCbRef = useRef(onObjectsChange);
    const settingsRef      = useRef(settings);

    useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
    useEffect(() => { crosshairCbRef.current = onCrosshairMove; }, [onCrosshairMove]);
    useEffect(() => { ctxMenuCbRef.current = onContextMenu; }, [onContextMenu]);
    useEffect(() => { toolCompleteCbRef.current = onToolComplete; }, [onToolComplete]);
    useEffect(() => { placePosCbRef.current = onPlacePosition; }, [onPlacePosition]);
    useEffect(() => { updateSltpCbRef.current = onUpdateTradeSLTP; }, [onUpdateTradeSLTP]);
    useEffect(() => { objectsChangeCbRef.current = onObjectsChange; }, [onObjectsChange]);

    // Cancel pending 2-click drawing when tool changes
    useEffect(() => {
      if (!["trendline", "rectangle", "fib"].includes(activeTool)) {
        pendingRef.current = null;
        redrawCanvas(); // eslint-disable-line react-hooks/exhaustive-deps
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTool]);

    function notifyObjects() {
      objectsChangeCbRef.current?.();
    }

    // ── Canvas redraw ──────────────────────────────────────────────────────
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const redrawCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      const chart  = chartRef.current;
      const series = seriesRef.current;
      if (!canvas || !chart || !series) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      function toScreen(p: ChartPoint): { x: number; y: number } | null {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const x = chart!.timeScale().logicalToCoordinate(p.logical as any);
        const y = series!.priceToCoordinate(p.price);
        if (x == null || y == null) return null;
        return { x: Number(x), y: Number(y) };
      }
      function logToX(logical: number): number | null {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const x = chart!.timeScale().logicalToCoordinate(logical as any);
        return x == null ? null : Number(x);
      }
      function priceToY(price: number): number | null {
        const y = series!.priceToCoordinate(price);
        return y == null ? null : Number(y);
      }

      // ── Completed segs (trendline, rectangle, fib) ─────────────────────
      for (const seg of segsRef.current) {
        const s1 = toScreen(seg.p1);
        const s2 = toScreen(seg.p2);
        if (!s1 || !s2) continue;

        if (seg.type === "trendline") {
          ctx.strokeStyle = "#818cf8";
          ctx.lineWidth   = 1.5;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.stroke();
          ctx.fillStyle = "#818cf8";
          ctx.beginPath(); ctx.arc(s1.x, s1.y, 3, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(s2.x, s2.y, 3, 0, Math.PI * 2); ctx.fill();

        } else if (seg.type === "rectangle") {
          const x = Math.min(s1.x, s2.x);
          const y = Math.min(s1.y, s2.y);
          const w = Math.abs(s2.x - s1.x);
          const h = Math.abs(s2.y - s1.y);
          ctx.fillStyle   = "rgba(99,102,241,0.07)";
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = "#818cf8";
          ctx.lineWidth   = 1;
          ctx.setLineDash([]);
          ctx.strokeRect(x, y, w, h);

        } else if (seg.type === "fib") {
          const priceRange = seg.p2.price - seg.p1.price;
          FIB_LEVELS.forEach((level, li) => {
            const price = seg.p1.price + priceRange * level;
            const pt1   = toScreen({ price, logical: seg.p1.logical });
            const pt2   = toScreen({ price, logical: seg.p2.logical });
            if (!pt1 || !pt2) return;
            ctx.strokeStyle = FIB_COLORS[li] + "99";
            ctx.lineWidth   = 1;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(Math.min(pt1.x, pt2.x), pt1.y);
            ctx.lineTo(Math.max(pt1.x, pt2.x), pt1.y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = FIB_COLORS[li];
            ctx.font      = "10px 'JetBrains Mono', monospace";
            ctx.fillText(`${(level * 100).toFixed(1)}%  ${price.toFixed(5)}`, Math.min(pt1.x, pt2.x) + 4, pt1.y - 3);
          });
        }
      }

      // ── Texts ──────────────────────────────────────────────────────────
      for (const t of textsRef.current) {
        const s = toScreen(t.pos);
        if (!s) continue;
        ctx.font = "12px 'JetBrains Mono', monospace";
        const metrics = ctx.measureText(t.text);
        const padX = 6, padY = 3;
        const w = metrics.width + padX * 2;
        const h = 18;
        ctx.fillStyle = "rgba(99,102,241,0.15)";
        ctx.fillRect(s.x, s.y - h, w, h);
        ctx.strokeStyle = "rgba(129,140,248,0.5)";
        ctx.lineWidth = 1;
        ctx.strokeRect(s.x, s.y - h, w, h);
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText(t.text, s.x + padX, s.y - padY - 2);
      }

      // ── Pending position (long/short box, TradingView-style) ───────────
      const pp = pendingPositionRef.current;
      if (pp) {
        const x1 = logToX(pp.logicalLeft);
        const x2 = logToX(pp.logicalRight);
        const yEntry = priceToY(pp.entry);
        const yTP = priceToY(pp.tp);
        const ySL = priceToY(pp.sl);
        if (x1 != null && x2 != null && yEntry != null && yTP != null && ySL != null) {
          const xL = Math.min(x1, x2);
          const xR = Math.max(x1, x2);

          // Reward (profit) zone: entry → TP
          const topReward = Math.min(yEntry, yTP);
          const hReward = Math.abs(yTP - yEntry);
          ctx.fillStyle = "rgba(38,166,154,0.18)";
          ctx.fillRect(xL, topReward, xR - xL, hReward);
          ctx.strokeStyle = "rgba(38,166,154,0.6)";
          ctx.lineWidth = 1;
          ctx.strokeRect(xL, topReward, xR - xL, hReward);

          // Risk zone: entry → SL
          const topRisk = Math.min(yEntry, ySL);
          const hRisk = Math.abs(ySL - yEntry);
          ctx.fillStyle = "rgba(239,83,80,0.18)";
          ctx.fillRect(xL, topRisk, xR - xL, hRisk);
          ctx.strokeStyle = "rgba(239,83,80,0.6)";
          ctx.strokeRect(xL, topRisk, xR - xL, hRisk);

          // Entry line
          ctx.strokeStyle = "#ff8c00";
          ctx.setLineDash([4, 3]);
          ctx.beginPath(); ctx.moveTo(xL, yEntry); ctx.lineTo(xR, yEntry); ctx.stroke();
          ctx.setLineDash([]);

          // Handles
          const drawHandle = (x: number, y: number, color: string) => {
            ctx.fillStyle = color;
            ctx.strokeStyle = "#0a0a12";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.rect(x - 5, y - 5, 10, 10);
            ctx.fill();
            ctx.stroke();
          };
          drawHandle(xL, yTP, "#26a69a");
          drawHandle(xR, yTP, "#26a69a");
          drawHandle(xL, ySL, "#ef5350");
          drawHandle(xR, ySL, "#ef5350");
          drawHandle(xL, yEntry, "#ff8c00");
          drawHandle(xR, yEntry, "#ff8c00");

          // Labels
          ctx.font = "11px 'JetBrains Mono', monospace";
          const entryPct = ((pp.tp - pp.entry) / pp.entry) * 100;
          const slPct = ((pp.sl - pp.entry) / pp.entry) * 100;
          const risk = Math.abs(pp.entry - pp.sl);
          const reward = Math.abs(pp.tp - pp.entry);
          const rr = risk > 0 ? reward / risk : 0;

          const drawLabel = (text: string, x: number, y: number, bg: string, fg: string) => {
            ctx.font = "11px 'JetBrains Mono', monospace";
            const m = ctx.measureText(text);
            const padX = 6, padY = 3;
            const w = m.width + padX * 2;
            const h = 18;
            ctx.fillStyle = bg;
            ctx.fillRect(x, y - h / 2, w, h);
            ctx.fillStyle = fg;
            ctx.fillText(text, x + padX, y + 3);
          };

          drawLabel(
            `Target: ${fmtPrice(symbol, pp.tp)} (${entryPct.toFixed(2)}%)`,
            xR + 6, yTP,
            "rgba(38,166,154,0.95)", "#ffffff",
          );
          drawLabel(
            `Stop: ${fmtPrice(symbol, pp.sl)} (${slPct.toFixed(2)}%)`,
            xR + 6, ySL,
            "rgba(239,83,80,0.95)", "#ffffff",
          );
          drawLabel(
            `${pp.dir === "BUY" ? "LONG" : "SHORT"} · Qty: ${pp.lotSize} · R:R 1:${rr.toFixed(2)}`,
            xR + 6, yEntry,
            "rgba(255,140,0,0.95)", "#0a0a12",
          );
        }
      }

      // ── Drag preview for open trade SL/TP ──────────────────────────────
      // Open trade priceLines handle their own rendering via createPriceLine

      // ── Live preview for 2-click drawings ──────────────────────────────
      const pending = pendingRef.current;
      const mouse   = mousePosRef.current;
      if (pending) {
        const s1 = toScreen(pending);
        if (s1) {
          ctx.fillStyle = "#818cf8";
          ctx.beginPath(); ctx.arc(s1.x, s1.y, 4, 0, Math.PI * 2); ctx.fill();

          if (mouse) {
            const s2   = toScreen(mouse);
            const tool = activeToolRef.current;
            if (s2) {
              ctx.strokeStyle = "rgba(129,140,248,0.7)";
              ctx.lineWidth   = 1.5;
              ctx.setLineDash([6, 4]);
              if (tool === "trendline") {
                ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke();
              } else if (tool === "rectangle" || tool === "fib") {
                const x = Math.min(s1.x, s2.x);
                const y = Math.min(s1.y, s2.y);
                const w = Math.abs(s2.x - s1.x);
                const h = Math.abs(s2.y - s1.y);
                ctx.strokeRect(x, y, w, h);
              }
              ctx.setLineDash([]);
            }
          }
        }
      }
    }, [symbol]);

    // ── Handle hit detection ────────────────────────────────────────────
    function hitPendingHandle(mx: number, my: number): "sl" | "tp" | "body" | null {
      const chart = chartRef.current;
      const series = seriesRef.current;
      const pp = pendingPositionRef.current;
      if (!chart || !series || !pp) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const xL = chart.timeScale().logicalToCoordinate(pp.logicalLeft as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const xR = chart.timeScale().logicalToCoordinate(pp.logicalRight as any);
      const yTP = series.priceToCoordinate(pp.tp);
      const ySL = series.priceToCoordinate(pp.sl);
      const yEntry = series.priceToCoordinate(pp.entry);
      if (xL == null || xR == null || yTP == null || ySL == null || yEntry == null) return null;

      const r = 9;
      if (dist(mx, my, Number(xL), Number(yTP)) < r || dist(mx, my, Number(xR), Number(yTP)) < r) return "tp";
      if (dist(mx, my, Number(xL), Number(ySL)) < r || dist(mx, my, Number(xR), Number(ySL)) < r) return "sl";

      const left = Math.min(Number(xL), Number(xR));
      const right = Math.max(Number(xL), Number(xR));
      const top = Math.min(Number(yTP), Number(ySL));
      const bottom = Math.max(Number(yTP), Number(ySL));
      if (mx >= left && mx <= right && my >= top && my <= bottom) return "body";
      return null;
    }

    function hitOpenTradeLine(mx: number, my: number): "sl" | "tp" | null {
      const series = seriesRef.current;
      const t = openTradeRef.current;
      if (!series || !t) return null;
      const el = containerRef.current;
      if (!el) return null;
      // Check within chart horizontal range
      const chartWidth = el.clientWidth;
      if (mx < 0 || mx > chartWidth) return null;
      const THRESH = 6;
      if (t.stop_loss != null) {
        const y = series.priceToCoordinate(t.stop_loss);
        if (y != null && Math.abs(Number(y) - my) < THRESH) return "sl";
      }
      if (t.take_profit != null) {
        const y = series.priceToCoordinate(t.take_profit);
        if (y != null && Math.abs(Number(y) - my) < THRESH) return "tp";
      }
      return null;
    }

    function updateHoverCursor(mx: number, my: number) {
      const el = containerRef.current;
      if (!el) return;
      const tool = activeToolRef.current;

      if (hitPendingHandle(mx, my)) {
        const h = hitPendingHandle(mx, my);
        el.style.cursor = h === "body" ? "pointer" : "ns-resize";
        return;
      }
      if (hitOpenTradeLine(mx, my)) {
        el.style.cursor = "ns-resize";
        return;
      }
      if (tool === "eraser") { el.style.cursor = "crosshair"; return; }
      if (tool === "text" || tool === "hline" || tool === "long" || tool === "short") {
        el.style.cursor = "crosshair";
        return;
      }
      if (["trendline", "rectangle", "fib"].includes(tool)) {
        el.style.cursor = "crosshair";
        return;
      }
      el.style.cursor = "";
    }

    // ── Eraser hit detection ────────────────────────────────────────────
    function eraseAt(mx: number, my: number): boolean {
      const chart = chartRef.current;
      const series = seriesRef.current;
      if (!chart || !series) return false;
      const THRESH = 6;
      let removed = false;

      // hlines
      for (let i = hLinesRef.current.length - 1; i >= 0; i--) {
        const hl = hLinesRef.current[i];
        const y = series.priceToCoordinate(hl.price);
        if (y != null && Math.abs(Number(y) - my) < THRESH) {
          try { series.removePriceLine(hl.priceLine); } catch { /* */ }
          hLinesRef.current.splice(i, 1);
          removed = true;
          break;
        }
      }
      if (removed) return true;

      // segs
      for (let i = segsRef.current.length - 1; i >= 0; i--) {
        const seg = segsRef.current[i];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const x1 = chart.timeScale().logicalToCoordinate(seg.p1.logical as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const x2 = chart.timeScale().logicalToCoordinate(seg.p2.logical as any);
        const y1 = series.priceToCoordinate(seg.p1.price);
        const y2 = series.priceToCoordinate(seg.p2.price);
        if (x1 == null || x2 == null || y1 == null || y2 == null) continue;
        const nx1 = Number(x1), nx2 = Number(x2), ny1 = Number(y1), ny2 = Number(y2);

        if (seg.type === "trendline") {
          if (distToSeg(mx, my, nx1, ny1, nx2, ny2) < THRESH) {
            segsRef.current.splice(i, 1); return true;
          }
        } else if (seg.type === "rectangle") {
          const l = Math.min(nx1, nx2), r = Math.max(nx1, nx2);
          const t = Math.min(ny1, ny2), b = Math.max(ny1, ny2);
          // Inside rectangle or on border
          if (mx >= l - THRESH && mx <= r + THRESH && my >= t - THRESH && my <= b + THRESH &&
              (Math.abs(mx - l) < THRESH || Math.abs(mx - r) < THRESH ||
               Math.abs(my - t) < THRESH || Math.abs(my - b) < THRESH ||
               (mx > l && mx < r && my > t && my < b))) {
            segsRef.current.splice(i, 1); return true;
          }
        } else if (seg.type === "fib") {
          // Check each fib level
          const priceRange = seg.p2.price - seg.p1.price;
          let hit = false;
          for (const level of FIB_LEVELS) {
            const price = seg.p1.price + priceRange * level;
            const yy = series.priceToCoordinate(price);
            if (yy != null && Math.abs(Number(yy) - my) < THRESH &&
                mx >= Math.min(nx1, nx2) - THRESH && mx <= Math.max(nx1, nx2) + THRESH) {
              hit = true; break;
            }
          }
          if (hit) { segsRef.current.splice(i, 1); return true; }
        }
      }

      // texts
      for (let i = textsRef.current.length - 1; i >= 0; i--) {
        const t = textsRef.current[i];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const x = chart.timeScale().logicalToCoordinate(t.pos.logical as any);
        const y = series.priceToCoordinate(t.pos.price);
        if (x == null || y == null) continue;
        const nx = Number(x), ny = Number(y);
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) continue;
        ctx.font = "12px 'JetBrains Mono', monospace";
        const w = ctx.measureText(t.text).width + 12;
        const h = 18;
        if (mx >= nx - 2 && mx <= nx + w + 2 && my >= ny - h - 2 && my <= ny + 2) {
          textsRef.current.splice(i, 1); return true;
        }
      }

      return false;
    }

    // ── Chart init ──────────────────────────────────────────────────────────
    useLayoutEffect(() => {
      const el     = containerRef.current;
      const canvas = canvasRef.current;
      if (!el) return;

      const tzFormatter = (time: number | string) => {
        const ts = typeof time === "number" ? time : Date.parse(time) / 1000;
        const d = new Date(ts * 1000);
        const opts: Intl.DateTimeFormatOptions = {
          month: "short", day: "numeric", year: "numeric",
          hour: "2-digit", minute: "2-digit",
          timeZone: settingsRef.current.timezone === "utc" ? "UTC" : undefined,
        };
        return new Intl.DateTimeFormat(undefined, opts).format(d);
      };

      const chart = createChart(el, {
        layout: {
          background: { type: ColorType.Solid, color: "#080809" },
          textColor: "#94a3b8",
          fontSize: 12,
          fontFamily: "'JetBrains Mono', monospace",
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.04)", style: LineStyle.Solid },
          horzLines: { color: "rgba(255,255,255,0.04)", style: LineStyle.Solid },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: "rgba(255,255,255,0.3)", width: 1, style: LineStyle.Dashed, labelBackgroundColor: "#1e1e2e" },
          horzLine: { color: "rgba(255,255,255,0.3)", width: 1, style: LineStyle.Dashed, labelBackgroundColor: "#1e1e2e" },
        },
        rightPriceScale: {
          borderColor: "rgba(255,255,255,0.07)",
          textColor: "#94a3b8",
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        leftPriceScale: { visible: false },
        timeScale: {
          borderColor: "rgba(255,255,255,0.07)",
          timeVisible: true,
          secondsVisible: false,
          barSpacing: 8,
          rightOffset: 10,
          minBarSpacing: 2,
        },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
        handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
        localization: { timeFormatter: tzFormatter },
        width: el.clientWidth,
        height: el.clientHeight,
      });

      const s = settingsRef.current;
      const series = chart.addSeries(CandlestickSeries, {
        upColor:         s.upColor,
        downColor:       s.downColor,
        borderUpColor:   s.upColor,
        borderDownColor: s.downColor,
        wickUpColor:     s.upColor,
        wickDownColor:   s.downColor,
        borderVisible:   s.borderVisible,
        wickVisible:     s.wickVisible,
      });

      chartRef.current  = chart;
      seriesRef.current = series;

      // ── Crosshair move (crosshair data + drawing preview) ──────────────
      chart.subscribeCrosshairMove((param) => {
        if (param.point && seriesRef.current) {
          const price   = seriesRef.current.coordinateToPrice(param.point.y);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const logical = chart.timeScale().coordinateToLogical(param.point.x as any);
          if (price != null && logical != null) {
            mousePosRef.current = { price, logical: Number(logical) };
            if (pendingRef.current) redrawCanvas();
          }
        }

        const cb = crosshairCbRef.current;
        if (!cb || !seriesRef.current) return;
        if (!param.time) { cb(null); return; }
        const raw = param.seriesData.get(seriesRef.current);
        if (raw && typeof (raw as { open?: unknown }).open === "number") {
          const bar = raw as { open: number; high: number; low: number; close: number };
          cb({
            time: typeof param.time === "number" ? param.time : 0,
            open: bar.open, high: bar.high, low: bar.low, close: bar.close,
          });
        } else { cb(null); }
      });

      // ── Chart click (tools) ────────────────────────────────────────────
      chart.subscribeClick((param) => {
        const tool = activeToolRef.current;
        const sr    = seriesRef.current;
        if (!param.point || !sr) return;
        if (tool === "cursor") return;
        // If the pending position exists and the tool is long/short, don't
        // create a new one here (already handled in mousedown).
        const price   = sr.coordinateToPrice(param.point.y);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const logical = chart.timeScale().coordinateToLogical(param.point.x as any);
        if (price == null || logical == null) return;
        const pt: ChartPoint = { price, logical: Number(logical) };

        if (tool === "hline") {
          const priceLine = sr.createPriceLine({
            price,
            color: "#818cf8",
            lineWidth: 1,
            lineStyle: LineStyle.Solid,
            title: "",
            axisLabelVisible: true,
          });
          const id = uid();
          hLinesRef.current.push({ id, price, priceLine });
          historyRef.current.push({ kind: "add-hline", id });
          notifyObjects();
          toolCompleteCbRef.current?.();

        } else if (tool === "trendline" || tool === "rectangle" || tool === "fib") {
          if (!pendingRef.current) {
            pendingRef.current = pt;
            redrawCanvas();
          } else {
            const id = uid();
            segsRef.current.push({ id, type: tool, p1: pendingRef.current, p2: pt });
            historyRef.current.push({ kind: "add-seg", id });
            pendingRef.current = null;
            redrawCanvas();
            notifyObjects();
            toolCompleteCbRef.current?.();
          }

        } else if (tool === "text") {
          const canvasEl = canvasRef.current;
          if (!canvasEl) return;
          setTextInput({
            x: param.point.x,
            y: param.point.y,
            pos: pt,
          });

        } else if (tool === "long" || tool === "short") {
          const dir: "BUY" | "SELL" = tool === "long" ? "BUY" : "SELL";
          const entry = price;
          const pipStep = symbol.toUpperCase().includes("JPY") ? 0.01 : 0.0001;
          // Default spread: 20 pips risk, 40 pips reward
          const spread = pipStep * 20;
          const sl = dir === "BUY" ? entry - spread : entry + spread;
          const tp = dir === "BUY" ? entry + spread * 2 : entry - spread * 2;
          const id = uid();
          pendingPositionRef.current = {
            id,
            dir,
            entry,
            sl,
            tp,
            lotSize: 0.1,
            logicalLeft: Number(logical),
            logicalRight: Number(logical) + 25,
          };
          historyRef.current.push({ kind: "add-pending", id });
          redrawCanvas();
          notifyObjects();
          toolCompleteCbRef.current?.();
        }
      });

      // ── Capture-phase mousedown for handles & eraser ───────────────────
      const onMouseDownCapture = (e: MouseEvent) => {
        if (e.button !== 0) return;
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const sr = seriesRef.current;
        if (!sr) return;

        // 1) Pending position handle drag
        const pp = pendingPositionRef.current;
        if (pp) {
          const h = hitPendingHandle(mx, my);
          if (h === "tp" || h === "sl") {
            e.stopImmediatePropagation();
            e.preventDefault();
            dragStateRef.current = { kind: h === "tp" ? "pending-tp" : "pending-sl", startPrice: h === "tp" ? pp.tp : pp.sl };
            dragMovedRef.current = false;
            attachDocDrag();
            return;
          }
          if (h === "body") {
            // Body click: prepare click-to-open (check no drag)
            e.stopImmediatePropagation();
            e.preventDefault();
            const startX = mx, startY = my;
            const onUp = (ev: MouseEvent) => {
              document.removeEventListener("mousemove", onMv, true);
              document.removeEventListener("mouseup", onUp, true);
              const rr = el.getBoundingClientRect();
              const ux = ev.clientX - rr.left;
              const uy = ev.clientY - rr.top;
              if (Math.hypot(ux - startX, uy - startY) < 4) {
                // Click → open trade panel
                const cur = pendingPositionRef.current;
                if (cur) {
                  placePosCbRef.current?.(cur.dir, cur.entry, cur.sl, cur.tp, cur.lotSize);
                }
              }
            };
            const onMv = () => { /* consume */ };
            document.addEventListener("mousemove", onMv, true);
            document.addEventListener("mouseup", onUp, true);
            return;
          }
        }

        // 2) Open trade SL/TP drag
        const tradeHit = hitOpenTradeLine(mx, my);
        if (tradeHit) {
          const t = openTradeRef.current;
          if (t) {
            e.stopImmediatePropagation();
            e.preventDefault();
            const orig = tradeHit === "sl" ? t.stop_loss : t.take_profit;
            if (orig != null) {
              dragStateRef.current = {
                kind: tradeHit === "sl" ? "trade-sl" : "trade-tp",
                startPrice: orig,
                orig,
              };
              dragMovedRef.current = false;
              attachDocDrag();
              return;
            }
          }
        }

        // 3) Eraser tool
        if (activeToolRef.current === "eraser") {
          if (eraseAt(mx, my)) {
            e.stopImmediatePropagation();
            e.preventDefault();
            redrawCanvas();
            notifyObjects();
          }
          return;
        }
      };

      let docAttached = false;
      const onDocMove = (ev: MouseEvent) => {
        const ds = dragStateRef.current;
        if (!ds) return;
        dragMovedRef.current = true;
        const rect2 = el.getBoundingClientRect();
        const my2 = ev.clientY - rect2.top;
        const sr2 = seriesRef.current;
        if (!sr2) return;
        const p = sr2.coordinateToPrice(my2);
        if (p == null) return;
        const price = Number(p);
        if (ds.kind === "pending-tp" && pendingPositionRef.current) {
          pendingPositionRef.current.tp = price;
          redrawCanvas();
        } else if (ds.kind === "pending-sl" && pendingPositionRef.current) {
          pendingPositionRef.current.sl = price;
          redrawCanvas();
        } else if (ds.kind === "trade-sl") {
          const t = openTradeRef.current;
          if (t && tradeLineRefs.current.sl) {
            t.stop_loss = price;
            try { tradeLineRefs.current.sl.applyOptions({ price }); } catch { /* */ }
          }
        } else if (ds.kind === "trade-tp") {
          const t = openTradeRef.current;
          if (t && tradeLineRefs.current.tp) {
            t.take_profit = price;
            try { tradeLineRefs.current.tp.applyOptions({ price }); } catch { /* */ }
          }
        }
      };
      const onDocUp = () => {
        const ds = dragStateRef.current;
        if (!ds) { detachDocDrag(); return; }
        // Commit trade SL/TP change
        if (ds.kind === "trade-sl" || ds.kind === "trade-tp") {
          const t = openTradeRef.current;
          if (t && dragMovedRef.current) {
            updateSltpCbRef.current?.(
              t.id,
              t.stop_loss,
              t.take_profit,
            );
          }
        }
        dragStateRef.current = null;
        dragMovedRef.current = false;
        detachDocDrag();
      };
      function attachDocDrag() {
        if (docAttached) return;
        docAttached = true;
        document.addEventListener("mousemove", onDocMove, true);
        document.addEventListener("mouseup", onDocUp, true);
      }
      function detachDocDrag() {
        if (!docAttached) return;
        docAttached = false;
        document.removeEventListener("mousemove", onDocMove, true);
        document.removeEventListener("mouseup", onDocUp, true);
      }

      // Hover cursor update
      const onMouseMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        if (!dragStateRef.current) updateHoverCursor(mx, my);
      };

      el.addEventListener("mousedown", onMouseDownCapture, true);
      el.addEventListener("mousemove", onMouseMove);

      // ── Context menu ────────────────────────────────────────────────────
      const onCtx = (e: MouseEvent) => {
        e.preventDefault();
        const sr = seriesRef.current;
        if (!sr) return;
        const rect  = el.getBoundingClientRect();
        const price = sr.coordinateToPrice(e.clientY - rect.top);
        if (price != null) {
          ctxMenuCbRef.current?.(price, e.clientX, e.clientY);
        }
      };
      el.addEventListener("contextmenu", onCtx);

      // ── Redraw canvas on chart scroll/zoom ──────────────────────────────
      const onRangeChange = () => redrawCanvas();
      chart.timeScale().subscribeVisibleLogicalRangeChange(onRangeChange);

      // ── ResizeObserver ──────────────────────────────────────────────────
      const ro = new ResizeObserver(() => {
        if (!el || !chartRef.current) return;
        chartRef.current.applyOptions({ width: el.clientWidth, height: el.clientHeight });
        if (canvas) {
          canvas.width  = el.clientWidth;
          canvas.height = el.clientHeight;
          redrawCanvas();
        }
      });
      ro.observe(el);

      if (canvas) {
        canvas.width  = el.clientWidth;
        canvas.height = el.clientHeight;
      }

      return () => {
        detachDocDrag();
        el.removeEventListener("mousedown", onMouseDownCapture, true);
        el.removeEventListener("mousemove", onMouseMove);
        el.removeEventListener("contextmenu", onCtx);
        ro.disconnect();
        chart.remove();
        chartRef.current  = null;
        seriesRef.current = null;
        tradeLineRefs.current = { entry: null, sl: null, tp: null };
        hLinesRef.current  = [];
        segsRef.current    = [];
        textsRef.current   = [];
        pendingRef.current = null;
        pendingPositionRef.current = null;
        historyRef.current = [];
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Price format when symbol changes ────────────────────────────────────
    useEffect(() => {
      const sr = seriesRef.current;
      if (!sr || !symbol) return;
      const fmt = getPriceFormat(symbol);
      sr.applyOptions({ priceFormat: { type: "price", precision: fmt.precision, minMove: fmt.minMove } });
    }, [symbol]);

    // ── Apply settings ──────────────────────────────────────────────────────
    useEffect(() => {
      settingsRef.current = settings;
      const sr = seriesRef.current;
      const ch = chartRef.current;
      if (!sr || !ch) return;
      sr.applyOptions({
        upColor:         settings.upColor,
        downColor:       settings.downColor,
        borderUpColor:   settings.upColor,
        borderDownColor: settings.downColor,
        wickUpColor:     settings.upColor,
        wickDownColor:   settings.downColor,
        borderVisible:   settings.borderVisible,
        wickVisible:     settings.wickVisible,
      });
      ch.applyOptions({
        localization: {
          timeFormatter: (time: number | string) => {
            const ts = typeof time === "number" ? time : Date.parse(time) / 1000;
            const d = new Date(ts * 1000);
            return new Intl.DateTimeFormat(undefined, {
              month: "short", day: "numeric", year: "numeric",
              hour: "2-digit", minute: "2-digit",
              timeZone: settings.timezone === "utc" ? "UTC" : undefined,
            }).format(d);
          },
        },
      });
    }, [settings]);

    // ── Imperative handle ──────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      setCandles(candles: Candle[], upTo: number) {
        const sr = seriesRef.current;
        if (!sr) return;
        const slice = candles.slice(0, upTo + 1).map((c) => ({
          time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close,
        }));
        sr.setData(slice);
        chartRef.current?.timeScale().scrollToRealTime();
      },

      appendCandle(candle: Candle) {
        const sr = seriesRef.current;
        if (!sr) return;
        sr.update({ time: candle.time as UTCTimestamp, open: candle.open, high: candle.high, low: candle.low, close: candle.close });
      },

      setTradeLines(trade: OpenTradeRef | null) {
        const sr = seriesRef.current;
        if (!sr) return;
        const refs = tradeLineRefs.current;
        if (refs.entry) { try { sr.removePriceLine(refs.entry); } catch { /* */ } refs.entry = null; }
        if (refs.sl)    { try { sr.removePriceLine(refs.sl); }    catch { /* */ } refs.sl = null; }
        if (refs.tp)    { try { sr.removePriceLine(refs.tp); }    catch { /* */ } refs.tp = null; }
        openTradeRef.current = trade;
        if (!trade) return;
        refs.entry = sr.createPriceLine({ price: trade.entry_price, color: "#ff8c00", lineWidth: 1, lineStyle: LineStyle.Dashed, title: "Entry", axisLabelVisible: true });
        if (trade.stop_loss != null) {
          refs.sl = sr.createPriceLine({ price: trade.stop_loss, color: "#ef5350", lineWidth: 2, lineStyle: LineStyle.Dashed, title: "SL (drag)", axisLabelVisible: true });
        }
        if (trade.take_profit != null) {
          refs.tp = sr.createPriceLine({ price: trade.take_profit, color: "#26a69a", lineWidth: 2, lineStyle: LineStyle.Dashed, title: "TP (drag)", axisLabelVisible: true });
        }
      },

      clearTradeLines() {
        const sr = seriesRef.current;
        if (!sr) return;
        const refs = tradeLineRefs.current;
        for (const key of ["entry", "sl", "tp"] as const) {
          if (refs[key]) { try { sr.removePriceLine(refs[key]!); } catch { /* */ } refs[key] = null; }
        }
        openTradeRef.current = null;
      },

      clearDrawings() {
        const sr = seriesRef.current;
        if (sr) {
          for (const hl of hLinesRef.current) {
            try { sr.removePriceLine(hl.priceLine); } catch { /* */ }
          }
        }
        hLinesRef.current  = [];
        segsRef.current    = [];
        textsRef.current   = [];
        pendingRef.current = null;
        pendingPositionRef.current = null;
        historyRef.current = [];
        redrawCanvas();
        notifyObjects();
      },

      resetView() {
        chartRef.current?.timeScale().fitContent();
      },

      listObjects(): ChartObject[] {
        const out: ChartObject[] = [];
        for (const hl of hLinesRef.current) {
          out.push({ id: hl.id, kind: "hline", label: `H-Line @ ${fmtPrice(symbol, hl.price)}`, price: hl.price });
        }
        for (const seg of segsRef.current) {
          out.push({
            id: seg.id,
            kind: seg.type,
            label: `${seg.type[0].toUpperCase() + seg.type.slice(1)} @ ${fmtPrice(symbol, seg.p1.price)}`,
            price: seg.p1.price,
          });
        }
        for (const t of textsRef.current) {
          out.push({ id: t.id, kind: "text", label: `Text: ${t.text.slice(0, 20)}`, price: t.pos.price });
        }
        return out;
      },

      removeObject(id: string) {
        const sr = seriesRef.current;
        const hi = hLinesRef.current.findIndex((h) => h.id === id);
        if (hi >= 0) {
          const hl = hLinesRef.current[hi];
          if (sr) { try { sr.removePriceLine(hl.priceLine); } catch { /* */ } }
          hLinesRef.current.splice(hi, 1);
          redrawCanvas();
          notifyObjects();
          return;
        }
        const si = segsRef.current.findIndex((s) => s.id === id);
        if (si >= 0) {
          segsRef.current.splice(si, 1);
          redrawCanvas();
          notifyObjects();
          return;
        }
        const ti = textsRef.current.findIndex((t) => t.id === id);
        if (ti >= 0) {
          textsRef.current.splice(ti, 1);
          redrawCanvas();
          notifyObjects();
        }
      },

      focusObject(id: string) {
        const ch = chartRef.current;
        if (!ch) return;
        const hl = hLinesRef.current.find((h) => h.id === id);
        let logical: number | null = null;
        if (hl) {
          // Just flash — no logical info
        }
        const seg = segsRef.current.find((s) => s.id === id);
        if (seg) {
          logical = (seg.p1.logical + seg.p2.logical) / 2;
        }
        const txt = textsRef.current.find((t) => t.id === id);
        if (txt) {
          logical = txt.pos.logical;
        }
        if (logical != null) {
          try {
            ch.timeScale().setVisibleLogicalRange({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              from: (logical - 20) as any,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              to: (logical + 20) as any,
            });
          } catch { /* */ }
        }
      },

      undo() {
        const act = historyRef.current.pop();
        if (!act) return;
        const sr = seriesRef.current;
        if (act.kind === "add-hline") {
          const idx = hLinesRef.current.findIndex((h) => h.id === act.id);
          if (idx >= 0 && sr) {
            try { sr.removePriceLine(hLinesRef.current[idx].priceLine); } catch { /* */ }
            hLinesRef.current.splice(idx, 1);
          }
        } else if (act.kind === "add-seg") {
          const idx = segsRef.current.findIndex((s) => s.id === act.id);
          if (idx >= 0) segsRef.current.splice(idx, 1);
        } else if (act.kind === "add-text") {
          const idx = textsRef.current.findIndex((t) => t.id === act.id);
          if (idx >= 0) textsRef.current.splice(idx, 1);
        } else if (act.kind === "add-pending") {
          if (pendingPositionRef.current?.id === act.id) {
            pendingPositionRef.current = null;
          }
        }
        redrawCanvas();
        notifyObjects();
      },

      applySettings(s: ChartSettings) {
        settingsRef.current = s;
      },
    }));

    // Commit text from overlay input
    function commitText(text: string) {
      const ti = textInput;
      if (!ti) { setTextInput(null); return; }
      const trimmed = text.trim();
      if (trimmed) {
        const id = uid();
        textsRef.current.push({ id, pos: ti.pos, text: trimmed });
        historyRef.current.push({ kind: "add-text", id });
        redrawCanvas();
        notifyObjects();
      }
      setTextInput(null);
      toolCompleteCbRef.current?.();
    }

    return (
      <div className="relative h-full w-full">
        <div ref={containerRef} className="h-full w-full" />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 z-10"
        />
        {textInput && (
          <input
            autoFocus
            type="text"
            className="absolute z-20 rounded border border-[#818cf8]/50 bg-[#0d0d1a] px-2 py-1 font-mono text-[12px] text-white outline-none ring-1 ring-[#6366f1]/40"
            style={{ left: textInput.x, top: textInput.y - 24, width: 160 }}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitText((e.target as HTMLInputElement).value);
              if (e.key === "Escape") { setTextInput(null); toolCompleteCbRef.current?.(); }
            }}
            onBlur={(e) => commitText(e.currentTarget.value)}
          />
        )}
      </div>
    );
  },
);
