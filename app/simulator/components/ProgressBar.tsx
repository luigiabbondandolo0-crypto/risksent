"use client";

/**
 * Reusable progress bar for profit target, daily DD, max DD.
 * value/limit can be negative (loss) or positive (profit); bar color reflects status.
 */
type ProgressBarProps = {
  label: string;
  value: number;
  limit: number;
  /** "profit" = green when value >= limit, red when below; "loss" = green when |value| <= limit, red when over */
  variant: "profit" | "loss";
  valueLabel?: string;
  limitLabel?: string;
  className?: string;
};

export function ProgressBar({
  label,
  value,
  limit,
  variant,
  valueLabel,
  limitLabel,
  className = ""
}: ProgressBarProps) {
  const isProfit = variant === "profit";
  // Profit: fill from 0 to value, cap at limit for display; good when value >= limit
  // Loss: we show how much of the loss "budget" is used (e.g. worst_daily_pct -2.5% vs limit 5%); good when value >= -limit
  const numericLimit = Math.abs(limit);
  const numericValue = isProfit ? Math.abs(value) : (value <= 0 ? Math.min(numericLimit, -value) : 0);

  let pct = 0;
  if (isProfit) {
    pct = limit > 0 ? Math.min(100, (value / limit) * 100) : 0;
  } else {
    // loss: 0% = no drawdown, 100% = at limit (e.g. -5% daily)
    pct = numericLimit > 0 ? Math.min(100, (numericValue / numericLimit) * 100) : 0;
  }

  const isGood = isProfit ? value >= limit : value >= -numericLimit; // loss: good if worst_daily > -5%
  const isWarning = !isGood && (isProfit ? value >= limit * 0.5 : numericValue < numericLimit * 1.2);
  const barColor = isGood ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-red-500";

  return (
    <div className={className}>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300">
          {valueLabel ?? `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`}
          {limitLabel !== undefined ? ` / ${limitLabel}` : ` / ${limit}%`}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  );
}
