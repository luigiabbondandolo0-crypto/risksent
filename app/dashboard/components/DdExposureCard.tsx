"use client";

/**
 * Single card: Daily DD vs limit + Current Exposure vs limit.
 * Semi-circular gauge style, bold values, clean layout.
 */
type DdExposureCardProps = {
  dailyDdPct: number | null;
  dailyLimitPct: number;
  exposurePct: number | null;
  exposureLimitPct: number;
  /** When true, show a note that values are mock/sample data */
  isMock?: boolean;
};

function gaugeColor(ratio: number): string {
  if (ratio >= 1) return "#ef4444";
  if (ratio >= 0.8) return "#f59e0b";
  return "#22c55e";
}

function SemiGauge({ valuePct, limitPct, label }: { valuePct: number | null; limitPct: number; label: string }) {
  const ratio = valuePct != null && limitPct > 0 ? Math.min(1.5, Math.abs(valuePct) / limitPct) : 0;
  const pct = Math.min(100, ratio * 100);
  const color = gaugeColor(ratio);
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</span>
      <div className="relative w-20 h-10 overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <path
            d="M 10 45 A 40 40 0 0 1 90 45"
            fill="none"
            stroke="#334155"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 10 45 A 40 40 0 0 1 90 45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 125} 125`}
            className="transition-all duration-500"
          />
        </svg>
      </div>
      <span className="text-sm font-bold text-white mt-1">
        {valuePct != null ? (
          <span className={valuePct >= 0 ? "text-emerald-400" : "text-red-400"}>
            {valuePct >= 0 ? "+" : ""}
            {valuePct.toFixed(2)}%
          </span>
        ) : (
          "—"
        )}
      </span>
      <span className="text-[10px] text-slate-500">limit {limitPct}%</span>
    </div>
  );
}

export function DdExposureCard({
  dailyDdPct,
  dailyLimitPct,
  exposurePct,
  exposureLimitPct,
  isMock
}: DdExposureCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/90 to-slate-900/90 p-5 shadow-lg">
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          Daily DD & Exposure vs limits
        </span>
        {isMock && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
            Mock data
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-end justify-around gap-6">
        <SemiGauge
          valuePct={dailyDdPct}
          limitPct={dailyLimitPct}
          label="Daily DD (today)"
        />
        <SemiGauge
          valuePct={exposurePct}
          limitPct={exposureLimitPct}
          label="Current Exposure"
        />
      </div>
    </div>
  );
}
