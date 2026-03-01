"use client";

/**
 * Semi-circle gauge for DD or probability. 0–100 scale.
 * Colors: green 0–33, yellow 33–66, red 66–100 for "risk"; inverted for "probability".
 */
type GaugeProps = {
  value: number;
  max?: number;
  label: string;
  /** "probability" = green when high; "risk" = green when low */
  variant?: "probability" | "risk";
  className?: string;
};

export function Gauge({
  value,
  max = 100,
  label,
  variant = "probability",
  className = ""
}: GaugeProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const deg = (pct / 100) * 180; // half circle

  const getColor = () => {
    if (variant === "probability") {
      if (pct >= 60) return "text-emerald-400";
      if (pct >= 30) return "text-amber-400";
      return "text-red-400";
    }
    if (pct <= 33) return "text-emerald-400";
    if (pct <= 66) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-24 h-14">
        {/* background arc */}
        <svg className="w-full h-full" viewBox="0 0 100 50">
          <path
            d="M 5 45 A 45 45 0 0 1 95 45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-800"
          />
          <path
            d="M 5 45 A 45 45 0 0 1 95 45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${(deg / 180) * 141} 141`}
            className={getColor()}
          />
        </svg>
        <span
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 text-lg font-semibold tabular-nums ${getColor()}`}
        >
          {Math.round(value)}%
        </span>
      </div>
      <span className="text-xs text-slate-500 mt-1">{label}</span>
    </div>
  );
}
