"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export type RiskRules = {
  daily_loss_pct: number;
  max_risk_per_trade_pct: number;
  max_exposure_pct: number;
  revenge_threshold_trades: number;
};

type RulesEditPopupProps = {
  open: boolean;
  onClose: () => void;
  initialRules: RiskRules | null;
  onSaved: (rules: RiskRules) => void;
};

export function RulesEditPopup({
  open,
  onClose,
  initialRules,
  onSaved
}: RulesEditPopupProps) {
  const [rules, setRules] = useState<RiskRules>({
    daily_loss_pct: 5,
    max_risk_per_trade_pct: 1,
    max_exposure_pct: 6,
    revenge_threshold_trades: 2
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (initialRules) setRules(initialRules);
  }, [initialRules, open]);

  if (!open) return null;

  const handleChange = (key: keyof RiskRules) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.valueAsNumber;
    if (!Number.isFinite(v)) return;
    setRules((prev) => ({ ...prev, [key]: v }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rules)
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Errore nel salvataggio" });
        return;
      }
      onSaved({
        daily_loss_pct: Number(data.daily_loss_pct) ?? rules.daily_loss_pct,
        max_risk_per_trade_pct: Number(data.max_risk_per_trade_pct) ?? rules.max_risk_per_trade_pct,
        max_exposure_pct: Number(data.max_exposure_pct) ?? rules.max_exposure_pct,
        revenge_threshold_trades: Number(data.revenge_threshold_trades) ?? rules.revenge_threshold_trades
      });
      setMessage({ type: "success", text: "Regole aggiornate." });
      setTimeout(() => {
        onClose();
      }, 800);
    } catch {
      setMessage({ type: "error", text: "Errore di rete." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="rounded-xl border border-slate-700 bg-slate-900 shadow-xl w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-100">Modifica regole rischio</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200"
            aria-label="Chiudi"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Daily loss %</label>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={rules.daily_loss_pct}
              onChange={handleChange("daily_loss_pct")}
              className="w-full h-2 rounded-full bg-slate-700 accent-cyan-500"
            />
            <span className="text-sm text-slate-300">{rules.daily_loss_pct}%</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Max risk per trade %</label>
            <input
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={rules.max_risk_per_trade_pct}
              onChange={handleChange("max_risk_per_trade_pct")}
              className="w-full h-2 rounded-full bg-slate-700 accent-cyan-500"
            />
            <span className="text-sm text-slate-300">{rules.max_risk_per_trade_pct}%</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Max exposure %</label>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={rules.max_exposure_pct}
              onChange={handleChange("max_exposure_pct")}
              className="w-full h-2 rounded-full bg-slate-700 accent-cyan-500"
            />
            <span className="text-sm text-slate-300">{rules.max_exposure_pct}%</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Revenge threshold (consecutive losses)</label>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={rules.revenge_threshold_trades}
              onChange={handleChange("revenge_threshold_trades")}
              className="w-full h-2 rounded-full bg-slate-700 accent-cyan-500"
            />
            <span className="text-sm text-slate-300">{rules.revenge_threshold_trades}</span>
          </div>

          {message && (
            <p className={`text-sm ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
              {message.text}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-3 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-50"
            >
              {saving ? "Salvataggio…" : "Salva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
