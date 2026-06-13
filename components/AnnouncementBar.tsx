"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

/**
 * Slim dismissible announcement bar shown above the topbar.
 *
 * Content is driven by the env var NEXT_PUBLIC_ANNOUNCEMENT.
 * Format:  "DISMISS_KEY|Message text here"
 *   - DISMISS_KEY: a short unique id (e.g. "promo-june-2025"). When you change the
 *     message change the key too so already-dismissed users see it again.
 *   - Message text: any plain text shown centered in the bar.
 *
 * Example .env:
 *   NEXT_PUBLIC_ANNOUNCEMENT=promo-june-2025|🎉 Summer deal — 20% off all plans. Use code SUMMER20 at checkout.
 *
 * Leave the var empty (or unset) to hide the bar entirely.
 */

const RAW = process.env.NEXT_PUBLIC_ANNOUNCEMENT ?? "";

function parse(raw: string): { key: string; text: string } | null {
  if (!raw.trim()) return null;
  const sep = raw.indexOf("|");
  if (sep === -1) return { key: raw.trim(), text: raw.trim() };
  const key = raw.slice(0, sep).trim();
  const text = raw.slice(sep + 1).trim();
  if (!key || !text) return null;
  return { key, text };
}

const ANNOUNCEMENT = parse(RAW);
const LS_KEY = (key: string) => `rs_ann_dismissed_${key}`;

export function AnnouncementBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ANNOUNCEMENT) return;
    try {
      const dismissed = localStorage.getItem(LS_KEY(ANNOUNCEMENT.key));
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible || !ANNOUNCEMENT) return null;

  function dismiss() {
    if (!ANNOUNCEMENT) return;
    try { localStorage.setItem(LS_KEY(ANNOUNCEMENT.key), "1"); } catch { /* */ }
    setVisible(false);
  }

  return (
    <div
      className="relative flex w-full items-center justify-center gap-3 px-10 py-2 text-center"
      style={{
        background: "linear-gradient(90deg, #1a0a0a 0%, #2d0f0f 35%, #1a0505 65%, #0f0a1a 100%)",
        borderBottom: "1px solid rgba(255,60,60,0.2)",
      }}
    >
      {/* Red glow accent line at top */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, #ff3c3c80, #ff8c0060, transparent)" }}
      />

      {/* Pulse dot */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
          style={{ background: "#ff3c3c" }}
        />
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ background: "#ff5c5c" }}
        />
      </span>

      <p
        className="font-[family-name:var(--font-mono)] text-[12px] font-medium leading-none tracking-wide text-white/90"
        style={{ textShadow: "0 0 20px rgba(255,60,60,0.3)" }}
      >
        {ANNOUNCEMENT.text}
      </p>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/40 transition-colors hover:text-white/80"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
