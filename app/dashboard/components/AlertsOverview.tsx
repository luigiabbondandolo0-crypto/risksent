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
  onRefresh?: () => void;
};

export function AlertsOverview({ onRefresh }: AlertsOverviewProps) {
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

  return (
    <section className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 space-y-4">
      <h2 className="text-sm font-semibold text-slate-200">Imminent alerts</h2>

      {loading ? (
        <p className="text-xs text-slate-500">Loading alerts…</p>
      ) : pending.length === 0 ? (
        <p className="text-xs text-slate-500">No pending alerts. All under control.</p>
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
                  Solution: <span className="text-cyan-300">{a.solution}</span>
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
          See all alerts →
        </Link>
      )}
    </section>
  );
}
