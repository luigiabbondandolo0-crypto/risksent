"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      theme="dark"
      toastOptions={{
        style: {
          background: "rgba(13,13,24,0.95)",
          border: "1px solid rgba(99,102,241,0.25)",
          backdropFilter: "blur(20px)",
          color: "#E8E9F5",
          fontFamily: "var(--font-mono), monospace",
          fontSize: "13px",
          borderRadius: "12px",
          boxShadow:
            "0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
        },
        classNames: {
          title: "font-semibold text-slate-100",
          description: "text-slate-400 text-xs mt-0.5",
          actionButton:
            "bg-indigo-500 text-white text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-indigo-400 transition-colors",
          cancelButton:
            "text-slate-500 text-xs font-medium hover:text-slate-300 transition-colors",
          success: "border-emerald-500/25",
          error: "border-red-500/25",
          warning: "border-amber-500/25",
          info: "border-indigo-500/25",
        },
      }}
    />
  );
}
