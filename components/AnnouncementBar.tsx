"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
};

const LS_KEY = (id: string) => `rs_ann_dismissed_${id}`;

const TYPE_STYLES: Record<string, { bar: string; dot: string; glow: string }> = {
  info: {
    bar: "from-[#0a0a18] via-[#0d0f2a] to-[#080818]",
    dot: "#2962FF",
    glow: "rgba(41,98,255,0.5)",
  },
  warning: {
    bar: "from-[#150f00] via-[#1f1500] to-[#100a00]",
    dot: "#f59e0b",
    glow: "rgba(245,158,11,0.5)",
  },
  success: {
    bar: "from-[#001a0a] via-[#001f0d] to-[#00100a]",
    dot: "#059669",
    glow: "rgba(5,150,105,0.5)",
  },
  error: {
    bar: "from-[#1a0505] via-[#2d0f0f] to-[#0f0505]",
    dot: "#ff3c3c",
    glow: "rgba(255,60,60,0.5)",
  },
};

export function AnnouncementBar() {
  const [ann, setAnn] = useState<Announcement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => r.ok ? r.json() : null)
      .then((data: { announcement?: Announcement | null } | null) => {
        const a = data?.announcement ?? null;
        if (!a) return;
        try {
          if (localStorage.getItem(LS_KEY(a.id))) return;
        } catch { /* */ }
        setAnn(a);
        setVisible(true);
      })
      .catch(() => {});
  }, []);

  if (!visible || !ann) return null;

  function dismiss() {
    if (!ann) return;
    try { localStorage.setItem(LS_KEY(ann.id), "1"); } catch { /* */ }
    setVisible(false);
  }

  const style = TYPE_STYLES[ann.type] ?? TYPE_STYLES.info;

  return (
    <div
      className={`relative flex w-full items-center justify-center gap-3 bg-gradient-to-r px-10 py-2 text-center ${style.bar}`}
      style={{ borderBottom: `1px solid ${style.dot}30` }}
    >
      {/* Top glow line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${style.glow}, transparent)` }}
      />

      {/* Pulse dot */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
          style={{ background: style.dot }}
        />
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ background: style.dot }}
        />
      </span>

      <p
        className="font-[family-name:var(--font-mono)] text-[12px] font-medium leading-none tracking-wide text-white/90"
        style={{ textShadow: `0 0 20px ${style.glow}` }}
      >
        {ann.title && <strong className="mr-1.5">{ann.title}</strong>}
        {ann.message}
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
