"use client";

import { X } from "lucide-react";
import { fmtPrice } from "@/lib/backtesting/symbolMap";
import type { Trade, Candle } from "@/lib/backtesting/types";

type Props = {
  trades: Trade[];
  currentCandle: Candle | null;
  onClose: (tradeId: string, exitPrice: number, exitTime: string) => void;
  closing: string | null;
};

export function OpenPositions({ trades, currentCandle, onClose, closing }: Props) {
  const open = trades.filter((t) => t.status === "open");

  if (open.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="font-mono text-sm text-slate-700">No open positions</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full font-mono text-[12px]">
        <thead>
          <tr className="border-b border-white/[0.05] text-left">
            <th className="pb-2 pr-4 font-medium text-slate-600">Dir</th>
            <th className="pb-2 pr-4 font-medium text-slate-600">Entry</th>
            <th className="pb-2 pr-4 font-medium text-slate-600">Current</th>
            <th className="pb-2 pr-4 font-medium text-slate-600">SL</th>
            <th className="pb-2 pr-4 font-medium text-slate-600">TP</th>
            <th className="pb-2 pr-4 font-medium text-slate-600">P&L</th>
            <th className="pb-2 font-medium text-slate-600" />
          </tr>
        </thead>
        <tbody>
          {open.map((t) => {
            const current = currentCandle?.close ?? t.entry_price;
            const dirMult = t.direction === "BUY" ? 1 : -1;
            const diff = (current - t.entry_price) * dirMult;
            const isProfit = diff >= 0;

            return (
              <tr key={t.id} className="border-b border-white/[0.03]">
                <td className="py-2 pr-4">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${t.direction === "BUY" ? "bg-[#00e676]/15 text-[#00e676]" : "bg-[#ff3c3c]/15 text-[#ff3c3c]"}`}>
                    {t.direction}
                  </span>
                </td>
                <td className="py-2 pr-4 text-slate-300">{fmtPrice(t.symbol, t.entry_price)}</td>
                <td className="py-2 pr-4 text-slate-200">{fmtPrice(t.symbol, current)}</td>
                <td className="py-2 pr-4 text-[#ff3c3c]/70">{t.stop_loss != null ? fmtPrice(t.symbol, t.stop_loss) : "—"}</td>
                <td className="py-2 pr-4 text-[#00e676]/70">{t.take_profit != null ? fmtPrice(t.symbol, t.take_profit) : "—"}</td>
                <td className={`py-2 pr-4 font-semibold ${isProfit ? "text-[#00e676]" : "text-[#ff3c3c]"}`}>
                  {isProfit ? "+" : ""}
                  {(diff * t.lot_size * 100000 / 10000).toFixed(2)}
                </td>
                <td className="py-2">
                  <button
                    type="button"
                    disabled={closing === t.id || !currentCandle}
                    onClick={() => {
                      if (!currentCandle) return;
                      onClose(t.id, currentCandle.close, new Date(currentCandle.time * 1000).toISOString());
                    }}
                    className="flex items-center gap-1 rounded-lg bg-white/[0.05] px-2.5 py-1 text-slate-400 transition-all hover:bg-white/[0.1] hover:text-white disabled:opacity-40"
                  >
                    <X className="h-3 w-3" />
                    Close
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
