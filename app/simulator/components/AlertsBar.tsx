"use client";

import { AlertTriangle, ShieldOff } from "lucide-react";

export type ImminentAlert = {
  id: string;
  message: string;
  severity: "warning" | "error";
};

type AlertsBarProps = {
  alerts: ImminentAlert[];
  onBlockTrading?: () => void;
  className?: string;
};

/**
 * Red/warning bar at bottom with imminent risks. Optional "Blocca trading 24h" button.
 */
export function AlertsBar({ alerts, onBlockTrading, className = "" }: AlertsBarProps) {
  if (alerts.length === 0) return null;

  return (
    <div
      className={`rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${className}`}
    >
      <div className="flex flex-wrap items-start gap-2">
        <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          {alerts.map((a) => (
            <p key={a.id} className="text-sm text-red-200">
              {a.message}
            </p>
          ))}
        </div>
      </div>
      {onBlockTrading && (
        <button
          type="button"
          onClick={onBlockTrading}
          className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/50 bg-red-500/20 text-red-200 text-sm font-medium hover:bg-red-500/30 transition-colors"
        >
          <ShieldOff className="h-4 w-4" />
          Blocca trading 24h
        </button>
      )}
    </div>
  );
}
