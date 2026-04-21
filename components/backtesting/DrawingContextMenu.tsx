"use client";

import { useEffect, useRef } from "react";
import { Trash2, Target } from "lucide-react";

type Props = {
  clientX: number;
  clientY: number;
  onClose: () => void;
  onRemove: () => void;
  onFocus: () => void;
};

export function DrawingContextMenu({ clientX, clientY, onClose, onRemove, onFocus }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  const menuW = 200;
  const menuH = 90;
  const x = Math.min(clientX, window.innerWidth  - menuW - 8);
  const y = Math.min(clientY, window.innerHeight - menuH - 8);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) { if (e.code === "Escape") onClose(); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[60] rounded-lg border border-white/[0.08] bg-[#0d0d1a] py-1.5 shadow-2xl"
      style={{ left: x, top: y, width: menuW }}
    >
      <button
        type="button"
        onClick={() => { onFocus(); onClose(); }}
        className="flex w-full items-center gap-2.5 rounded px-3 py-1.5 text-left hover:bg-white/[0.07]"
      >
        <Target className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-mono text-[12px] text-slate-300">Focus drawing</span>
      </button>
      <button
        type="button"
        onClick={() => { onRemove(); onClose(); }}
        className="flex w-full items-center gap-2.5 rounded px-3 py-1.5 text-left text-red-400 hover:bg-red-500/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span className="font-mono text-[12px]">Remove drawing</span>
      </button>
    </div>
  );
}
