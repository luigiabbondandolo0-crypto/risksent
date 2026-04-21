"use client";

import { useEffect, useRef, useState } from "react";
import {
  TrendingUp, TrendingDown, RotateCcw, Copy, List, Settings as SettingsIcon,
  ChevronRight, Trash2, X,
} from "lucide-react";
import { fmtPrice } from "@/lib/backtesting/symbolMap";
import type { ChartObject, ChartSettings } from "./ReplayChart";

type Props = {
  price: number;
  clientX: number;
  clientY: number;
  symbol: string;
  objects: ChartObject[];
  settings: ChartSettings;
  onClose: () => void;
  onBuy: () => void;
  onSell: () => void;
  onResetView: () => void;
  onFocusObject: (id: string) => void;
  onRemoveObject: (id: string) => void;
  onSettingsChange: (s: ChartSettings) => void;
};

// Common timezones used by traders
const TIMEZONES: { value: string; label: string }[] = [
  { value: "local", label: "Local" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Rome", label: "Rome/Milan (CET)" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Berlin", label: "Berlin/Frankfurt" },
  { value: "Europe/Zurich", label: "Zurich" },
  { value: "Europe/Madrid", label: "Madrid" },
  { value: "Europe/Amsterdam", label: "Amsterdam" },
  { value: "Europe/Istanbul", label: "Istanbul" },
  { value: "Europe/Moscow", label: "Moscow" },
  { value: "Africa/Cairo", label: "Cairo" },
  { value: "Africa/Johannesburg", label: "Johannesburg" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Kolkata", label: "Mumbai/New Delhi" },
  { value: "Asia/Bangkok", label: "Bangkok" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Hong_Kong", label: "Hong Kong" },
  { value: "Asia/Shanghai", label: "Shanghai/Beijing" },
  { value: "Asia/Seoul", label: "Seoul" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Australia/Perth", label: "Perth" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "Pacific/Auckland", label: "Auckland" },
  { value: "America/Sao_Paulo", label: "São Paulo" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires" },
  { value: "America/New_York", label: "New York (ET)" },
  { value: "America/Chicago", label: "Chicago (CT)" },
  { value: "America/Denver", label: "Denver (MT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PT)" },
  { value: "America/Mexico_City", label: "Mexico City" },
  { value: "America/Toronto", label: "Toronto" },
  { value: "America/Vancouver", label: "Vancouver" },
  { value: "Pacific/Honolulu", label: "Honolulu" },
];

// Preset palette for candle colors
const UP_COLORS = [
  "#26a69a", "#22c55e", "#16a34a", "#10b981", "#14b8a6", "#06b6d4",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#ffffff",
];
const DOWN_COLORS = [
  "#ef5350", "#ef4444", "#dc2626", "#f43f5e", "#f97316", "#eab308",
  "#f59e0b", "#d97706", "#c2410c", "#92400e", "#78350f", "#0a0a12",
];

export function ChartContextMenu({
  price, clientX, clientY, symbol,
  objects, settings,
  onClose, onBuy, onSell, onResetView,
  onFocusObject, onRemoveObject, onSettingsChange,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"main" | "objects" | "settings">("main");
  const [colorPicker, setColorPicker] = useState<null | "up" | "down">(null);

  const menuW = 300;
  const menuH = 440;
  const x = Math.min(clientX, window.innerWidth  - menuW - 8);
  const y = Math.min(clientY, window.innerHeight - menuH - 8);

  // Close on click on the chart canvas/container (outside the menu).
  // Any mousedown inside the menu keeps it open (so color swatches etc. don't close it).
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.code === "Escape") {
        if (colorPicker) setColorPicker(null);
        else onClose();
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown",   onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown",   onKey);
    };
  }, [onClose, colorPicker]);

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

  // Custom color palette (no native picker → does not close menu on open)
  function PalettePicker({
    presets, value, onPick, onClose: onPickClose,
  }: {
    presets: string[];
    value: string;
    onPick: (v: string) => void;
    onClose: () => void;
  }) {
    const [hex, setHex] = useState(value);
    return (
      <div className="absolute right-3 top-full z-10 mt-1 w-[188px] rounded-lg border border-white/[0.1] bg-[#0d0d1a] p-2 shadow-xl">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Color</span>
          <button type="button" onClick={onPickClose}
            className="rounded p-0.5 text-slate-500 hover:bg-white/[0.05] hover:text-slate-300">
            <X className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {presets.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onPick(c)}
              className={`h-6 w-6 rounded border ${value.toLowerCase() === c.toLowerCase() ? "border-white" : "border-white/[0.1]"}`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1">
          <input
            type="text"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && /^#[0-9a-fA-F]{6}$/.test(hex)) onPick(hex);
            }}
            className="flex-1 rounded border border-white/[0.08] bg-[#0b0b14] px-1.5 py-0.5 font-mono text-[10px] text-slate-200 outline-none"
            placeholder="#RRGGBB"
          />
          <button
            type="button"
            onClick={() => { if (/^#[0-9a-fA-F]{6}$/.test(hex)) onPick(hex); }}
            className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-slate-300 hover:bg-white/[0.1]"
          >
            Apply
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 overflow-visible rounded-lg border border-white/[0.08] bg-[#0d0d1a] py-1.5 shadow-2xl"
      style={{ left: x, top: y, width: menuW, maxHeight: menuH }}
    >
      {/* Close button always visible */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-1.5 top-1.5 z-20 rounded p-1 text-slate-500 hover:bg-white/[0.05] hover:text-slate-300"
        title="Close (Esc)"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="max-h-[26rem] overflow-y-auto">
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
              label={`Object tree (${objects.length})`}
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
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-1.5">
              <button type="button" onClick={() => setView("main")}
                className="text-slate-500 hover:text-slate-300">
                <ChevronRight className="h-3.5 w-3.5 rotate-180" />
              </button>
              <span className="font-mono text-[12px] font-bold text-slate-300">Object tree</span>
            </div>

            {objects.length === 0 && (
              <p className="px-3 py-4 text-center font-mono text-[11px] text-slate-600">
                No drawings on chart
              </p>
            )}

            {objects.length > 0 && (
              <div>
                {objects.map((o) => (
                  <div key={o.id} className="group flex w-full items-center gap-2 rounded px-3 py-1.5 hover:bg-white/[0.05]">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          o.kind === "long" ? "#26a69a" :
                          o.kind === "short" ? "#ef5350" :
                          o.kind === "hline" ? "#818cf8" :
                          o.kind === "text" ? "#f59e0b" :
                          "#6366f1",
                      }}
                    />
                    <button type="button"
                      onClick={() => { onFocusObject(o.id); onClose(); }}
                      className="flex-1 truncate text-left font-mono text-[11px] text-slate-300 hover:text-white">
                      {o.label}
                    </button>
                    <button type="button"
                      onClick={() => onRemoveObject(o.id)}
                      className="rounded p-1 text-slate-500 opacity-0 hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
                      title="Remove drawing"
                    >
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
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-1.5">
              <button type="button" onClick={() => { setView("main"); setColorPicker(null); }}
                className="text-slate-500 hover:text-slate-300">
                <ChevronRight className="h-3.5 w-3.5 rotate-180" />
              </button>
              <span className="font-mono text-[12px] font-bold text-slate-300">Chart settings</span>
            </div>

            <div className="space-y-2 px-3 py-2">
              <div className="relative flex items-center justify-between">
                <span className="font-mono text-[11px] text-slate-400">Up color</span>
                <button
                  type="button"
                  onClick={() => setColorPicker(colorPicker === "up" ? null : "up")}
                  className="flex items-center gap-2 rounded border border-white/[0.08] bg-white/[0.02] px-1.5 py-0.5 hover:bg-white/[0.05]"
                >
                  <span className="h-3.5 w-3.5 rounded-sm border border-white/10" style={{ backgroundColor: settings.upColor }} />
                  <span className="font-mono text-[10px] text-slate-400">{settings.upColor}</span>
                </button>
                {colorPicker === "up" && (
                  <PalettePicker
                    presets={UP_COLORS}
                    value={settings.upColor}
                    onPick={(v) => onSettingsChange({ ...settings, upColor: v })}
                    onClose={() => setColorPicker(null)}
                  />
                )}
              </div>

              <div className="relative flex items-center justify-between">
                <span className="font-mono text-[11px] text-slate-400">Down color</span>
                <button
                  type="button"
                  onClick={() => setColorPicker(colorPicker === "down" ? null : "down")}
                  className="flex items-center gap-2 rounded border border-white/[0.08] bg-white/[0.02] px-1.5 py-0.5 hover:bg-white/[0.05]"
                >
                  <span className="h-3.5 w-3.5 rounded-sm border border-white/10" style={{ backgroundColor: settings.downColor }} />
                  <span className="font-mono text-[10px] text-slate-400">{settings.downColor}</span>
                </button>
                {colorPicker === "down" && (
                  <PalettePicker
                    presets={DOWN_COLORS}
                    value={settings.downColor}
                    onPick={(v) => onSettingsChange({ ...settings, downColor: v })}
                    onClose={() => setColorPicker(null)}
                  />
                )}
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
                  onChange={(e) => onSettingsChange({ ...settings, timezone: e.target.value })}
                  className="max-w-[168px] rounded border border-white/[0.08] bg-[#0b0b14] px-2 py-1 font-mono text-[11px] text-slate-200 outline-none"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
