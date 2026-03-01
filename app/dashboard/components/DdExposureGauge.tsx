"use client";

/**
 * Horizontal bar (red-green) for Daily DD and Current Exposure vs user limits.
 * Shows value % and limit (e.g. "Daily DD -0.52% vs limite 5%").
 */
type DdExposureGaugeProps = {
  label: string;
  valuePct: number | null;
  limitPct: number;
  valueLabel?: string;
  invertColors?: boolean;
};

function fillPct(value: number, limit: number, invert: boolean): number {
  if (limit <= 0) return 0;
  const pct = Math.min(100, (Math.abs(value) / limit) * 100);
  return invert ? 100 - pct : pct;
}

function barColor(value: number, limit: number, invert: boolean): string {
  if (limit <= 0) return "bg-slate-500";
  const ratio = Math.abs(value) / limit;
  if (invert) {
    if (ratio >= 1) return "bg-red-500";
    if (ratio >= 0.8) return "bg-amber-500";
    return "bg-emerald-500";
  }
  if (ratio >= 1) return "bg-red-500";
  if (ratio >= 0.8) return "bg-amber-500";
  return "bg-emerald-500";
}

export function DdExposureGauge({
  label,
  valuePct,
  limitPct,
  valueLabel,
  invertColors = false
}: DdExposureGaugeProps) {
  const displayVal = valuePct != null ? valuePct : 0;
  const pct = fillPct(displayVal, limitPct, invertColors);
  const color = barColor(displayVal, limitPct, invertColors);

  return (
    <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
        {valueLabel != null && (
          <span className="text-xs text-slate-500">{valueLabel}</span>
        )}
      </div>
      <p className="text-lg font-bold text-white mb-2">
        {valuePct != null ? (
          <span className={valuePct >= 0 ? "text-emerald-400" : "text-red-400"}>
            {valuePct >= 0 ? "+" : ""}
            {valuePct.toFixed(2)}%
          </span>
        ) : (
          "—"
        )}
        <span className="text-slate-500 font-normal text-sm ml-2">vs limite {limitPct}%</span>
      </p>
      <div className="h-2 w-full rounded-full bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}
