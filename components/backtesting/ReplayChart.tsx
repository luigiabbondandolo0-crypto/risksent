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
import { calcPips, fmtPrice } from "@/lib/backtesting/symbolMap";

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
  timezone: string; // IANA or "local"
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
  kind: "hline" | "trendline" | "rectangle" | "fib" | "text" | "long" | "short";
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

type ChartPoint = { price: number; logical: number };

export type PersistedHLine = { id: string; price: number };
export type PersistedSeg = {
  id: string;
  type: "trendline" | "rectangle" | "fib";
  p1: ChartPoint;
  p2: ChartPoint;
};
export type PersistedText = { id: string; pos: ChartPoint; text: string };
export type PersistedPending = {
  id: string;
  dir: "BUY" | "SELL";
  entry: number;
  sl: number;
  tp: number;
  lotSize: number;
  logicalLeft: number;
  logicalRight: number;
};

export type PersistedState = {
  hLines: PersistedHLine[];
  segs: PersistedSeg[];
  texts: PersistedText[];
  pendings: PersistedPending[];
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
  getState: () => PersistedState;
  setState: (s: PersistedState) => void;
};

type Props = {
  symbol?: string;
  activeTool?: DrawingTool;
  settings?: ChartSettings;
  onCrosshairMove?: (data: CandleOhlc | null) => void;
  onContextMenu?: (price: number, clientX: number, clientY: number) => void;
  onDrawingContextMenu?: (objectId: string, clientX: number, clientY: number) => void;
  onToolComplete?: () => void;
  onPlacePosition?: (dir: "BUY" | "SELL", entry: number, sl: number, tp: number, lotSize: number) => void;
  onUpdateTradeSLTP?: (tradeId: string, sl: number | null, tp: number | null) => void;
  onObjectsChange?: () => void;
  onStateChange?: () => void;
};

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

type HLineEntry = { id: string; price: number; priceLine: IPriceLine };
type SegEntry = PersistedSeg;
type TextEntry = PersistedText;
type PendingPosition = PersistedPending;

type HistoryAction =
  | { kind: "add-hline"; id: string }
  | { kind: "add-seg"; id: string }
  | { kind: "add-text"; id: string }
  | { kind: "add-pending"; id: string };

type DragState =
  | { kind: "pending-tp"; pid: string }
  | { kind: "pending-sl"; pid: string }
  | { kind: "pending-entry"; pid: string }
  | { kind: "pending-body"; pid: string; startPrice: number; startLogical: number; orig: PendingPosition }
  | { kind: "pending-edgeL"; pid: string }
  | { kind: "pending-edgeR"; pid: string }
  | { kind: "trade-sl"; orig: number }
  | { kind: "trade-tp"; orig: number }
  | { kind: "hline"; id: string }
  | { kind: "seg-p1"; id: string }
  | { kind: "seg-p2"; id: string }
  | { kind: "seg-body"; id: string; startPrice: number; startLogical: number; origP1: ChartPoint; origP2: ChartPoint }
  | { kind: "text"; id: string; startPrice: number; startLogical: number; origPos: ChartPoint }
  | null;

const FIB_LEVELS  = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const FIB_COLORS  = ["#ef5350", "#ff9800", "#ffd600", "#26a69a", "#26a69a", "#ff9800", "#ef5350"];

function uid() { return Math.random().toString(36).slice(2, 9); }
function dist(x1: number, y1: number, x2: number, y2: number) { return Math.hypot(x1 - x2, y1 - y2); }
function distToSeg(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export const ReplayChart = forwardRef<ReplayChartHandle, Props>(
  function ReplayChart(
    {
      symbol = "",
      activeTool = "cursor",
      settings = DEFAULT_SETTINGS,
      onCrosshairMove,
      onContextMenu,
      onDrawingContextMenu,
      onToolComplete,
      onPlacePosition,
      onUpdateTradeSLTP,
      onObjectsChange,
      onStateChange,
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

    const hLinesRef  = useRef<HLineEntry[]>([]);
    const segsRef    = useRef<SegEntry[]>([]);
    const textsRef   = useRef<TextEntry[]>([]);
    const pendingPositionsRef = useRef<PendingPosition[]>([]);
    const pendingSegRef = useRef<ChartPoint | null>(null);
    const mousePosRef = useRef<ChartPoint | null>(null);
    const historyRef = useRef<HistoryAction[]>([]);
    const dragStateRef = useRef<DragState>(null);
    const dragMovedRef = useRef(false);
    const symbolRef = useRef(symbol);

    const [textInput, setTextInput] = useState<{ x: number; y: number; pos: ChartPoint } | null>(null);

    const activeToolRef    = useRef(activeTool);
    const crosshairCbRef   = useRef(onCrosshairMove);
    const ctxMenuCbRef     = useRef(onContextMenu);
    const drawCtxMenuCbRef = useRef(onDrawingContextMenu);
    const toolCompleteCbRef = useRef(onToolComplete);
    const placePosCbRef    = useRef(onPlacePosition);
    const updateSltpCbRef  = useRef(onUpdateTradeSLTP);
    const objectsChangeCbRef = useRef(onObjectsChange);
    const stateChangeCbRef = useRef(onStateChange);
    const settingsRef      = useRef(settings);

    useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
    useEffect(() => { crosshairCbRef.current = onCrosshairMove; }, [onCrosshairMove]);
    useEffect(() => { ctxMenuCbRef.current = onContextMenu; }, [onContextMenu]);
    useEffect(() => { drawCtxMenuCbRef.current = onDrawingContextMenu; }, [onDrawingContextMenu]);
    useEffect(() => { toolCompleteCbRef.current = onToolComplete; }, [onToolComplete]);
    useEffect(() => { placePosCbRef.current = onPlacePosition; }, [onPlacePosition]);
    useEffect(() => { updateSltpCbRef.current = onUpdateTradeSLTP; }, [onUpdateTradeSLTP]);
    useEffect(() => { objectsChangeCbRef.current = onObjectsChange; }, [onObjectsChange]);
    useEffect(() => { stateChangeCbRef.current = onStateChange; }, [onStateChange]);
    useEffect(() => { symbolRef.current = symbol; }, [symbol]);

    // Cancel pending 2-click drawing when tool changes
    useEffect(() => {
      if (!["trendline", "rectangle", "fib"].includes(activeTool)) {
        pendingSegRef.current = null;
        redrawCanvas(); // eslint-disable-line react-hooks/exhaustive-deps
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTool]);

    function notifyObjects() { objectsChangeCbRef.current?.(); }
    function notifyState() { stateChangeCbRef.current?.(); }

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

      const sym = symbolRef.current;

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

      // Segs
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
          // corner handles
          ctx.fillStyle = "#818cf8";
          ctx.beginPath(); ctx.arc(s1.x, s1.y, 3, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(s2.x, s2.y, 3, 0, Math.PI * 2); ctx.fill();

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
          // endpoint handles
          ctx.fillStyle = "#818cf8";
          ctx.beginPath(); ctx.arc(s1.x, s1.y, 3, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(s2.x, s2.y, 3, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Texts
      for (const t of textsRef.current) {
        const s = toScreen(t.pos);
        if (!s) continue;
        ctx.font = "12px 'JetBrains Mono', monospace";
        const metrics = ctx.measureText(t.text);
        const padX = 6;
        const w = metrics.width + padX * 2;
        const h = 18;
        ctx.fillStyle = "rgba(99,102,241,0.15)";
        ctx.fillRect(s.x, s.y - h, w, h);
        ctx.strokeStyle = "rgba(129,140,248,0.5)";
        ctx.lineWidth = 1;
        ctx.strokeRect(s.x, s.y - h, w, h);
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText(t.text, s.x + padX, s.y - 5);
      }

      // Pending positions
      for (const pp of pendingPositionsRef.current) {
        const x1 = logToX(pp.logicalLeft);
        const x2 = logToX(pp.logicalRight);
        const yEntry = priceToY(pp.entry);
        const yTP = priceToY(pp.tp);
        const ySL = priceToY(pp.sl);
        if (x1 == null || x2 == null || yEntry == null || yTP == null || ySL == null) continue;

        const xL = Math.min(x1, x2);
        const xR = Math.max(x1, x2);

        // Reward zone
        const topReward = Math.min(yEntry, yTP);
        const hReward = Math.abs(yTP - yEntry);
        ctx.fillStyle = "rgba(38,166,154,0.18)";
        ctx.fillRect(xL, topReward, xR - xL, hReward);
        ctx.strokeStyle = "rgba(38,166,154,0.6)";
        ctx.lineWidth = 1;
        ctx.strokeRect(xL, topReward, xR - xL, hReward);

        // Risk zone
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

        // Labels in points (pips)
        const slPts = Math.abs(calcPips(sym, pp.entry - pp.sl));
        const tpPts = Math.abs(calcPips(sym, pp.tp - pp.entry));
        const risk = Math.abs(pp.entry - pp.sl);
        const reward = Math.abs(pp.tp - pp.entry);
        const rr = risk > 0 ? reward / risk : 0;

        const drawLabel = (text: string, x: number, y: number, bg: string, fg: string) => {
          ctx.font = "11px 'JetBrains Mono', monospace";
          const m = ctx.measureText(text);
          const padX = 6;
          const w = m.width + padX * 2;
          const h = 18;
          ctx.fillStyle = bg;
          ctx.fillRect(x, y - h / 2, w, h);
          ctx.fillStyle = fg;
          ctx.fillText(text, x + padX, y + 3);
        };

        drawLabel(
          `Target: ${fmtPrice(sym, pp.tp)}  +${tpPts.toFixed(1)} pts`,
          xR + 6, yTP,
          "rgba(38,166,154,0.95)", "#ffffff",
        );
        drawLabel(
          `Stop: ${fmtPrice(sym, pp.sl)}  -${slPts.toFixed(1)} pts`,
          xR + 6, ySL,
          "rgba(239,83,80,0.95)", "#ffffff",
        );
        drawLabel(
          `${pp.dir === "BUY" ? "LONG" : "SHORT"} · Qty ${pp.lotSize} · R:R 1:${rr.toFixed(2)}`,
          xR + 6, yEntry,
          "rgba(255,140,0,0.95)", "#0a0a12",
        );
      }

      // Hlines (rendered via priceLine, but add hover handle)
      // (priceLine handles itself; nothing extra needed here)

      // Hlines
      for (const hl of hLinesRef.current) {
        const y = priceToY(hl.price);
        if (y == null) continue;
        // Draw a small handle at the right side to indicate draggability
        ctx.fillStyle = "#818cf8";
        ctx.strokeStyle = "#0a0a12";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(canvas.width - 60, y, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }

      // Live preview for 2-click drawings
      const pending = pendingSegRef.current;
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
    }, []);

    // ── Hit testing ────────────────────────────────────────────────────────
    function getCoords(mx: number, my: number): { price: number; logical: number } | null {
      const chart = chartRef.current;
      const series = seriesRef.current;
      if (!chart || !series) return null;
      const p = series.coordinateToPrice(my);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const l = chart.timeScale().coordinateToLogical(mx as any);
      if (p == null || l == null) return null;
      return { price: Number(p), logical: Number(l) };
    }

    function toPx(p: ChartPoint): { x: number; y: number } | null {
      const chart = chartRef.current;
      const series = seriesRef.current;
      if (!chart || !series) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const x = chart.timeScale().logicalToCoordinate(p.logical as any);
      const y = series.priceToCoordinate(p.price);
      if (x == null || y == null) return null;
      return { x: Number(x), y: Number(y) };
    }

    function hitPending(mx: number, my: number): { id: string; part: "tp" | "sl" | "entry" | "edgeL" | "edgeR" | "body" } | null {
      const R = 9;
      for (const pp of pendingPositionsRef.current) {
        const px1 = toPx({ price: pp.entry, logical: pp.logicalLeft });
        const px2 = toPx({ price: pp.entry, logical: pp.logicalRight });
        if (!px1 || !px2) continue;
        const xL = Math.min(px1.x, px2.x);
        const xR = Math.max(px1.x, px2.x);
        const yEntry = px1.y;
        const tpY = toPx({ price: pp.tp, logical: pp.logicalLeft })?.y ?? null;
        const slY = toPx({ price: pp.sl, logical: pp.logicalLeft })?.y ?? null;
        if (tpY == null || slY == null) continue;

        // Handles (priority)
        if (dist(mx, my, xL, tpY) < R || dist(mx, my, xR, tpY) < R) return { id: pp.id, part: "tp" };
        if (dist(mx, my, xL, slY) < R || dist(mx, my, xR, slY) < R) return { id: pp.id, part: "sl" };
        if (dist(mx, my, xL, yEntry) < R || dist(mx, my, xR, yEntry) < R) return { id: pp.id, part: "entry" };

        const top = Math.min(tpY, slY);
        const bot = Math.max(tpY, slY);
        // Horizontal edges of box → pending-edgeL / R (resize width)
        if (my >= top && my <= bot) {
          if (Math.abs(mx - xL) < 6) return { id: pp.id, part: "edgeL" };
          if (Math.abs(mx - xR) < 6) return { id: pp.id, part: "edgeR" };
        }
        // Body
        if (mx >= xL && mx <= xR && my >= top && my <= bot) return { id: pp.id, part: "body" };
      }
      return null;
    }

    function hitTradeLine(mx: number, my: number): "sl" | "tp" | null {
      const series = seriesRef.current;
      const t = openTradeRef.current;
      if (!series || !t) return null;
      const el = containerRef.current;
      if (!el) return null;
      if (mx < 0 || mx > el.clientWidth) return null;
      const T = 6;
      if (t.stop_loss != null) {
        const y = series.priceToCoordinate(t.stop_loss);
        if (y != null && Math.abs(Number(y) - my) < T) return "sl";
      }
      if (t.take_profit != null) {
        const y = series.priceToCoordinate(t.take_profit);
        if (y != null && Math.abs(Number(y) - my) < T) return "tp";
      }
      return null;
    }

    function hitHLine(mx: number, my: number): string | null {
      const series = seriesRef.current;
      if (!series) return null;
      const T = 5;
      for (let i = hLinesRef.current.length - 1; i >= 0; i--) {
        const hl = hLinesRef.current[i];
        const y = series.priceToCoordinate(hl.price);
        if (y != null && Math.abs(Number(y) - my) < T) return hl.id;
      }
      return null;
    }

    function hitSeg(mx: number, my: number): { id: string; part: "p1" | "p2" | "body" } | null {
      const T = 6;
      for (let i = segsRef.current.length - 1; i >= 0; i--) {
        const seg = segsRef.current[i];
        const s1 = toPx(seg.p1);
        const s2 = toPx(seg.p2);
        if (!s1 || !s2) continue;
        if (dist(mx, my, s1.x, s1.y) < 8) return { id: seg.id, part: "p1" };
        if (dist(mx, my, s2.x, s2.y) < 8) return { id: seg.id, part: "p2" };

        if (seg.type === "trendline") {
          if (distToSeg(mx, my, s1.x, s1.y, s2.x, s2.y) < T) return { id: seg.id, part: "body" };
        } else if (seg.type === "rectangle") {
          const l = Math.min(s1.x, s2.x), r = Math.max(s1.x, s2.x);
          const t = Math.min(s1.y, s2.y), b = Math.max(s1.y, s2.y);
          // Inside or on border
          if (mx >= l - T && mx <= r + T && my >= t - T && my <= b + T) {
            return { id: seg.id, part: "body" };
          }
        } else if (seg.type === "fib") {
          const priceRange = seg.p2.price - seg.p1.price;
          const series = seriesRef.current;
          if (!series) continue;
          const xmin = Math.min(s1.x, s2.x), xmax = Math.max(s1.x, s2.x);
          for (const level of FIB_LEVELS) {
            const price = seg.p1.price + priceRange * level;
            const yy = series.priceToCoordinate(price);
            if (yy != null && Math.abs(Number(yy) - my) < T && mx >= xmin - T && mx <= xmax + T) {
              return { id: seg.id, part: "body" };
            }
          }
        }
      }
      return null;
    }

    function hitText(mx: number, my: number): string | null {
      const chart = chartRef.current;
      const series = seriesRef.current;
      const canvas = canvasRef.current;
      if (!chart || !series || !canvas) return null;
      const c = canvas.getContext("2d");
      if (!c) return null;
      c.font = "12px 'JetBrains Mono', monospace";
      for (let i = textsRef.current.length - 1; i >= 0; i--) {
        const t = textsRef.current[i];
        const s = toPx(t.pos);
        if (!s) continue;
        const w = c.measureText(t.text).width + 12;
        const h = 18;
        if (mx >= s.x - 2 && mx <= s.x + w + 2 && my >= s.y - h - 2 && my <= s.y + 2) return t.id;
      }
      return null;
    }

    function hitAnyDrawing(mx: number, my: number): { kind: "hline" | "seg" | "text" | "pending"; id: string } | null {
      const pp = hitPending(mx, my);
      if (pp) return { kind: "pending", id: pp.id };
      const sg = hitSeg(mx, my);
      if (sg) return { kind: "seg", id: sg.id };
      const tx = hitText(mx, my);
      if (tx) return { kind: "text", id: tx };
      const hl = hitHLine(mx, my);
      if (hl) return { kind: "hline", id: hl };
      return null;
    }

    function updateHoverCursor(mx: number, my: number) {
      const el = containerRef.current;
      if (!el) return;
      const tool = activeToolRef.current;

      const pp = hitPending(mx, my);
      if (pp) {
        if (pp.part === "tp" || pp.part === "sl" || pp.part === "entry") el.style.cursor = "ns-resize";
        else if (pp.part === "edgeL" || pp.part === "edgeR") el.style.cursor = "ew-resize";
        else el.style.cursor = "move";
        return;
      }
      if (hitTradeLine(mx, my)) { el.style.cursor = "ns-resize"; return; }
      const sg = hitSeg(mx, my);
      if (sg) { el.style.cursor = sg.part === "body" ? "move" : "nwse-resize"; return; }
      if (hitText(mx, my)) { el.style.cursor = "move"; return; }
      if (hitHLine(mx, my)) { el.style.cursor = "ns-resize"; return; }

      if (tool === "eraser") { el.style.cursor = "crosshair"; return; }
      if (tool === "text" || tool === "hline" || tool === "long" || tool === "short") {
        el.style.cursor = "crosshair"; return;
      }
      if (["trendline", "rectangle", "fib"].includes(tool)) { el.style.cursor = "crosshair"; return; }
      el.style.cursor = "";
    }

    // Remove by id (from anywhere)
    function removeById(id: string) {
      const sr = seriesRef.current;
      const hi = hLinesRef.current.findIndex((h) => h.id === id);
      if (hi >= 0) {
        if (sr) { try { sr.removePriceLine(hLinesRef.current[hi].priceLine); } catch { /* */ } }
        hLinesRef.current.splice(hi, 1);
        return true;
      }
      const si = segsRef.current.findIndex((s) => s.id === id);
      if (si >= 0) { segsRef.current.splice(si, 1); return true; }
      const ti = textsRef.current.findIndex((t) => t.id === id);
      if (ti >= 0) { textsRef.current.splice(ti, 1); return true; }
      const pi = pendingPositionsRef.current.findIndex((p) => p.id === id);
      if (pi >= 0) { pendingPositionsRef.current.splice(pi, 1); return true; }
      return false;
    }

    function eraseAt(mx: number, my: number): boolean {
      const hit = hitAnyDrawing(mx, my);
      if (!hit) return false;
      removeById(hit.id);
      return true;
    }

    // ── Chart init ──────────────────────────────────────────────────────────
    useLayoutEffect(() => {
      const el     = containerRef.current;
      const canvas = canvasRef.current;
      if (!el) return;

      const tzFormatter = (time: number | string) => {
        const ts = typeof time === "number" ? time : Date.parse(time) / 1000;
        const d = new Date(ts * 1000);
        const tz = settingsRef.current.timezone;
        return new Intl.DateTimeFormat(undefined, {
          month: "short", day: "numeric", year: "numeric",
          hour: "2-digit", minute: "2-digit",
          timeZone: tz && tz !== "local" ? tz : undefined,
        }).format(d);
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

      chart.subscribeCrosshairMove((param) => {
        if (param.point && seriesRef.current) {
          const price   = seriesRef.current.coordinateToPrice(param.point.y);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const logical = chart.timeScale().coordinateToLogical(param.point.x as any);
          if (price != null && logical != null) {
            mousePosRef.current = { price, logical: Number(logical) };
            if (pendingSegRef.current) redrawCanvas();
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

      chart.subscribeClick((param) => {
        const tool = activeToolRef.current;
        const sr    = seriesRef.current;
        if (!param.point || !sr) return;
        if (tool === "cursor") return;
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
          notifyState();
          toolCompleteCbRef.current?.();

        } else if (tool === "trendline" || tool === "rectangle" || tool === "fib") {
          if (!pendingSegRef.current) {
            pendingSegRef.current = pt;
            redrawCanvas();
          } else {
            const id = uid();
            segsRef.current.push({ id, type: tool, p1: pendingSegRef.current, p2: pt });
            historyRef.current.push({ kind: "add-seg", id });
            pendingSegRef.current = null;
            redrawCanvas();
            notifyObjects();
            notifyState();
            toolCompleteCbRef.current?.();
          }

        } else if (tool === "text") {
          setTextInput({ x: param.point.x, y: param.point.y, pos: pt });

        } else if (tool === "long" || tool === "short") {
          const sym = symbolRef.current;
          const dir: "BUY" | "SELL" = tool === "long" ? "BUY" : "SELL";
          const entry = price;
          const pipStep = sym.toUpperCase().includes("JPY") ? 0.01 : 0.0001;
          const spread = pipStep * 20;
          const sl = dir === "BUY" ? entry - spread : entry + spread;
          const tp = dir === "BUY" ? entry + spread * 2 : entry - spread * 2;
          const id = uid();
          pendingPositionsRef.current.push({
            id, dir, entry, sl, tp,
            lotSize: 0.1,
            logicalLeft: Number(logical),
            logicalRight: Number(logical) + 25,
          });
          historyRef.current.push({ kind: "add-pending", id });
          redrawCanvas();
          notifyObjects();
          notifyState();
          toolCompleteCbRef.current?.();
        }
      });

      // ── Capture mousedown: handle drags and eraser ─────────────────────
      const onMouseDownCapture = (e: MouseEvent) => {
        if (e.button !== 0) return;
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const sr = seriesRef.current;
        if (!sr) return;

        // Eraser tool (any drawing)
        if (activeToolRef.current === "eraser") {
          if (eraseAt(mx, my)) {
            e.stopImmediatePropagation();
            e.preventDefault();
            redrawCanvas();
            notifyObjects();
            notifyState();
          }
          return;
        }

        // Pending position handles / body
        const pph = hitPending(mx, my);
        if (pph) {
          e.stopImmediatePropagation();
          e.preventDefault();
          const pp = pendingPositionsRef.current.find((p) => p.id === pph.id);
          if (!pp) return;
          if (pph.part === "tp") dragStateRef.current = { kind: "pending-tp", pid: pp.id };
          else if (pph.part === "sl") dragStateRef.current = { kind: "pending-sl", pid: pp.id };
          else if (pph.part === "entry") dragStateRef.current = { kind: "pending-entry", pid: pp.id };
          else if (pph.part === "edgeL") dragStateRef.current = { kind: "pending-edgeL", pid: pp.id };
          else if (pph.part === "edgeR") dragStateRef.current = { kind: "pending-edgeR", pid: pp.id };
          else {
            const coords = getCoords(mx, my);
            if (!coords) return;
            dragStateRef.current = {
              kind: "pending-body", pid: pp.id,
              startPrice: coords.price, startLogical: coords.logical,
              orig: { ...pp },
            };
          }
          dragMovedRef.current = false;
          attachDocDrag();
          return;
        }

        // Trade SL/TP
        const tradeHit = hitTradeLine(mx, my);
        if (tradeHit) {
          const t = openTradeRef.current;
          if (t) {
            const orig = tradeHit === "sl" ? t.stop_loss : t.take_profit;
            if (orig != null) {
              e.stopImmediatePropagation();
              e.preventDefault();
              dragStateRef.current = { kind: tradeHit === "sl" ? "trade-sl" : "trade-tp", orig };
              dragMovedRef.current = false;
              attachDocDrag();
              return;
            }
          }
        }

        // Seg endpoints / body
        const sg = hitSeg(mx, my);
        if (sg) {
          const seg = segsRef.current.find((s) => s.id === sg.id);
          if (!seg) return;
          e.stopImmediatePropagation();
          e.preventDefault();
          if (sg.part === "p1") dragStateRef.current = { kind: "seg-p1", id: seg.id };
          else if (sg.part === "p2") dragStateRef.current = { kind: "seg-p2", id: seg.id };
          else {
            const coords = getCoords(mx, my);
            if (!coords) return;
            dragStateRef.current = {
              kind: "seg-body", id: seg.id,
              startPrice: coords.price, startLogical: coords.logical,
              origP1: { ...seg.p1 }, origP2: { ...seg.p2 },
            };
          }
          dragMovedRef.current = false;
          attachDocDrag();
          return;
        }

        // Text
        const tx = hitText(mx, my);
        if (tx) {
          const t = textsRef.current.find((t) => t.id === tx);
          if (!t) return;
          const coords = getCoords(mx, my);
          if (!coords) return;
          e.stopImmediatePropagation();
          e.preventDefault();
          dragStateRef.current = {
            kind: "text", id: tx,
            startPrice: coords.price, startLogical: coords.logical,
            origPos: { ...t.pos },
          };
          dragMovedRef.current = false;
          attachDocDrag();
          return;
        }

        // HLine
        const hid = hitHLine(mx, my);
        if (hid) {
          e.stopImmediatePropagation();
          e.preventDefault();
          dragStateRef.current = { kind: "hline", id: hid };
          dragMovedRef.current = false;
          attachDocDrag();
          return;
        }
      };

      let docAttached = false;
      const onDocMove = (ev: MouseEvent) => {
        const ds = dragStateRef.current;
        if (!ds) return;
        dragMovedRef.current = true;
        const rect2 = el.getBoundingClientRect();
        const mx = ev.clientX - rect2.left;
        const my = ev.clientY - rect2.top;
        const coords = getCoords(mx, my);
        if (!coords) return;
        const sr2 = seriesRef.current;

        if (ds.kind === "pending-tp" || ds.kind === "pending-sl" || ds.kind === "pending-entry") {
          const pp = pendingPositionsRef.current.find((p) => p.id === ds.pid);
          if (!pp) return;
          if (ds.kind === "pending-tp") pp.tp = coords.price;
          else if (ds.kind === "pending-sl") pp.sl = coords.price;
          else pp.entry = coords.price;
          redrawCanvas();
        } else if (ds.kind === "pending-edgeL") {
          const pp = pendingPositionsRef.current.find((p) => p.id === ds.pid);
          if (!pp) return;
          pp.logicalLeft = coords.logical;
          redrawCanvas();
        } else if (ds.kind === "pending-edgeR") {
          const pp = pendingPositionsRef.current.find((p) => p.id === ds.pid);
          if (!pp) return;
          pp.logicalRight = coords.logical;
          redrawCanvas();
        } else if (ds.kind === "pending-body") {
          const pp = pendingPositionsRef.current.find((p) => p.id === ds.pid);
          if (!pp) return;
          const dp = coords.price - ds.startPrice;
          const dl = coords.logical - ds.startLogical;
          pp.entry = ds.orig.entry + dp;
          pp.sl = ds.orig.sl + dp;
          pp.tp = ds.orig.tp + dp;
          pp.logicalLeft = ds.orig.logicalLeft + dl;
          pp.logicalRight = ds.orig.logicalRight + dl;
          redrawCanvas();
        } else if (ds.kind === "trade-sl") {
          const t = openTradeRef.current;
          if (t && tradeLineRefs.current.sl) {
            t.stop_loss = coords.price;
            try { tradeLineRefs.current.sl.applyOptions({ price: coords.price }); } catch { /* */ }
          }
        } else if (ds.kind === "trade-tp") {
          const t = openTradeRef.current;
          if (t && tradeLineRefs.current.tp) {
            t.take_profit = coords.price;
            try { tradeLineRefs.current.tp.applyOptions({ price: coords.price }); } catch { /* */ }
          }
        } else if (ds.kind === "hline") {
          const hl = hLinesRef.current.find((h) => h.id === ds.id);
          if (hl && sr2) {
            hl.price = coords.price;
            try { hl.priceLine.applyOptions({ price: coords.price }); } catch { /* */ }
          }
        } else if (ds.kind === "seg-p1") {
          const seg = segsRef.current.find((s) => s.id === ds.id);
          if (seg) { seg.p1 = coords; redrawCanvas(); }
        } else if (ds.kind === "seg-p2") {
          const seg = segsRef.current.find((s) => s.id === ds.id);
          if (seg) { seg.p2 = coords; redrawCanvas(); }
        } else if (ds.kind === "seg-body") {
          const seg = segsRef.current.find((s) => s.id === ds.id);
          if (seg) {
            const dp = coords.price - ds.startPrice;
            const dl = coords.logical - ds.startLogical;
            seg.p1 = { price: ds.origP1.price + dp, logical: ds.origP1.logical + dl };
            seg.p2 = { price: ds.origP2.price + dp, logical: ds.origP2.logical + dl };
            redrawCanvas();
          }
        } else if (ds.kind === "text") {
          const t = textsRef.current.find((t) => t.id === ds.id);
          if (t) {
            const dp = coords.price - ds.startPrice;
            const dl = coords.logical - ds.startLogical;
            t.pos = { price: ds.origPos.price + dp, logical: ds.origPos.logical + dl };
            redrawCanvas();
          }
        }
      };
      const onDocUp = (ev: MouseEvent) => {
        const ds = dragStateRef.current;
        if (!ds) { detachDocDrag(); return; }

        // Commit trade SL/TP change via API
        if (ds.kind === "trade-sl" || ds.kind === "trade-tp") {
          const t = openTradeRef.current;
          if (t && dragMovedRef.current) {
            updateSltpCbRef.current?.(t.id, t.stop_loss, t.take_profit);
          }
        } else if (dragMovedRef.current) {
          // Persist any drawing change
          notifyObjects();
          notifyState();
        } else {
          // No movement → click on pending body opens trade panel
          if (ds.kind === "pending-body") {
            const pp = pendingPositionsRef.current.find((p) => p.id === ds.pid);
            if (pp) placePosCbRef.current?.(pp.dir, pp.entry, pp.sl, pp.tp, pp.lotSize);
          }
        }

        dragStateRef.current = null;
        dragMovedRef.current = false;
        detachDocDrag();
        void ev;
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

      const onMouseMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        if (!dragStateRef.current) updateHoverCursor(mx, my);
      };

      el.addEventListener("mousedown", onMouseDownCapture, true);
      el.addEventListener("mousemove", onMouseMove);

      const onCtx = (e: MouseEvent) => {
        e.preventDefault();
        const sr = seriesRef.current;
        if (!sr) return;
        const rect  = el.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Hit-test drawing first
        const hit = hitAnyDrawing(mx, my);
        if (hit) {
          drawCtxMenuCbRef.current?.(hit.id, e.clientX, e.clientY);
          return;
        }

        const price = sr.coordinateToPrice(my);
        if (price != null) ctxMenuCbRef.current?.(Number(price), e.clientX, e.clientY);
      };
      el.addEventListener("contextmenu", onCtx);

      const onRangeChange = () => redrawCanvas();
      chart.timeScale().subscribeVisibleLogicalRangeChange(onRangeChange);

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
        pendingSegRef.current = null;
        pendingPositionsRef.current = [];
        historyRef.current = [];
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
      const sr = seriesRef.current;
      if (!sr || !symbol) return;
      const fmt = getPriceFormat(symbol);
      sr.applyOptions({ priceFormat: { type: "price", precision: fmt.precision, minMove: fmt.minMove } });
      redrawCanvas();
    }, [symbol, redrawCanvas]);

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
              timeZone: settings.timezone && settings.timezone !== "local" ? settings.timezone : undefined,
            }).format(d);
          },
        },
      });
    }, [settings]);

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
        pendingSegRef.current = null;
        pendingPositionsRef.current = [];
        historyRef.current = [];
        redrawCanvas();
        notifyObjects();
        notifyState();
      },

      resetView() {
        chartRef.current?.timeScale().fitContent();
      },

      listObjects(): ChartObject[] {
        const sym = symbolRef.current;
        const out: ChartObject[] = [];
        for (const hl of hLinesRef.current) {
          out.push({ id: hl.id, kind: "hline", label: `H-Line @ ${fmtPrice(sym, hl.price)}`, price: hl.price });
        }
        for (const seg of segsRef.current) {
          out.push({
            id: seg.id,
            kind: seg.type,
            label: `${seg.type[0].toUpperCase() + seg.type.slice(1)} @ ${fmtPrice(sym, seg.p1.price)}`,
            price: seg.p1.price,
          });
        }
        for (const t of textsRef.current) {
          out.push({ id: t.id, kind: "text", label: `Text: ${t.text.slice(0, 24)}`, price: t.pos.price });
        }
        for (const pp of pendingPositionsRef.current) {
          out.push({
            id: pp.id,
            kind: pp.dir === "BUY" ? "long" : "short",
            label: `${pp.dir === "BUY" ? "Long" : "Short"} @ ${fmtPrice(sym, pp.entry)}`,
            price: pp.entry,
          });
        }
        return out;
      },

      removeObject(id: string) {
        if (removeById(id)) {
          redrawCanvas();
          notifyObjects();
          notifyState();
        }
      },

      focusObject(id: string) {
        const ch = chartRef.current;
        if (!ch) return;
        let logical: number | null = null;
        const seg = segsRef.current.find((s) => s.id === id);
        if (seg) logical = (seg.p1.logical + seg.p2.logical) / 2;
        const txt = textsRef.current.find((t) => t.id === id);
        if (txt) logical = txt.pos.logical;
        const pp = pendingPositionsRef.current.find((p) => p.id === id);
        if (pp) logical = (pp.logicalLeft + pp.logicalRight) / 2;
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
          const idx = pendingPositionsRef.current.findIndex((p) => p.id === act.id);
          if (idx >= 0) pendingPositionsRef.current.splice(idx, 1);
        }
        redrawCanvas();
        notifyObjects();
        notifyState();
      },

      applySettings(s: ChartSettings) { settingsRef.current = s; },

      getState(): PersistedState {
        return {
          hLines: hLinesRef.current.map((h) => ({ id: h.id, price: h.price })),
          segs: segsRef.current.map((s) => ({ ...s })),
          texts: textsRef.current.map((t) => ({ ...t })),
          pendings: pendingPositionsRef.current.map((p) => ({ ...p })),
        };
      },

      setState(state: PersistedState) {
        const sr = seriesRef.current;
        if (!sr) return;
        // Clear current state (without emitting persistence)
        for (const hl of hLinesRef.current) {
          try { sr.removePriceLine(hl.priceLine); } catch { /* */ }
        }
        hLinesRef.current = [];
        segsRef.current = [];
        textsRef.current = [];
        pendingPositionsRef.current = [];

        for (const h of (state.hLines ?? [])) {
          const priceLine = sr.createPriceLine({
            price: h.price, color: "#818cf8", lineWidth: 1,
            lineStyle: LineStyle.Solid, title: "", axisLabelVisible: true,
          });
          hLinesRef.current.push({ id: h.id, price: h.price, priceLine });
        }
        for (const s of (state.segs ?? [])) {
          segsRef.current.push({ ...s });
        }
        for (const t of (state.texts ?? [])) {
          textsRef.current.push({ ...t });
        }
        for (const p of (state.pendings ?? [])) {
          pendingPositionsRef.current.push({ ...p });
        }
        redrawCanvas();
        notifyObjects();
      },
    }));

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
        notifyState();
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
