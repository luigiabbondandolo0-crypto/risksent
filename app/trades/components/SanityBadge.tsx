"use client";

type SanityLevel = "green" | "yellow" | "red";

type SanityBadgeProps = {
  level: SanityLevel;
  tooltip: string;
};

const styles: Record<SanityLevel, { bg: string; ring: string }> = {
  green: { bg: "bg-emerald-500", ring: "ring-emerald-400/50" },
  yellow: { bg: "bg-amber-500", ring: "ring-amber-400/50" },
  red: { bg: "bg-red-500", ring: "ring-red-400/50" }
};

export function SanityBadge({ level, tooltip }: SanityBadgeProps) {
  const { bg, ring } = styles[level];
  return (
    <span
      className={`inline-block w-3 h-3 rounded-full ${bg} ring-2 ${ring}`}
      title={tooltip}
      aria-label={tooltip}
    />
  );
}

/** Compute sanity level for a trade (trades sorted by closeTime asc).
 *  Red: size > max_risk, revenge streak ≥3, exposure > limit.
 *  Yellow: size borderline or 2 losses streak.
 *  Green: size ok, no revenge streak.
 */
export function getSanityLevel(params: {
  consecutiveLossesBefore: number;
  riskPct: number | null;
  maxRiskPct: number;
  revengeThreshold: number;
}): { level: SanityLevel; tooltip: string } {
  const { consecutiveLossesBefore, riskPct, maxRiskPct } = params;
  const reasons: string[] = [];

  const isRedRisk = riskPct != null && maxRiskPct > 0 && riskPct > maxRiskPct;
  const isRedRevenge = consecutiveLossesBefore >= 3;
  if (isRedRevenge) reasons.push(`Revenge streak: ${consecutiveLossesBefore} losses before`);
  if (isRedRisk) reasons.push(`Risk ${riskPct!.toFixed(2)}% > limit ${maxRiskPct}%`);

  const isYellowStreak = consecutiveLossesBefore === 2;
  const isYellowRisk = riskPct != null && maxRiskPct > 0 && riskPct > maxRiskPct * 0.8 && riskPct <= maxRiskPct;
  if (isYellowStreak) reasons.push("2 consecutive losses before");
  if (isYellowRisk) reasons.push("Risk borderline");

  if (isRedRisk || isRedRevenge) {
    return { level: "red", tooltip: reasons.join(". ") || "High risk / revenge" };
  }
  if (isYellowStreak || isYellowRisk) {
    return { level: "yellow", tooltip: reasons.join(". ") || "Borderline" };
  }
  return { level: "green", tooltip: "Size within rules, no revenge streak" };
}
