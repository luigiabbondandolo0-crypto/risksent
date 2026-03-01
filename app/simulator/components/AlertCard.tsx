"use client";

import { AlertTriangle, LucideIcon } from "lucide-react";

type AlertCardProps = {
  title: string;
  message: string;
  severity?: "info" | "warning" | "error";
  icon?: LucideIcon;
  className?: string;
};

export function AlertCard({
  title,
  message,
  severity = "warning",
  icon: Icon = AlertTriangle,
  className = ""
}: AlertCardProps) {
  const bg = severity === "error" ? "bg-red-500/10 border-red-500/30" : severity === "warning" ? "bg-amber-500/10 border-amber-500/30" : "bg-cyan-500/10 border-cyan-500/30";
  const text = severity === "error" ? "text-red-400" : severity === "warning" ? "text-amber-400" : "text-cyan-400";

  return (
    <div className={`rounded-lg border p-3 ${bg} ${className}`}>
      <div className="flex gap-2">
        <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${text}`} />
        <div>
          <p className={`text-sm font-medium ${text}`}>{title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{message}</p>
        </div>
      </div>
    </div>
  );
}
