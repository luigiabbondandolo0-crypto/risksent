"use client";

import { useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, RotateCcw, Copy, List, Layout, Settings } from "lucide-react";
import { fmtPrice } from "@/lib/backtesting/symbolMap";

type Props = {
  price: number;
  clientX: number;
  clientY: number;
  symbol: string;
  onClose: () => void;
  onBuy: () => void;
  onSell: () => void;
  onResetView: () => void;
};

export function ChartContextMenu({ price, clientX, clientY, symbol, onClose, onBuy, onSell, onResetView }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Adjust position so menu doesn't overflow viewport
  const menuW = 208;
  const menuH = 300;
  const x = Math.min(clientX, window.innerWidth  - menuW - 8);
  const y = Math.min(clientY, window.innerHeight - menuH - 8);

  // Close on outside click or Escape
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.code === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown",   onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown",   onKey);
    };
  }, [onClose]);

  function Item({
    icon,
    label,
    sublabel,
    onClick,
    disabled,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    sublabel?: string;
    onClick?: () => void;
    disabled?: boolean;
    color?: string;
  }) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`flex w-full items-center gap-2.5 rounded px-3 py-1.5 text-left transition-colors disabled:opacity-40 ${
          disabled
            ? "cursor-default"
            : "hover:bg-white/[0.07] active:bg-white/[0.12]"
        }`}
        style={{ color: disabled ? undefined : (color ?? "#cbd5e1") }}
      >
        <span className="shrink-0 opacity-70" style={{ color: color ?? "#94a3b8" }}>{icon}</span>
        <span className="flex-1 font-mono text-[12px]">{label}</span>
        {sublabel && (
          <span className="font-mono text-[11px] text-slate-600">{sublabel}</span>
        )}
      </button>
    );
  }

  function Sep() {
    return <div className="my-1 h-px bg-white/[0.06]" />;
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[13rem] overflow-hidden rounded-lg border border-white/[0.08] bg-[#0d0d1a] py-1.5 shadow-2xl"
      style={{ left: x, top: y }}
    >
      <Item
        icon={<RotateCcw className="h-3.5 w-3.5" />}
        label="Reset chart view"
        onClick={onResetView}
      />
      <Item
        icon={<Copy className="h-3.5 w-3.5" />}
        label="Copy price"
        sublabel={fmtPrice(symbol, price)}
        onClick={() => {
          void navigator.clipboard.writeText(fmtPrice(symbol, price));
          onClose();
        }}
      />
      <Sep />
      <Item
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        label="Buy at market"
        color="#26a69a"
        onClick={onBuy}
      />
      <Item
        icon={<TrendingDown className="h-3.5 w-3.5" />}
        label="Sell at market"
        color="#ef5350"
        onClick={onSell}
      />
      <Sep />
      <Item
        icon={<List className="h-3.5 w-3.5" />}
        label="Object tree"
        disabled
      />
      <Item
        icon={<Layout className="h-3.5 w-3.5" />}
        label="Chart template"
        disabled
      />
      <Item
        icon={<Settings className="h-3.5 w-3.5" />}
        label="Settings"
        disabled
      />
    </div>
  );
}
