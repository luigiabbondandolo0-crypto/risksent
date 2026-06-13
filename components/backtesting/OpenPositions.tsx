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
        <p className="font-mono text-sm text-slate-500">No open positions</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full font-mono text-[12px]">
        <thead>
          <tr className="border-b text-left" style={{ borderColor: "#E1E3EA" }}>
            <th className="pb-2 pr-4 font-medium text-slate-500">Dir</th>
            <th className="pb-2 pr-4 font-medium text-slate-500">Entry</th>
            <th className="pb-2 pr-4 font-medium text-slate-500">Current</th>
            <th className="pb-2 pr-4 font-medium text-slate-500">SL</th>
            <th className="pb-2 pr-4 font-medium text-slate-500">TP</th>
            <th className="pb-2 pr-4 font-medium text-slate-500">P&L</th>
            <th className="pb-2 font-medium text-slate-500" />
          </tr>
        </thead>
        <tbody>
          {open.map((t) => {
            const current = currentCandle?.close ?? t.entry_price;
            const dirMult = t.direction === "BUY" ? 1 : -1;
            const diff = (current - t.entry_price) * dirMult;
            const isProfit = diff >= 0;
            const plValue = diff * (t.lot_size ?? 0.1) * 10000;

            return (
              <tr key={t.id} className="border-b" style={{ borderColor: "#F1F3F8" }}>
                <td className="py-2 pr-4">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${t.direction === "BUY" ? "bg-[#26a69a]/15 text-[#26a69a]" : "bg-[#ef5350]/15 text-[#ef5350]"}`}>
                    {t.direction}
                  </span>
                </td>
                <td className="py-2 pr-4 text-slate-700">{fmtPrice(t.symbol, t.entry_price)}</td>
                <td className="py-2 pr-4 font-semibold text-slate-900">{fmtPrice(t.symbol, current)}</td>
                <td className="py-2 pr-4 text-[#ef5350]">{t.stop_loss != null ? fmtPrice(t.symbol, t.stop_loss) : "—"}</td>
                <td className="py-2 pr-4 text-[#26a69a]">{t.take_profit != null ? fmtPrice(t.symbol, t.take_profit) : "—"}</td>
                <td className={`py-2 pr-4 font-semibold tabular-nums ${isProfit ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                  {isProfit ? "+" : ""}{plValue.toFixed(2)}
                </td>
                <td className="py-2">
                  <button
                    type="button"
                    disabled={closing === t.id || !currentCandle}
                    onClick={() => {
                      if (!currentCandle) return;
                      onClose(t.id, currentCandle.close, new Date(currentCandle.time * 1000).toISOString());
                    }}
                    className="flex items-center gap-1 rounded-lg border px-2.5 py-1 font-mono text-[11px] text-slate-600 transition-all hover:border-slate-300 hover:text-slate-900 disabled:opacity-40"
                    style={{ borderColor: "#E1E3EA" }}
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
