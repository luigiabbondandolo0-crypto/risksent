"use client";

import { useEffect, useRef } from "react";
import { Trash2, Target, ShoppingCart } from "lucide-react";

type Props = {
  clientX: number;
  clientY: number;
  onClose: () => void;
  onRemove: () => void;
  onFocus: () => void;
  /** If provided, shows a "Place order" button (for long/short drawings) */
  onPlaceOrder?: () => void;
};

export function DrawingContextMenu({ clientX, clientY, onClose, onRemove, onFocus, onPlaceOrder }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  const menuW = 200;
  const menuH = onPlaceOrder ? 120 : 88;
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
      className="fixed z-[60] rounded-lg border py-1.5 shadow-lg"
      style={{ left: x, top: y, width: menuW, background: "#FFFFFF", borderColor: "#E1E3EA" }}
    >
      {onPlaceOrder && (
        <button
          type="button"
          onClick={() => { onPlaceOrder(); onClose(); }}
          className="flex w-full items-center gap-2.5 rounded px-3 py-1.5 text-left transition-colors hover:bg-slate-50"
        >
          <ShoppingCart className="h-3.5 w-3.5 text-[#2962FF]" />
          <span className="font-mono text-[12px] text-slate-700 font-semibold">Place order</span>
        </button>
      )}
      <button
        type="button"
        onClick={() => { onFocus(); onClose(); }}
        className="flex w-full items-center gap-2.5 rounded px-3 py-1.5 text-left transition-colors hover:bg-slate-50"
      >
        <Target className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-mono text-[12px] text-slate-600">Focus drawing</span>
      </button>
      <button
        type="button"
        onClick={() => { onRemove(); onClose(); }}
        className="flex w-full items-center gap-2.5 rounded px-3 py-1.5 text-left text-red-500 transition-colors hover:bg-red-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span className="font-mono text-[12px]">Remove drawing</span>
      </button>
    </div>
  );
}
