"use client";

import Link from "next/link";
import { BarChart2, Calendar, Trash2, Play, LineChart } from "lucide-react";
import type { Session } from "@/lib/backtesting/types";

type Props = {
  session: Session;
  onDelete: (id: string) => void;
};

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-[#6366f1]/15 text-[#818cf8]",
  completed: "bg-[#00e676]/12 text-[#00e676]",
  paused:    "bg-[#ff8c00]/12 text-[#ff8c00]",
};

export function SessionCard({ session, onDelete }: Props) {
  const plSign = session.current_balance >= session.initial_balance ? "+" : "";
  const pl = session.current_balance - session.initial_balance;
  const plPct = session.initial_balance > 0 ? (pl / session.initial_balance) * 100 : 0;
  const isProfit = pl >= 0;

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/[0.09] hover:bg-white/[0.035]">
      {/* Symbol + TF */}
      <div className="flex flex-col gap-0.5 w-24 shrink-0">
        <span className="font-display text-sm font-bold text-white leading-none">{session.symbol}</span>
        <span className="font-mono text-[10px] text-slate-500">{session.timeframe}</span>
      </div>

      {/* Date range */}
      <div className="hidden md:flex items-center gap-1 text-slate-500 font-mono text-[11px] w-40 shrink-0">
        <Calendar className="h-3 w-3" />
        <span>{session.date_from} → {session.date_to}</span>
      </div>

      {/* P&L */}
      <div className="flex flex-col gap-0.5 w-24 shrink-0">
        <span className={`font-mono text-sm font-semibold ${isProfit ? "text-[#00e676]" : "text-[#ff3c3c]"}`}>
          {plSign}${Math.abs(pl).toFixed(0)}
        </span>
        <span className={`font-mono text-[10px] ${isProfit ? "text-[#00e676]/60" : "text-[#ff3c3c]/60"}`}>
          {plSign}{plPct.toFixed(1)}%
        </span>
      </div>

      {/* Balance */}
      <div className="hidden lg:flex flex-col gap-0.5">
        <span className="font-mono text-[11px] text-slate-400">${session.current_balance.toLocaleString()}</span>
        <span className="font-mono text-[10px] text-slate-600">balance</span>
      </div>

      {/* Status */}
      <span className={`ml-auto hidden sm:inline-flex rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium ${STATUS_STYLES[session.status] ?? "bg-white/[0.05] text-slate-500"}`}>
        {session.status}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1.5 ml-2">
        <Link
          href={`/app/backtesting/session/${session.id}/replay`}
          className="flex items-center gap-1.5 rounded-lg bg-[#6366f1]/15 px-3 py-1.5 font-mono text-[11px] text-[#818cf8] transition-all hover:bg-[#6366f1]/25"
        >
          <Play className="h-3 w-3" />
          <span className="hidden sm:block">Continue</span>
        </Link>
        <Link
          href={`/app/backtesting/session/${session.id}/results`}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] px-3 py-1.5 font-mono text-[11px] text-slate-400 transition-all hover:border-white/[0.15] hover:text-slate-200"
        >
          <LineChart className="h-3 w-3" />
          <span className="hidden sm:block">Results</span>
        </Link>
        <button
          type="button"
          onClick={() => onDelete(session.id)}
          className="rounded-lg p-1.5 text-slate-700 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
