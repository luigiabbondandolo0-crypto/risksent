"use client";

import { useEffect, useState } from "react";

type AlertRow = { read: boolean | null; severity: string };

type AccountHealthCardProps = {
  winRate: number | null;
  highestDdPct: number | null;
};

function healthColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

function healthBg(score: number): string {
  if (score >= 70) return "bg-emerald-500/20 border-emerald-500/40";
  if (score >= 40) return "bg-amber-500/20 border-amber-500/40";
  return "bg-red-500/20 border-red-500/40";
}

function computeHealthScore(
  winRate: number | null,
  highestDdPct: number | null,
  unread: AlertRow[]
): number {
  const wrScore = (winRate ?? 0) * 0.35;
  const ddScore = Math.max(0, 35 - (highestDdPct ?? 0) * 1.75);
  const highCount = unread.filter((a) => a.severity === "high").length;
  const mediumCount = unread.filter((a) => a.severity === "medium").length;
  const alertScore = Math.max(0, 30 - highCount * 15 - mediumCount * 5);
  return Math.round(Math.min(100, Math.max(0, wrScore + ddScore + alertScore)));
}

export function AccountHealthCard({ winRate, highestDdPct }: AccountHealthCardProps) {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);

  useEffect(() => {
    fetch("/api/alerts", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts ?? []))
      .catch(() => setAlerts([]));
  }, []);

  const unread = alerts.filter((a) => !a.read);
  const score = computeHealthScore(winRate, highestDdPct, unread);

  return (
    <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5">
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
        Account Health
      </div>
      <div className={`rounded-lg border inline-flex items-baseline gap-2 px-4 py-2.5 ${healthBg(score)}`}>
        <span className={`text-2xl font-bold ${healthColor(score)}`}>{score}</span>
        <span className="text-slate-500 text-sm">/ 100</span>
      </div>
      <p className="text-[11px] text-slate-500 mt-2">WR + DD + regole</p>
    </div>
  );
}
