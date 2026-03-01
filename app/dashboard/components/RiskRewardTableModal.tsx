"use client";

import { X } from "lucide-react";

type RiskRewardTableModalProps = {
  open: boolean;
  onClose: () => void;
};

const WIN_RATES = [20, 30, 40, 50, 60];
const RATIOS = ["1:1", "2:1", "3:1", "4:1", "5:1"];

// Profitability: at break-even, WR * R = (1-WR) so WR = 1/(1+R). 1:1 -> 50%, 2:1 -> 33.3%, 3:1 -> 25%, 4:1 -> 20%, 5:1 -> 16.7%
function getStatus(rrIndex: number, wrPct: number): "NOT PROFITABLE" | "BREAK EVEN" | "PROFITABLE" {
  const r = rrIndex + 1;
  const breakEvenWr = (1 / (1 + r)) * 100;
  if (wrPct < breakEvenWr - 2) return "NOT PROFITABLE";
  if (wrPct <= breakEvenWr + 2) return "BREAK EVEN";
  return "PROFITABLE";
}

export function RiskRewardTableModal({ open, onClose }: RiskRewardTableModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="rounded-xl border border-slate-700 bg-slate-900 shadow-xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h3 className="text-base font-semibold text-slate-100">Risk:Reward & Win Rate</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200"
            aria-label="Chiudi"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-slate-500 px-5 pt-3">
          Combinazioni ideali per essere profittevoli. Verde = profittevole, arancione = break even, rosso = non profittevole.
        </p>
        <div className="p-5 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 text-slate-400 font-medium">R:R</th>
                {WIN_RATES.map((wr) => (
                  <th key={wr} className="py-2 px-2 text-slate-400 font-medium text-center">
                    {wr}%
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RATIOS.map((ratio, rrIndex) => (
                <tr key={ratio}>
                  <td className="py-2 pr-4 text-slate-300 font-medium">{ratio}</td>
                  {WIN_RATES.map((wr) => {
                    const status = getStatus(rrIndex, wr);
                    const bg =
                      status === "PROFITABLE"
                        ? "bg-emerald-600 text-white"
                        : status === "BREAK EVEN"
                          ? "bg-amber-600 text-white"
                          : "bg-red-600 text-white";
                    return (
                      <td key={wr} className="px-2 py-1.5">
                        <span
                          className={`inline-block w-full text-center rounded px-2 py-1 text-xs font-medium ${bg}`}
                        >
                          {status === "PROFITABLE"
                            ? "PROFITABLE"
                            : status === "BREAK EVEN"
                              ? "BREAK EVEN"
                              : "NOT PROFITABLE"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
