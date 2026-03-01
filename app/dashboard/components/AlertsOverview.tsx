"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

type AlertRow = {
  id: string;
  message: string;
  severity: string;
  solution: string | null;
  alert_date: string;
  read: boolean | null;
  rule_type?: string | null;
};

type AlertsOverviewProps = {
  /** If provided, health score is computed from WR + DD + pending alerts; otherwise show null */
  winRate: number | null;
  highestDdPct: number | null;
  onRefresh?: () => void;
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

/** Account Health 0-100 from WR + DD + unread alerts (rules compliance). */
function computeHealthScore(
  winRate: number | null,
  highestDdPct: number | null,
  pending: AlertRow[]
): number {
  const wrScore = (winRate ?? 0) * 0.35;
  const ddScore = Math.max(0, 35 - (highestDdPct ?? 0) * 1.75);
  const highCount = pending.filter((a) => a.severity === "high").length;
  const mediumCount = pending.filter((a) => a.severity === "medium").length;
  const alertScore = Math.max(0, 30 - highCount * 15 - mediumCount * 5);
  return Math.round(Math.min(100, Math.max(0, wrScore + ddScore + alertScore)));
}

export function AlertsOverview({ winRate, highestDdPct, onRefresh }: AlertsOverviewProps) {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/alerts", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.alerts ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [onRefresh]);

  const pending = alerts.filter((a) => !a.read).slice(0, 3);
  const score = computeHealthScore(winRate, highestDdPct, alerts.filter((a) => !a.read));

  return (
    <section className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Alert imminenti / Sanity overview</h2>
        <div className={`rounded-lg border px-3 py-1.5 ${healthBg(score)}`}>
            <span className="text-xs text-slate-400 mr-2">Account Health</span>
            <span className={`text-lg font-bold ${healthColor(score)}`}>{score}</span>
            <span className="text-slate-500 text-sm">/100</span>
          </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500">Caricamento alert…</p>
      ) : pending.length === 0 ? (
        <p className="text-xs text-slate-500">Nessun alert pendente. Tutto sotto controllo.</p>
      ) : (
        <ul className="space-y-3">
          {pending.map((a) => (
            <li
              key={a.id}
              className={`rounded-lg border p-3 ${
                a.severity === "high"
                  ? "border-red-500/40 bg-red-500/10"
                  : "border-amber-500/40 bg-amber-500/10"
              }`}
            >
              <p className="text-sm font-medium text-slate-200 flex items-start gap-2">
                <AlertTriangle
                  className={`h-4 w-4 shrink-0 mt-0.5 ${
                    a.severity === "high" ? "text-red-400" : "text-amber-400"
                  }`}
                />
                {a.message}
              </p>
              {a.solution && (
                <p className="text-xs text-slate-400 mt-1 ml-6">
                  Soluzione: <span className="text-cyan-300">{a.solution}</span>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {alerts.length > 0 && (
        <Link
          href="/rules#alerts"
          className="inline-block text-xs font-medium text-cyan-400 hover:text-cyan-300"
        >
          Vedi tutti gli alert →
        </Link>
      )}
    </section>
  );
}
