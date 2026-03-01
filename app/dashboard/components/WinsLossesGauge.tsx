"use client";

/**
 * Semi-circular gauge with green/red (and blue for draws) + three pill values: wins (green), draws (blue), losses (red).
 */
type WinsLossesGaugeProps = {
  wins: number;
  losses: number;
  draws?: number;
};

export function WinsLossesGauge({ wins, losses, draws = 0 }: WinsLossesGaugeProps) {
  const total = wins + losses + draws;
  const len = 125;
  const greenLen = total > 0 ? (wins / total) * len : 0;
  const blueLen = total > 0 ? (draws / total) * len : 0;
  const redLen = total > 0 ? (losses / total) * len : 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-10 overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <path
            d="M 10 45 A 40 40 0 0 1 90 45"
            fill="none"
            stroke="#334155"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {greenLen > 0 && (
            <path
              d="M 10 45 A 40 40 0 0 1 90 45"
              fill="none"
              stroke="#22c55e"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${greenLen} ${len}`}
            />
          )}
          {blueLen > 0 && (
            <path
              d="M 10 45 A 40 40 0 0 1 90 45"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${blueLen} ${len}`}
              strokeDashoffset={-greenLen}
            />
          )}
          {redLen > 0 && (
            <path
              d="M 10 45 A 40 40 0 0 1 90 45"
              fill="none"
              stroke="#ef4444"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${redLen} ${len}`}
              strokeDashoffset={-(greenLen + blueLen)}
            />
          )}
        </svg>
      </div>
      <div className="flex gap-1.5 mt-2 flex-wrap justify-center">
        <span className="rounded-full bg-emerald-500/30 text-emerald-400 px-2 py-0.5 text-xs font-semibold">
          {wins}
        </span>
        <span className="rounded-full bg-blue-500/30 text-blue-400 px-2 py-0.5 text-xs font-semibold">
          {draws}
        </span>
        <span className="rounded-full bg-red-500/30 text-red-400 px-2 py-0.5 text-xs font-semibold">
          {losses}
        </span>
      </div>
    </div>
  );
}
