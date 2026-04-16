"use client";

import { useEffect, useState } from "react";
import { pipSize } from "@/lib/backtesting/forex";
import type { BtTradeDirection } from "@/lib/backtesting/btTypes";
import { bt } from "./btClasses";

type Mode = "pips" | "price";

type Props = {
  open: boolean;
  direction: BtTradeDirection;
  symbol: string;
  entryPrice: number;
  onClose: () => void;
  onConfirm: (payload: {
    lot_size: number;
    stop_loss: number;
    take_profit: number;
  }) => void;
};

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const stop_loss = resolveSl();
    const take_profit = resolveTp();
    if (!Number.isFinite(stop_loss) || !Number.isFinite(take_profit)) return;
    onConfirm({ lot_size: lot, stop_loss, take_profit });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog">
      <form
        onSubmit={submit}
        className={`${bt.card} max-w-md border-[#6366f1]/20 shadow-[#6366f1]/10 w-full`}
      >
        <h2 className="font-display text-lg font-bold text-white">
          Open {direction} @ {entryPrice.toFixed(5)}
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-mono">{symbol}</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className={bt.label}>Lot size</label>
            <input
              className={bt.input}
              type="number"
              step={0.01}
              min={0.01}
              value={lot}
              onChange={(e) => setLot(Number(e.target.value))}
            />
          </div>

          <div className="flex gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <input type="radio" checked={slMode === "pips"} onChange={() => setSlMode("pips")} />
              SL pips
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <input type="radio" checked={slMode === "price"} onChange={() => setSlMode("price")} />
              SL price
            </label>
          </div>
          {slMode === "pips" ? (
            <div>
              <label className={bt.label}>Stop loss (pips)</label>
              <input
                className={bt.input}
                type="number"
                min={1}
                value={slPips}
                onChange={(e) => setSlPips(Number(e.target.value))}
              />
            </div>
          ) : (
            <div>
              <label className={bt.label}>Stop loss (price)</label>
              <input
                className={bt.input}
                type="number"
                step="0.00001"
                value={slPrice}
                onChange={(e) => setSlPrice(Number(e.target.value))}
              />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <input type="radio" checked={tpMode === "pips"} onChange={() => setTpMode("pips")} />
              TP pips
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <input type="radio" checked={tpMode === "price"} onChange={() => setTpMode("price")} />
              TP price
            </label>
          </div>
          {tpMode === "pips" ? (
            <div>
              <label className={bt.label}>Take profit (pips)</label>
              <input
                className={bt.input}
                type="number"
                min={1}
                value={tpPips}
                onChange={(e) => setTpPips(Number(e.target.value))}
              />
            </div>
          ) : (
            <div>
              <label className={bt.label}>Take profit (price)</label>
              <input
                className={bt.input}
                type="number"
                step="0.00001"
                value={tpPrice}
                onChange={(e) => setTpPrice(Number(e.target.value))}
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={bt.btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className={
              direction === "BUY"
                ? "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00e676] to-[#00a056] px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-[#00e676]/25"
                : "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff3c3c] to-[#b91c1c] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#ff3c3c]/25"
            }
          >
            Confirm {direction}
          </button>
        </div>
      </form>
    </div>
  );
}
