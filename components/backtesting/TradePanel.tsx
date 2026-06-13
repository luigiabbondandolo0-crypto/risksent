"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import { fmtPrice, calcLotSize } from "@/lib/backtesting/symbolMap";
import type { Candle } from "@/lib/backtesting/types";

type PlaceTradeBody = {
  session_id: string;
  direction: "BUY" | "SELL";
  entry_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  lot_size: number;
  entry_time: string;
};

type Props = {
  open: boolean;
  defaultDirection: "BUY" | "SELL";
  currentCandle: Candle | null;
  symbol: string;
  sessionId: string;
  /** Session initial balance — used to compute risk-% lot presets */
  initialBalance?: number;
  presetSL?: number;
  presetTP?: number;
  presetLot?: number;
  onClose: () => void;
  onTradeOpened: () => void;
  /** When set, POST /api/backtesting/trades is skipped (e.g. mock replay) */
  placeTradeOverride?: (body: PlaceTradeBody) => Promise<void>;
};

const RISK_PRESETS = [0.5, 1, 2] as const;

export function TradePanel({ open, defaultDirection, currentCandle, symbol, sessionId, initialBalance, presetSL, presetTP, presetLot, onClose, onTradeOpened, placeTradeOverride }: Props) {
  const [direction, setDirection] = useState<"BUY" | "SELL">(defaultDirection);
  const [lotSize, setLotSize] = useState("0.10");
  const [slInput, setSlInput] = useState("");
  const [tpInput, setTpInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setDirection(defaultDirection);
  }, [defaultDirection]);

  useEffect(() => {
    if (!open || !currentCandle) return;
    const price = currentCandle.close;
    const ps = pipStep(symbol);
    if (presetSL != null) {
      setSlInput(fmtPrice(symbol, presetSL));
    } else if (defaultDirection === "BUY") {
      setSlInput(fmtPrice(symbol, price - ps * 20));
    } else {
      setSlInput(fmtPrice(symbol, price + ps * 20));
    }
    if (presetTP != null) {
      setTpInput(fmtPrice(symbol, presetTP));
    } else if (defaultDirection === "BUY") {
      setTpInput(fmtPrice(symbol, price + ps * 40));
    } else {
      setTpInput(fmtPrice(symbol, price - ps * 40));
    }
    if (presetLot != null) setLotSize(String(presetLot));
    setErr("");
  }, [open, defaultDirection, currentCandle, symbol, presetSL, presetTP, presetLot]);

  const entryPrice = currentCandle?.close ?? 0;
  const sl = parseFloat(slInput) || 0;
  const tp = parseFloat(tpInput) || 0;
  const risk = sl > 0 ? Math.abs(entryPrice - sl) : 0;
  const reward = tp > 0 ? Math.abs(tp - entryPrice) : 0;
  const rr = risk > 0 ? reward / risk : 0;

  async function place() {
    if (!currentCandle) return;
    setLoading(true);
    setErr("");
    try {
      const body: PlaceTradeBody = {
        session_id: sessionId,
        direction,
        entry_price: entryPrice,
        stop_loss: sl || null,
        take_profit: tp || null,
        lot_size: parseFloat(lotSize) || 0.1,
        entry_time: new Date(currentCandle.time * 1000).toISOString(),
      };
      if (placeTradeOverride) {
        await placeTradeOverride(body);
        onTradeOpened();
        onClose();
        return;
      }
      const res = await fetch("/api/backtesting/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { setErr(json.error ?? "Failed to place trade"); return; }
      onTradeOpened();
      onClose();
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="absolute bottom-0 left-0 right-0 z-30 border-t p-4 shadow-lg"
          style={{ background: "#FFFFFF", borderColor: "#E1E3EA", boxShadow: "0 -4px 24px rgba(0,0,0,0.08)" }}
        >
          <div className="mx-auto max-w-lg">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDirection("BUY")}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 font-mono text-sm font-bold transition-all ${
                    direction === "BUY"
                      ? "bg-[#26a69a]/15 text-[#26a69a] ring-1 ring-[#26a69a]/40"
                      : "border border-slate-200 text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("SELL")}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 font-mono text-sm font-bold transition-all ${
                    direction === "SELL"
                      ? "bg-[#ef5350]/15 text-[#ef5350] ring-1 ring-[#ef5350]/40"
                      : "border border-slate-200 text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <TrendingDown className="h-3.5 w-3.5" />
                  SELL
                </button>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Risk % presets */}
            {initialBalance != null && (
              <div className="mb-3 flex items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mr-1">Risk</span>
                {RISK_PRESETS.map((pct) => {
                  const price = currentCandle?.close ?? 0;
                  const slVal = parseFloat(slInput) || 0;
                  const slDistance = slVal > 0 ? Math.abs(price - slVal) : 0;
                  const riskAmount = initialBalance * pct / 100;
                  const lots = slDistance > 0
                    ? calcLotSize(symbol, riskAmount, slDistance)
                    : null;
                  return (
                    <button
                      key={pct}
                      type="button"
                      disabled={lots == null}
                      onClick={() => { if (lots != null) setLotSize(String(lots)); }}
                      className="rounded-lg border px-2.5 py-1 font-mono text-[11px] font-medium transition-all hover:border-[#6366f1]/50 hover:text-[#6366f1] disabled:opacity-30"
                      style={{ borderColor: "#E1E3EA", color: "#6B7280" }}
                      title={lots != null ? `${lots} lots` : "Set SL first"}
                    >
                      {pct}%
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Entry price */}
              <div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">Entry</p>
                <p className="font-mono text-sm font-semibold text-slate-900">{fmtPrice(symbol, entryPrice)}</p>
              </div>

              {/* Lot size */}
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-500">Lot Size</label>
                <input
                  type="number"
                  value={lotSize}
                  onChange={(e) => setLotSize(e.target.value)}
                  min={0.01}
                  max={100}
                  step={0.01}
                  className="w-full rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-[#6366f1]/50"
                />
              </div>

              {/* Stop Loss */}
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#ef5350]">Stop Loss</label>
                <input
                  type="number"
                  value={slInput}
                  onChange={(e) => setSlInput(e.target.value)}
                  step={pipStep(symbol)}
                  className="w-full rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-sm text-slate-900 outline-none ring-1 ring-[#ef5350]/30 focus:ring-[#ef5350]/50"
                />
              </div>

              {/* Take Profit */}
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#26a69a]">Take Profit</label>
                <input
                  type="number"
                  value={tpInput}
                  onChange={(e) => setTpInput(e.target.value)}
                  step={pipStep(symbol)}
                  className="w-full rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-sm text-slate-900 outline-none ring-1 ring-[#26a69a]/30 focus:ring-[#26a69a]/50"
                />
              </div>
            </div>

            {/* R:R display */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-4 font-mono text-[11px]">
                <span className="text-slate-500">R:R</span>
                <span className={`font-semibold ${rr >= 2 ? "text-[#26a69a]" : rr >= 1 ? "text-[#ff8c00]" : "text-slate-400"}`}>
                  {rr > 0 ? `1:${rr.toFixed(2)}` : "—"}
                </span>
              </div>
              {err && <p className="font-mono text-[11px] text-red-500">{err}</p>}
              <button
                type="button"
                onClick={() => void place()}
                disabled={loading || !currentCandle}
                className={`rounded-xl px-6 py-2 font-mono text-sm font-bold transition-all disabled:opacity-50 ${
                  direction === "BUY"
                    ? "bg-[#26a69a] text-white hover:bg-[#1e8f85]"
                    : "bg-[#ef5350] text-white hover:bg-[#d32f2f]"
                }`}
              >
                {loading ? "Placing…" : `Place ${direction}`}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function pipStep(symbol: string): number {
  const s = symbol.toUpperCase();
  if (s.includes("JPY")) return 0.01;
  if (["BTCUSD"].includes(s)) return 1;
  if (["XAUUSD", "ETHUSD", "US30", "US500", "US100", "UK100", "GER40", "JPN225"].includes(s)) return 0.1;
  return 0.0001;
}
