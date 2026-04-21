"use client";

import { useEffect, useRef, useState } from "react";
import {
  TrendingUp, TrendingDown, RotateCcw, Copy, List, Settings as SettingsIcon,
  ChevronRight, Trash2, Target, X,
} from "lucide-react";
import { fmtPrice } from "@/lib/backtesting/symbolMap";
import type { ChartObject, ChartSettings } from "./ReplayChart";
import type { Trade } from "@/lib/backtesting/types";

type Props = {
  price: number;
  clientX: number;
  clientY: number;
  symbol: string;
  objects: ChartObject[];
  openTrades: Trade[];
  settings: ChartSettings;
  onClose: () => void;
  onBuy: () => void;
  onSell: () => void;
  onResetView: () => void;
  onFocusObject: (id: string) => void;
  onRemoveObject: (id: string) => void;
  onCloseTrade: (tradeId: string) => void;
  onSettingsChange: (s: ChartSettings) => void;
};

export function ChartContextMenu({
  price, clientX, clientY, symbol,
  objects, openTrades, settings,
  onClose, onBuy, onSell, onResetView,
  onFocusObject, onRemoveObject, onCloseTrade, onSettingsChange,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"main" | "objects" | "settings">("main");

  const menuW = 280;
  const menuH = 400;
  const x = Math.min(clientX, window.innerWidth  - menuW - 8);
  const y = Math.min(clientY, window.innerHeight - menuH - 8);

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
    icon, label, sublabel, onClick, disabled, color, chevron,
  }: {
    icon: React.ReactNode;
    label: string;
    sublabel?: string;
    onClick?: () => void;
    disabled?: boolean;
    color?: string;
    chevron?: boolean;
  }) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`flex w-full items-center gap-2.5 rounded px-3 py-1.5 text-left transition-colors disabled:opacity-40 ${
          disabled ? "cursor-default" : "hover:bg-white/[0.07] active:bg-white/[0.12]"
        }`}
        style={{ color: disabled ? undefined : (color ?? "#cbd5e1") }}
      >
        <span className="shrink-0 opacity-70" style={{ color: color ?? "#94a3b8" }}>{icon}</span>
        <span className="flex-1 font-mono text-[12px]">{label}</span>
        {sublabel && <span className="font-mono text-[11px] text-slate-600">{sublabel}</span>}
        {chevron && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
      </button>
    );
  }

  function Sep() { return <div className="my-1 h-px bg-white/[0.06]" />; }

  function ColorSwatch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0" />
        <span className="font-mono text-[10px] text-slate-500">{value}</span>
      </label>
    );
  }

  function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`h-4 w-7 rounded-full transition-colors ${checked ? "bg-[#6366f1]" : "bg-white/[0.1]"}`}
      >
        <span
          className={`block h-3 w-3 rounded-full bg-white transition-transform ${checked ? "translate-x-3.5" : "translate-x-0.5"}`}
        />
      </button>
    );
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[17rem] max-h-[28rem] overflow-y-auto overflow-x-hidden rounded-lg border border-white/[0.08] bg-[#0d0d1a] py-1.5 shadow-2xl"
      style={{ left: x, top: y, width: menuW }}
    >
      {view === "main" && (
        <>
          <Item
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            label="Reset chart view"
            onClick={() => { onResetView(); onClose(); }}
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
            label={`Object tree (${objects.length + openTrades.length})`}
            onClick={() => setView("objects")}
            chevron
          />
          <Item
            icon={<SettingsIcon className="h-3.5 w-3.5" />}
            label="Settings"
            onClick={() => setView("settings")}
            chevron
          />
        </>
      )}

      {view === "objects" && (
        <>
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/[0.06]">
            <button type="button" onClick={() => setView("main")}
              className="text-slate-500 hover:text-slate-300">
              <ChevronRight className="h-3.5 w-3.5 rotate-180" />
            </button>
            <span className="font-mono text-[12px] font-bold text-slate-300">Object tree</span>
          </div>

          {objects.length === 0 && openTrades.length === 0 && (
            <p className="px-3 py-4 text-center font-mono text-[11px] text-slate-600">
              No drawings or positions
            </p>
          )}

          {openTrades.length > 0 && (
            <div>
              <p className="px-3 pt-2 pb-1 font-mono text-[10px] uppercase tracking-wider text-slate-600">
                Positions
              </p>
              {openTrades.map((t) => (
                <div key={t.id} className="group flex w-full items-center gap-2 rounded px-3 py-1.5 hover:bg-white/[0.05]">
                  <Target className="h-3.5 w-3.5 shrink-0" style={{ color: t.direction === "BUY" ? "#26a69a" : "#ef5350" }} />
                  <span className="flex-1 truncate font-mono text-[11px] text-slate-300">
                    {t.direction} {t.lot_size} @ {fmtPrice(symbol, t.entry_price)}
                  </span>
                  <button type="button"
                    onClick={() => { onCloseTrade(t.id); }}
                    className="opacity-0 group-hover:opacity-100 rounded p-1 text-slate-500 hover:bg-red-500/20 hover:text-red-400">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {objects.length > 0 && (
            <div>
              <p className="px-3 pt-2 pb-1 font-mono text-[10px] uppercase tracking-wider text-slate-600">
                Drawings
              </p>
              {objects.map((o) => (
                <div key={o.id} className="group flex w-full items-center gap-2 rounded px-3 py-1.5 hover:bg-white/[0.05]">
                  <button type="button"
                    onClick={() => { onFocusObject(o.id); onClose(); }}
                    className="flex-1 truncate text-left font-mono text-[11px] text-slate-300 hover:text-white">
                    {o.label}
                  </button>
                  <button type="button"
                    onClick={() => onRemoveObject(o.id)}
                    className="opacity-0 group-hover:opacity-100 rounded p-1 text-slate-500 hover:bg-red-500/20 hover:text-red-400">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === "settings" && (
        <>
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/[0.06]">
            <button type="button" onClick={() => setView("main")}
              className="text-slate-500 hover:text-slate-300">
              <ChevronRight className="h-3.5 w-3.5 rotate-180" />
            </button>
            <span className="font-mono text-[12px] font-bold text-slate-300">Chart settings</span>
          </div>

          <div className="space-y-2 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-slate-400">Up color</span>
              <ColorSwatch value={settings.upColor} onChange={(v) => onSettingsChange({ ...settings, upColor: v })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-slate-400">Down color</span>
              <ColorSwatch value={settings.downColor} onChange={(v) => onSettingsChange({ ...settings, downColor: v })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-slate-400">Wicks (ombre)</span>
              <Toggle checked={settings.wickVisible} onChange={(v) => onSettingsChange({ ...settings, wickVisible: v })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-slate-400">Body border</span>
              <Toggle checked={settings.borderVisible} onChange={(v) => onSettingsChange({ ...settings, borderVisible: v })} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-slate-400">Timezone</span>
              <select
                value={settings.timezone}
                onChange={(e) => onSettingsChange({ ...settings, timezone: e.target.value as "utc" | "local" })}
                className="rounded border border-white/[0.08] bg-[#0b0b14] px-2 py-1 font-mono text-[11px] text-slate-200 outline-none"
              >
                <option value="local">Local</option>
                <option value="utc">UTC</option>
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
