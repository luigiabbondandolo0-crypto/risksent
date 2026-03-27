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
    <div className="rs-card p-5 sm:p-6 shadow-rs-soft">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <div className="text-base font-semibold tracking-tight text-slate-100">Daily DD & exposure</div>
          <p className="mt-0.5 text-xs text-slate-500">Compared to your rule limits</p>
        </div>
        {isMock && (
          <span className="shrink-0 rounded-md border border-amber-500/35 bg-amber-500/15 px-2 py-1 text-[10px] font-medium text-amber-200">
            Sample data
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
