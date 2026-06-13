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
  // Europe
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Lisbon", label: "Lisbon" },
  { value: "Europe/Dublin", label: "Dublin" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Rome", label: "Rome/Milan (CET)" },
  { value: "Europe/Berlin", label: "Berlin/Frankfurt" },
  { value: "Europe/Zurich", label: "Zurich" },
  { value: "Europe/Madrid", label: "Madrid" },
  { value: "Europe/Amsterdam", label: "Amsterdam" },
  { value: "Europe/Brussels", label: "Brussels" },
  { value: "Europe/Vienna", label: "Vienna" },
  { value: "Europe/Warsaw", label: "Warsaw" },
  { value: "Europe/Prague", label: "Prague" },
  { value: "Europe/Budapest", label: "Budapest" },
  { value: "Europe/Bucharest", label: "Bucharest" },
  { value: "Europe/Athens", label: "Athens" },
  { value: "Europe/Helsinki", label: "Helsinki" },
  { value: "Europe/Stockholm", label: "Stockholm" },
  { value: "Europe/Oslo", label: "Oslo" },
  { value: "Europe/Copenhagen", label: "Copenhagen" },
  { value: "Europe/Istanbul", label: "Istanbul" },
  { value: "Europe/Moscow", label: "Moscow" },
  { value: "Europe/Kiev", label: "Kyiv" },
  // Africa
  { value: "Africa/Cairo", label: "Cairo" },
  { value: "Africa/Lagos", label: "Lagos" },
  { value: "Africa/Nairobi", label: "Nairobi" },
  { value: "Africa/Johannesburg", label: "Johannesburg" },
  { value: "Africa/Casablanca", label: "Casablanca" },
  // Middle East
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Riyadh", label: "Riyadh" },
  { value: "Asia/Kuwait", label: "Kuwait" },
  { value: "Asia/Qatar", label: "Qatar" },
  { value: "Asia/Bahrain", label: "Bahrain" },
  { value: "Asia/Jerusalem", label: "Jerusalem" },
  { value: "Asia/Tehran", label: "Tehran" },
  // Asia
  { value: "Asia/Kolkata", label: "Mumbai/New Delhi (IST)" },
  { value: "Asia/Karachi", label: "Karachi (PKT)" },
  { value: "Asia/Dhaka", label: "Dhaka (BST)" },
  { value: "Asia/Colombo", label: "Colombo" },
  { value: "Asia/Kathmandu", label: "Kathmandu" },
  { value: "Asia/Bangkok", label: "Bangkok (ICT)" },
  { value: "Asia/Jakarta", label: "Jakarta (WIB)" },
  { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)" },
  { value: "Asia/Shanghai", label: "Shanghai/Beijing (CST)" },
  { value: "Asia/Taipei", label: "Taipei" },
  { value: "Asia/Seoul", label: "Seoul (KST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Vladivostok", label: "Vladivostok" },
  // Australia & Pacific
  { value: "Australia/Perth", label: "Perth (AWST)" },
  { value: "Australia/Darwin", label: "Darwin (ACST)" },
  { value: "Australia/Adelaide", label: "Adelaide (ACST)" },
  { value: "Australia/Brisbane", label: "Brisbane (AEST)" },
  { value: "Australia/Sydney", label: "Sydney/Melbourne (AEDT)" },
  { value: "Pacific/Auckland", label: "Auckland (NZST)" },
  { value: "Pacific/Honolulu", label: "Honolulu (HST)" },
  { value: "Pacific/Fiji", label: "Fiji" },
  // Americas
  { value: "America/Sao_Paulo", label: "São Paulo (BRT)" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (ART)" },
  { value: "America/Santiago", label: "Santiago (CLT)" },
  { value: "America/Lima", label: "Lima (PET)" },
  { value: "America/Bogota", label: "Bogotá (COT)" },
  { value: "America/Caracas", label: "Caracas (VET)" },
  { value: "America/Mexico_City", label: "Mexico City (CST)" },
  { value: "America/New_York", label: "New York (ET)" },
  { value: "America/Chicago", label: "Chicago (CT)" },
  { value: "America/Denver", label: "Denver (MT)" },
  { value: "America/Phoenix", label: "Phoenix (MST)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PT)" },
  { value: "America/Anchorage", label: "Anchorage (AKT)" },
  { value: "America/Toronto", label: "Toronto" },
  { value: "America/Vancouver", label: "Vancouver" },
  { value: "America/Montreal", label: "Montréal" },
  { value: "America/Halifax", label: "Halifax (AT)" },
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
          disabled ? "cursor-default" : "hover:bg-slate-50 active:bg-slate-100"
        }`}
        style={{ color: disabled ? undefined : (color ?? "#374151") }}
      >
        <span className="shrink-0 opacity-70" style={{ color: color ?? "#6B7280" }}>{icon}</span>
        <span className="flex-1 font-mono text-[12px]">{label}</span>
        {sublabel && <span className="font-mono text-[11px] text-slate-500">{sublabel}</span>}
        {chevron && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
      </button>
    );
  }

  function Sep() { return <div className="my-1 h-px bg-slate-100" />; }

  function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`h-4 w-7 rounded-full transition-colors ${checked ? "bg-[#6366f1]" : "bg-slate-200"}`}
      >
        <span
          className={`block h-3 w-3 rounded-full bg-white transition-transform ${checked ? "translate-x-3.5" : "translate-x-0.5"}`}
        />
      </button>
    );
  }

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
      <div className="absolute right-3 top-full z-10 mt-1 w-[188px] rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Color</span>
          <button type="button" onClick={onPickClose}
            className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {presets.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onPick(c)}
              className={`h-6 w-6 rounded border ${value.toLowerCase() === c.toLowerCase() ? "border-slate-800 ring-1 ring-slate-800" : "border-slate-200"}`}
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
            className="flex-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-800 outline-none"
            placeholder="#RRGGBB"
          />
          <button
            type="button"
            onClick={() => { if (/^#[0-9a-fA-F]{6}$/.test(hex)) onPick(hex); }}
            className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 hover:bg-slate-200"
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
      className="fixed z-50 overflow-visible rounded-lg border border-slate-200 bg-white py-1.5 shadow-xl"
      style={{ left: x, top: y, width: menuW, maxHeight: menuH }}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-1.5 top-1.5 z-20 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-1.5">
              <button type="button" onClick={() => setView("main")}
                className="text-slate-400 hover:text-slate-700">
                <ChevronRight className="h-3.5 w-3.5 rotate-180" />
              </button>
              <span className="font-mono text-[12px] font-bold text-slate-700">Object tree</span>
            </div>

            {objects.length === 0 && (
              <p className="px-3 py-4 text-center font-mono text-[11px] text-slate-500">
                No drawings on chart
              </p>
            )}

            {objects.length > 0 && (
              <div>
                {objects.map((o) => (
                  <div key={o.id} className="group flex w-full items-center gap-2 rounded px-3 py-1.5 hover:bg-slate-50">
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
                      className="flex-1 truncate text-left font-mono text-[11px] text-slate-700 hover:text-slate-900">
                      {o.label}
                    </button>
                    <button type="button"
                      onClick={() => onRemoveObject(o.id)}
                      className="rounded p-1 text-slate-400 opacity-0 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
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
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-1.5">
              <button type="button" onClick={() => { setView("main"); setColorPicker(null); }}
                className="text-slate-400 hover:text-slate-700">
                <ChevronRight className="h-3.5 w-3.5 rotate-180" />
              </button>
              <span className="font-mono text-[12px] font-bold text-slate-700">Chart settings</span>
            </div>

            <div className="space-y-2 px-3 py-2">
              <div className="relative flex items-center justify-between">
                <span className="font-mono text-[11px] text-slate-600">Up color</span>
                <button
                  type="button"
                  onClick={() => setColorPicker(colorPicker === "up" ? null : "up")}
                  className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 hover:bg-slate-100"
                >
                  <span className="h-3.5 w-3.5 rounded-sm border border-slate-200" style={{ backgroundColor: settings.upColor }} />
                  <span className="font-mono text-[10px] text-slate-600">{settings.upColor}</span>
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
                <span className="font-mono text-[11px] text-slate-600">Down color</span>
                <button
                  type="button"
                  onClick={() => setColorPicker(colorPicker === "down" ? null : "down")}
                  className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 hover:bg-slate-100"
                >
                  <span className="h-3.5 w-3.5 rounded-sm border border-slate-200" style={{ backgroundColor: settings.downColor }} />
                  <span className="font-mono text-[10px] text-slate-600">{settings.downColor}</span>
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
                <span className="font-mono text-[11px] text-slate-600">Wicks (ombre)</span>
                <Toggle checked={settings.wickVisible} onChange={(v) => onSettingsChange({ ...settings, wickVisible: v })} />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-slate-600">Body border</span>
                <Toggle checked={settings.borderVisible} onChange={(v) => onSettingsChange({ ...settings, borderVisible: v })} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-slate-600">Timezone</span>
                <select
                  value={settings.timezone}
                  onChange={(e) => onSettingsChange({ ...settings, timezone: e.target.value })}
                  className="max-w-[168px] rounded border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] text-slate-700 outline-none"
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
