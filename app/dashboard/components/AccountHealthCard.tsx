"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

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
  const [infoOpen, setInfoOpen] = useState(false);

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
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Account Health</span>
        <button
          type="button"
          onClick={() => setInfoOpen(true)}
          className="rounded-full p-1 text-slate-500 hover:text-cyan-400 hover:bg-slate-700/50 transition-colors"
          title="How is Account Health calculated?"
          aria-label="Info"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <div className={`rounded-lg border inline-flex items-baseline gap-2 px-4 py-2.5 mt-2 ${healthBg(score)}`}>
        <span className={`text-2xl font-bold ${healthColor(score)}`}>{score}</span>
        <span className="text-slate-500 text-sm">/ 100</span>
      </div>

      {infoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setInfoOpen(false)}>
          <div
            className="rounded-xl border border-slate-700 bg-slate-900 shadow-xl w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-slate-100">How Account Health is calculated</h3>
              <button type="button" onClick={() => setInfoOpen(false)} className="p-1 rounded text-slate-400 hover:text-slate-200" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-300 mb-3">
              Account Health (0–100) is updated from three factors:
            </p>
            <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside">
              <li><strong className="text-slate-200">Win rate</strong> — up to 35 points (higher WR = more points)</li>
              <li><strong className="text-slate-200">Drawdown</strong> — up to 35 points (lower max DD = more points)</li>
              <li><strong className="text-slate-200">Rules compliance</strong> — up to 30 points (fewer unread alerts = more points; high-severity alerts reduce the score more)</li>
            </ul>
            <p className="text-xs text-slate-500 mt-3">
              The score refreshes when dashboard stats or alerts are loaded.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
