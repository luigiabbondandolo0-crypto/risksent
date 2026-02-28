"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";

type Rules = {
  daily_loss_pct: number;
  max_risk_per_trade_pct: number;
  max_exposure_pct: number;
  revenge_threshold_trades: number;
  telegram_chat_id: string | null;
};

type AlertRow = {
  id: string;
  message: string;
  severity: string;
  solution: string | null;
  alert_date: string;
  read: boolean;
};

const DEFAULT_RULES: Rules = {
  daily_loss_pct: 5,
  max_risk_per_trade_pct: 1,
  max_exposure_pct: 6,
  revenge_threshold_trades: 3,
  telegram_chat_id: null
};

export default function RulesPage() {
  const [rules, setRules] = useState<Rules>(DEFAULT_RULES);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [rulesRes, alertsRes] = await Promise.all([
          fetch("/api/rules"),
          fetch("/api/alerts")
        ]);
        if (rulesRes.ok) {
          const r = await rulesRes.json();
          setRules({
            daily_loss_pct: Number(r.daily_loss_pct) ?? DEFAULT_RULES.daily_loss_pct,
            max_risk_per_trade_pct: Number(r.max_risk_per_trade_pct) ?? DEFAULT_RULES.max_risk_per_trade_pct,
            max_exposure_pct: Number(r.max_exposure_pct) ?? DEFAULT_RULES.max_exposure_pct,
            revenge_threshold_trades: Number(r.revenge_threshold_trades) ?? DEFAULT_RULES.revenge_threshold_trades,
            telegram_chat_id: r.telegram_chat_id ?? null
          });
        }
        if (alertsRes.ok) {
          const a = await alertsRes.json();
          setAlerts(a.alerts ?? []);
        }
      } catch {
        setMessage({ type: "error", text: "Failed to load rules" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const form = e.target as HTMLFormElement;
    const daily_loss_pct = Number((form.querySelector("#dailyLoss") as HTMLInputElement)?.value) || 0;
    const max_risk_per_trade_pct = Number((form.querySelector("#maxRisk") as HTMLInputElement)?.value) || 0;
    const max_exposure_pct = Number((form.querySelector("#maxExposure") as HTMLInputElement)?.value) || 0;
    const revenge_threshold_trades = Number((form.querySelector("#revenge") as HTMLInputElement)?.value) || 0;

    try {
      const res = await fetch("/api/rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daily_loss_pct,
          max_risk_per_trade_pct,
          max_exposure_pct,
          revenge_threshold_trades
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to save" });
        return;
      }
      setRules({
        ...rules,
        daily_loss_pct: Number(data.daily_loss_pct) ?? daily_loss_pct,
        max_risk_per_trade_pct: Number(data.max_risk_per_trade_pct) ?? max_risk_per_trade_pct,
        max_exposure_pct: Number(data.max_exposure_pct) ?? max_exposure_pct,
        revenge_threshold_trades: Number(data.revenge_threshold_trades) ?? revenge_threshold_trades
      });
      setMessage({ type: "success", text: "Rules saved." });
    } catch {
      setMessage({ type: "error", text: "Request failed" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-slate-50">Rules and Alerts</h1>
        <p className="text-slate-500 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-50">Rules and Alerts</h1>
        <p className="text-xs text-slate-500 mt-1">
          Set your risk limits and view alerts. Telegram bot alerts can be connected below.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-[3fr,2fr]">
        <div className="rounded-lg border border-slate-800 bg-surface p-4 space-y-4">
          <h2 className="text-xs font-medium text-slate-300">Risk rule settings</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 text-xs md:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-slate-400" htmlFor="dailyLoss">
                  Daily loss limit (%)
                </label>
                <input
                  id="dailyLoss"
                  name="dailyLoss"
                  type="number"
                  min={0}
                  step={0.5}
                  defaultValue={rules.daily_loss_pct}
                  className="w-full rounded-md border border-slate-800 bg-black/40 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-400" htmlFor="maxRisk">
                  Max risk per trade (%)
                </label>
                <input
                  id="maxRisk"
                  name="maxRisk"
                  type="number"
                  min={0}
                  step={0.1}
                  defaultValue={rules.max_risk_per_trade_pct}
                  className="w-full rounded-md border border-slate-800 bg-black/40 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-400" htmlFor="maxExposure">
                  Max exposure (%)
                </label>
                <input
                  id="maxExposure"
                  name="maxExposure"
                  type="number"
                  min={0}
                  step={0.5}
                  defaultValue={rules.max_exposure_pct}
                  className="w-full rounded-md border border-slate-800 bg-black/40 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-400" htmlFor="revenge">
                  Revenge threshold (consecutive losses)
                </label>
                <input
                  id="revenge"
                  name="revenge"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={rules.revenge_threshold_trades}
                  className="w-full rounded-md border border-slate-800 bg-black/40 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            {message && (
              <p className={`text-xs ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                {message.text}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-md bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save rules"}
            </button>
          </form>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-slate-800 bg-surface p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-medium text-slate-300">Alert center</h2>
              <span className="text-[10px] text-slate-500">Medium / High severity</span>
            </div>
            {alerts.length === 0 ? (
              <p className="text-[11px] text-slate-500">No alerts yet. Alerts will appear here when risk rules are breached.</p>
            ) : (
              <div className="space-y-2 text-[11px]">
                {alerts.slice(0, 10).map((a) => (
                  <div
                    key={a.id}
                    className={`rounded-md border p-2 ${
                      a.severity === "high"
                        ? "border-red-500/40 bg-red-500/10"
                        : "border-amber-500/40 bg-amber-500/10"
                    }`}
                  >
                    <div className={a.severity === "high" ? "text-red-300 font-medium" : "text-amber-300 font-medium"}>
                      {a.severity === "high" ? "High" : "Medium"} {a.read ? "" : "• New"}
                    </div>
                    <p className="text-slate-200 mt-1">{a.message}</p>
                    {a.solution && <p className="mt-1 text-slate-400">Suggested action: {a.solution}</p>}
                    <p className="mt-1 text-slate-500 text-[10px]">
                      {new Date(a.alert_date).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-800 bg-surface p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-medium text-slate-300">Telegram live alerts</h2>
              <span className="text-[10px] text-slate-500">Bot integration</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-slate-500 flex-1">
                Send risk breaches to a private Telegram chat. Connect your chat to receive real-time alerts.
              </p>
              {rules.telegram_chat_id ? (
                <span className="text-[10px] text-emerald-400 font-medium">Connected</span>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center rounded-full bg-slate-900 px-2 py-1 border border-slate-700 cursor-not-allowed text-[10px] text-slate-400"
                >
                  Connect bot (coming soon)
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
