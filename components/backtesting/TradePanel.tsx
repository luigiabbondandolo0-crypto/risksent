"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import { fmtPrice } from "@/lib/backtesting/symbolMap";
import type { Candle } from "@/lib/backtesting/types";

type Props = {
  open: boolean;
  defaultDirection: "BUY" | "SELL";
  currentCandle: Candle | null;
  symbol: string;
  sessionId: string;
  onClose: () => void;
  onTradeOpened: () => void;
};

export function TradePanel({ open, defaultDirection, currentCandle, symbol, sessionId, onClose, onTradeOpened }: Props) {
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
    if (defaultDirection === "BUY") {
      setSlInput(fmtPrice(symbol, price - ps * 20));
      setTpInput(fmtPrice(symbol, price + ps * 40));
    } else {
      setSlInput(fmtPrice(symbol, price + ps * 20));
      setTpInput(fmtPrice(symbol, price - ps * 40));
    }
    setErr("");
  }, [open, defaultDirection, currentCandle, symbol]);

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
      const res = await fetch("/api/backtesting/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          direction,
          entry_price: entryPrice,
          stop_loss: sl || null,
          take_profit: tp || null,
          lot_size: parseFloat(lotSize) || 0.1,
          entry_time: new Date(currentCandle.time * 1000).toISOString(),
        }),
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
          className="absolute bottom-12 left-0 right-0 z-20 border-t border-white/[0.08] bg-[#0b0b14] p-4 shadow-2xl"
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
                      ? "bg-[#00e676]/20 text-[#00e676] ring-1 ring-[#00e676]/40"
                      : "border border-white/[0.08] text-slate-500 hover:text-slate-300"
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
                      ? "bg-[#ff3c3c]/20 text-[#ff3c3c] ring-1 ring-[#ff3c3c]/40"
                      : "border border-white/[0.08] text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <TrendingDown className="h-3.5 w-3.5" />
                  SELL
                </button>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:text-slate-300">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Entry price */}
              <div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-slate-600">Entry</p>
                <p className="font-mono text-sm font-semibold text-white">{fmtPrice(symbol, entryPrice)}</p>
              </div>

              {/* Lot size */}
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">Lot Size</label>
                <input
                  type="number"
                  value={lotSize}
                  onChange={(e) => setLotSize(e.target.value)}
                  min={0.01}
                  max={100}
                  step={0.01}
                  className="w-full rounded-lg bg-white/[0.05] px-2.5 py-1.5 font-mono text-sm text-white outline-none ring-1 ring-white/[0.08] focus:ring-[#6366f1]/50"
                />
              </div>

              {/* Stop Loss */}
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#ff3c3c]/70">Stop Loss</label>
                <input
                  type="number"
                  value={slInput}
                  onChange={(e) => setSlInput(e.target.value)}
                  step={pipStep(symbol)}
                  className="w-full rounded-lg bg-white/[0.05] px-2.5 py-1.5 font-mono text-sm text-white outline-none ring-1 ring-[#ff3c3c]/20 focus:ring-[#ff3c3c]/40"
                />
              </div>

              {/* Take Profit */}
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#00e676]/70">Take Profit</label>
                <input
                  type="number"
                  value={tpInput}
                  onChange={(e) => setTpInput(e.target.value)}
                  step={pipStep(symbol)}
                  className="w-full rounded-lg bg-white/[0.05] px-2.5 py-1.5 font-mono text-sm text-white outline-none ring-1 ring-[#00e676]/20 focus:ring-[#00e676]/40"
                />
              </div>
            </div>

            {/* R:R display */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-4 font-mono text-[11px]">
                <span className="text-slate-600">R:R</span>
                <span className={`font-semibold ${rr >= 2 ? "text-[#00e676]" : rr >= 1 ? "text-[#ff8c00]" : "text-slate-400"}`}>
                  {rr > 0 ? `1:${rr.toFixed(2)}` : "—"}
                </span>
              </div>
              {err && <p className="font-mono text-[11px] text-red-400">{err}</p>}
              <button
                type="button"
                onClick={() => void place()}
                disabled={loading || !currentCandle}
                className={`rounded-xl px-6 py-2 font-mono text-sm font-bold transition-all disabled:opacity-50 ${
                  direction === "BUY"
                    ? "bg-[#00e676]/90 text-black hover:bg-[#00e676]"
                    : "bg-[#ff3c3c]/90 text-white hover:bg-[#ff3c3c]"
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
