"use client";

import { useEffect, useState } from "react";
import { X, TrendingUp, TrendingDown, Shield, Target } from "lucide-react";
import { pipSize } from "@/lib/backtesting/forex";
import type { BtTradeDirection } from "@/lib/backtesting/btTypes";

type Mode = "pips" | "price";

type Props = {
  open: boolean;
  direction: BtTradeDirection;
  symbol: string;
  entryPrice: number;
  onClose: () => void;
  onConfirm: (payload: { lot_size: number; stop_loss: number; take_profit: number }) => void;
};

function fmt5(n: number): string {
  if (n >= 100) return n.toFixed(2);
  if (n >= 10) return n.toFixed(3);
  return n.toFixed(5);
}

export function TradeOpenModal({ open, direction, symbol, entryPrice, onClose, onConfirm }: Props) {
  const [lot, setLot] = useState(0.1);
  const [slMode, setSlMode] = useState<Mode>("pips");
  const [tpMode, setTpMode] = useState<Mode>("pips");
  const [slPips, setSlPips] = useState(20);
  const [tpPips, setTpPips] = useState(40);
  const [slPrice, setSlPrice] = useState(entryPrice);
  const [tpPrice, setTpPrice] = useState(entryPrice);

  useEffect(() => {
    if (!open) return;
    setSlPrice(entryPrice);
    setTpPrice(entryPrice);
  }, [open, entryPrice]);

  if (!open) return null;

  const pip = pipSize(symbol);

  const resolveSl = () => {
    if (slMode === "price") return slPrice;
    return direction === "BUY" ? entryPrice - slPips * pip : entryPrice + slPips * pip;
  };

  const resolveTp = () => {
    if (tpMode === "price") return tpPrice;
    return direction === "BUY" ? entryPrice + tpPips * pip : entryPrice - tpPips * pip;
  };

  const sl = resolveSl();
  const tp = resolveTp();
  const rr = Math.abs(tp - entryPrice) > 0 && Math.abs(sl - entryPrice) > 0
    ? (Math.abs(tp - entryPrice) / Math.abs(sl - entryPrice)).toFixed(2)
    : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const stop_loss = resolveSl();
    const take_profit = resolveTp();
    if (!Number.isFinite(stop_loss) || !Number.isFinite(take_profit)) return;
    onConfirm({ lot_size: lot, stop_loss, take_profit });
  };

  const isBuy = direction === "BUY";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0d0d15] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${
              isBuy ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
            }`}>
              {isBuy ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white">
                Open {direction}
              </h2>
              <p className="text-[11px] font-mono text-slate-500">
                {symbol} @ {fmt5(entryPrice)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Lot size */}
          <div>
            <label className="mb-1.5 block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
              Lot size
            </label>
            <div className="flex items-center gap-2">
              {[0.01, 0.1, 0.5, 1].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLot(l)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-mono transition-colors ${
                    lot === l
                      ? "bg-[#6366f1]/20 text-[#818cf8] border border-[#6366f1]/30"
                      : "border border-white/[0.07] text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {l}
                </button>
              ))}
              <input
                className="flex-1 min-w-0 rounded-xl border border-white/[0.08] bg-[#0c0c0e] px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-[#6366f1]/40 focus:ring-2 focus:ring-[#6366f1]/20 font-mono"
                type="number"
                step={0.01}
                min={0.01}
                value={lot}
                onChange={(e) => setLot(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Stop loss */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                <Shield className="h-3 w-3 text-red-400/70" />
                Stop loss
              </label>
              <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] p-0.5">
                {(["pips", "price"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSlMode(m)}
                    className={`rounded-md px-2 py-0.5 text-[10px] font-mono transition-colors ${
                      slMode === m ? "bg-white/[0.08] text-slate-200" : "text-slate-600 hover:text-slate-400"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            {slMode === "pips" ? (
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-red-500/20 bg-[#0c0c0e] px-3 py-2 text-sm text-slate-100 outline-none focus:border-red-500/40 focus:ring-2 focus:ring-red-500/10 font-mono"
                  type="number"
                  min={1}
                  value={slPips}
                  onChange={(e) => setSlPips(Number(e.target.value))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">pips</span>
              </div>
            ) : (
              <input
                className="w-full rounded-xl border border-red-500/20 bg-[#0c0c0e] px-3 py-2 text-sm text-slate-100 outline-none focus:border-red-500/40 focus:ring-2 focus:ring-red-500/10 font-mono"
                type="number"
                step="0.00001"
                value={slPrice}
                onChange={(e) => setSlPrice(Number(e.target.value))}
              />
            )}
            <p className="mt-1 text-[10px] font-mono text-red-400/60">
              SL @ {fmt5(sl)}
            </p>
          </div>

          {/* Take profit */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                <Target className="h-3 w-3 text-emerald-400/70" />
                Take profit
              </label>
              <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] p-0.5">
                {(["pips", "price"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTpMode(m)}
                    className={`rounded-md px-2 py-0.5 text-[10px] font-mono transition-colors ${
                      tpMode === m ? "bg-white/[0.08] text-slate-200" : "text-slate-600 hover:text-slate-400"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            {tpMode === "pips" ? (
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-emerald-500/20 bg-[#0c0c0e] px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 font-mono"
                  type="number"
                  min={1}
                  value={tpPips}
                  onChange={(e) => setTpPips(Number(e.target.value))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">pips</span>
              </div>
            ) : (
              <input
                className="w-full rounded-xl border border-emerald-500/20 bg-[#0c0c0e] px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 font-mono"
                type="number"
                step="0.00001"
                value={tpPrice}
                onChange={(e) => setTpPrice(Number(e.target.value))}
              />
            )}
            <p className="mt-1 text-[10px] font-mono text-emerald-400/60">
              TP @ {fmt5(tp)}{rr ? ` · R:R ${rr}` : ""}
            </p>
          </div>

          {/* R:R summary */}
          {rr && (
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm font-mono">
              <span className="text-slate-500">Risk:Reward</span>
              <span className={`font-bold ${parseFloat(rr) >= 2 ? "text-emerald-400" : parseFloat(rr) >= 1 ? "text-amber-400" : "text-red-400"}`}>
                1 : {rr}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-white/[0.06] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 text-sm font-medium text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
              isBuy
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-black hover:opacity-95 shadow-lg shadow-emerald-500/20"
                : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:opacity-95 shadow-lg shadow-red-500/20"
            }`}
          >
            Confirm {direction}
          </button>
        </div>
      </form>
    </div>
  );
}
