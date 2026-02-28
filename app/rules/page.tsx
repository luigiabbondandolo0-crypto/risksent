"use client";

import { useEffect, useState, FormEvent, ChangeEvent, useRef } from "react";
import { Save, AlertCircle, Lightbulb, SlidersHorizontal, Link2, CheckCircle, Send, RefreshCw } from "lucide-react";

const SUGGESTED = {
  daily_loss_pct: 2,
  max_risk_per_trade_pct: 1,
  max_exposure_pct: 15,
  revenge_threshold_trades: 2
} as const;

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

type ExceedAlert = {
  daily_loss_pct?: { current: number; recommended: number };
  max_risk_per_trade_pct?: { current: number; recommended: number };
  max_exposure_pct?: { current: number; recommended: number };
  revenge_threshold_trades?: { current: number; recommended: number };
};

const DEFAULT_RULES: Rules = {
  daily_loss_pct: 2,
  max_risk_per_trade_pct: 1,
  max_exposure_pct: 15,
  revenge_threshold_trades: 2,
  telegram_chat_id: null
};

function getInlineError(
  field: keyof typeof SUGGESTED,
  value: number
): string | null {
  const max = SUGGESTED[field];
  if (!Number.isFinite(value) || value <= max) return null;
  switch (field) {
    case "daily_loss_pct":
      return `Suggested max ${max}%. Current value (${value}%) may trigger frequent alerts.`;
    case "max_risk_per_trade_pct":
      return `Suggested max ${max}%. Current value (${value}%) increases single-trade risk.`;
    case "max_exposure_pct":
      return `Suggested max ${max}%. Current value (${value}%) increases total exposure.`;
    case "revenge_threshold_trades":
      return `Suggested max ${max} losses. Current value (${value}) may delay revenge-trading detection.`;
    default:
      return `Suggested max: ${max}.`;
  }
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rules>(DEFAULT_RULES);
  const [formValues, setFormValues] = useState({
    daily_loss_pct: "",
    max_risk_per_trade_pct: "",
    max_exposure_pct: "",
    revenge_threshold_trades: ""
  });
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [exceedAlert, setExceedAlert] = useState<ExceedAlert | null>(null);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);
  const [telegramLinking, setTelegramLinking] = useState(false);
  const [testAlertSending, setTestAlertSending] = useState(false);
  const [telegramMessage, setTelegramMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const pollLinkRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refetchRules = async () => {
    const res = await fetch("/api/rules", { cache: "no-store" });
    if (!res.ok) return null;
    const r = await res.json();
    const chatId = r.telegram_chat_id ?? null;
    setRules((prev) => ({
      ...prev,
      daily_loss_pct: Number(r.daily_loss_pct) ?? prev.daily_loss_pct,
      max_risk_per_trade_pct: Number(r.max_risk_per_trade_pct) ?? prev.max_risk_per_trade_pct,
      max_exposure_pct: Number(r.max_exposure_pct) ?? prev.max_exposure_pct,
      revenge_threshold_trades: Number(r.revenge_threshold_trades) ?? prev.revenge_threshold_trades,
      telegram_chat_id: chatId
    }));
    return chatId;
  };

  useEffect(() => {
    (async () => {
      try {
        const [rulesRes, alertsRes] = await Promise.all([
          fetch("/api/rules", { cache: "no-store" }),
          fetch("/api/alerts", { cache: "no-store" })
        ]);
        if (rulesRes.ok) {
          const r = await rulesRes.json();
          const loaded = {
            daily_loss_pct: Number(r.daily_loss_pct) ?? DEFAULT_RULES.daily_loss_pct,
            max_risk_per_trade_pct: Number(r.max_risk_per_trade_pct) ?? DEFAULT_RULES.max_risk_per_trade_pct,
            max_exposure_pct: Number(r.max_exposure_pct) ?? DEFAULT_RULES.max_exposure_pct,
            revenge_threshold_trades: Number(r.revenge_threshold_trades) ?? DEFAULT_RULES.revenge_threshold_trades,
            telegram_chat_id: r.telegram_chat_id != null && r.telegram_chat_id !== "" ? String(r.telegram_chat_id) : null
          };
          setRules(loaded);
          setFormValues({
            daily_loss_pct: String(loaded.daily_loss_pct),
            max_risk_per_trade_pct: String(loaded.max_risk_per_trade_pct),
            max_exposure_pct: String(loaded.max_exposure_pct),
            revenge_threshold_trades: String(loaded.revenge_threshold_trades)
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

  useEffect(() => {
    return () => {
      if (pollLinkRef.current) clearInterval(pollLinkRef.current);
    };
  }, []);

  const num = (s: string) => (s === "" || s === "-" ? NaN : Number(s));
  const inlineErrors = {
    daily_loss_pct: getInlineError("daily_loss_pct", num(formValues.daily_loss_pct)),
    max_risk_per_trade_pct: getInlineError("max_risk_per_trade_pct", num(formValues.max_risk_per_trade_pct)),
    max_exposure_pct: getInlineError("max_exposure_pct", num(formValues.max_exposure_pct)),
    revenge_threshold_trades: getInlineError("revenge_threshold_trades", num(formValues.revenge_threshold_trades))
  };
  const hasInlineError = Object.values(inlineErrors).some(Boolean);

  const handleChange = (field: keyof typeof formValues) => (e: ChangeEvent<HTMLInputElement>) => {
    setFormValues((prev) => ({ ...prev, [field]: e.target.value }));
    setExceedAlert(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setExceedAlert(null);
    const daily_loss_pct = num(formValues.daily_loss_pct) || 0;
    const max_risk_per_trade_pct = num(formValues.max_risk_per_trade_pct) || 0;
    const max_exposure_pct = num(formValues.max_exposure_pct) || 0;
    const revenge_threshold_trades = Math.floor(num(formValues.revenge_threshold_trades) || 0);

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
      setFormValues({
        daily_loss_pct: String(daily_loss_pct),
        max_risk_per_trade_pct: String(max_risk_per_trade_pct),
        max_exposure_pct: String(max_exposure_pct),
        revenge_threshold_trades: String(revenge_threshold_trades)
      });
      setMessage({ type: "success", text: "Rules saved." });

      const exceed: ExceedAlert = {};
      if (daily_loss_pct > SUGGESTED.daily_loss_pct) exceed.daily_loss_pct = { current: daily_loss_pct, recommended: SUGGESTED.daily_loss_pct };
      if (max_risk_per_trade_pct > SUGGESTED.max_risk_per_trade_pct) exceed.max_risk_per_trade_pct = { current: max_risk_per_trade_pct, recommended: SUGGESTED.max_risk_per_trade_pct };
      if (max_exposure_pct > SUGGESTED.max_exposure_pct) exceed.max_exposure_pct = { current: max_exposure_pct, recommended: SUGGESTED.max_exposure_pct };
      if (revenge_threshold_trades > SUGGESTED.revenge_threshold_trades) exceed.revenge_threshold_trades = { current: revenge_threshold_trades, recommended: SUGGESTED.revenge_threshold_trades };
      if (Object.keys(exceed).length > 0) setExceedAlert(exceed);
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
        <h1 className="text-xl font-semibold text-slate-50">Risk Rules & Alerts</h1>
        <p className="text-sm text-slate-500 mt-1">
          Define your trading boundaries and monitor active risk violations in real time.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-surface p-5">
            <div className="flex items-center gap-2 mb-1">
              <SlidersHorizontal className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-medium text-slate-200">Personal Risk Rules</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">These thresholds govern your alert triggers and sanity scoring.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-400" htmlFor="dailyLoss">
                    Daily Loss Limit (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="dailyLoss"
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder="Suggested: 2"
                      value={formValues.daily_loss_pct}
                      onChange={handleChange("daily_loss_pct")}
                      className={`flex-1 rounded-lg border bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-1 ${
                        inlineErrors.daily_loss_pct ? "border-red-500/60 focus:ring-red-500/50" : "border-slate-700 focus:ring-cyan-500/50"
                      }`}
                    />
                    <span className="text-slate-500 text-sm w-6">%</span>
                  </div>
                  {inlineErrors.daily_loss_pct ? (
                    <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3 flex-shrink-0" /> {inlineErrors.daily_loss_pct}</p>
                  ) : (
                    <p className="text-[11px] text-slate-500">Maximum allowable loss in a single trading day before alerts trigger. Suggested max: 2%.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-400" htmlFor="maxRisk">
                    Max Risk Per Trade (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="maxRisk"
                      type="number"
                      min={0}
                      step={0.1}
                      placeholder="Suggested: 1"
                      value={formValues.max_risk_per_trade_pct}
                      onChange={handleChange("max_risk_per_trade_pct")}
                      className={`flex-1 rounded-lg border bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-1 ${
                        inlineErrors.max_risk_per_trade_pct ? "border-red-500/60 focus:ring-red-500/50" : "border-slate-700 focus:ring-cyan-500/50"
                      }`}
                    />
                    <span className="text-slate-500 text-sm w-6">%</span>
                  </div>
                  {inlineErrors.max_risk_per_trade_pct ? (
                    <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3 flex-shrink-0" /> {inlineErrors.max_risk_per_trade_pct}</p>
                  ) : (
                    <p className="text-[11px] text-slate-500">Maximum account equity risked on any single trade position. Suggested max: 1%.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-400" htmlFor="maxExposure">
                    Max Total Exposure (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="maxExposure"
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder="Suggested: 15"
                      value={formValues.max_exposure_pct}
                      onChange={handleChange("max_exposure_pct")}
                      className={`flex-1 rounded-lg border bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-1 ${
                        inlineErrors.max_exposure_pct ? "border-red-500/60 focus:ring-red-500/50" : "border-slate-700 focus:ring-cyan-500/50"
                      }`}
                    />
                    <span className="text-slate-500 text-sm w-6">%</span>
                  </div>
                  {inlineErrors.max_exposure_pct ? (
                    <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3 flex-shrink-0" /> {inlineErrors.max_exposure_pct}</p>
                  ) : (
                    <p className="text-[11px] text-slate-500">Maximum combined exposure across all open positions. Suggested max: 15%.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-400" htmlFor="revenge">
                    Revenge Trading Threshold
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="revenge"
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Suggested: 2"
                      value={formValues.revenge_threshold_trades}
                      onChange={handleChange("revenge_threshold_trades")}
                      className={`flex-1 rounded-lg border bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-1 ${
                        inlineErrors.revenge_threshold_trades ? "border-red-500/60 focus:ring-red-500/50" : "border-slate-700 focus:ring-cyan-500/50"
                      }`}
                    />
                    <span className="text-slate-500 text-sm">losses</span>
                  </div>
                  {inlineErrors.revenge_threshold_trades ? (
                    <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3 flex-shrink-0" /> {inlineErrors.revenge_threshold_trades}</p>
                  ) : (
                    <p className="text-[11px] text-slate-500">Number of consecutive losses before a trade is flagged for revenge trading. Suggested max: 2.</p>
                  )}
                </div>
              </div>

              {message && (
                <p className={`text-sm ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                  {message.text}
                </p>
              )}
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2.5 text-sm font-medium text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save Rules"}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-slate-800 bg-surface p-5">
            <div className="flex items-center gap-2 mb-1">
              <Link2 className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-medium text-slate-200">Collega Telegram</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Collegamento unico: apri il link, invia /start al bot. Da allora riceverai qui tutti gli alert (notifiche). Non serve scrivere altri comandi.
            </p>
            <div className="space-y-3">
              {rules.telegram_chat_id ? (
                <p className="text-sm text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Chat collegata. Riceverai gli alert su Telegram e qui sotto nello stesso elenco.
                </p>
              ) : (
                <p className="text-xs text-slate-400">Nessuna chat collegata. Usa &quot;Collega ora&quot; e completa /start nel bot.</p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={telegramLinking}
                  onClick={async () => {
                    setTelegramLinking(true);
                    setTelegramLink(null);
                    setTelegramMessage(null);
                    if (pollLinkRef.current) {
                      clearInterval(pollLinkRef.current);
                      pollLinkRef.current = null;
                    }
                    try {
                      const res = await fetch("/api/bot/link-telegram", { method: "POST" });
                      const data = await res.json();
                      if (res.ok && data.link) {
                        setTelegramLink(data.link);
                        window.open(data.link, "_blank");
                        setTelegramMessage({ type: "success", text: "Apri il link, invia /start. Lo stato si aggiorna da solo." });
                        let elapsed = 0;
                        const POLL_MS = 2000;
                        const MAX_MS = 30000;
                        pollLinkRef.current = setInterval(async () => {
                          elapsed += POLL_MS;
                          const chatId = await refetchRules();
                          if (chatId) {
                            if (pollLinkRef.current) clearInterval(pollLinkRef.current);
                            pollLinkRef.current = null;
                            setTelegramMessage({ type: "success", text: "Chat collegata. Puoi usare Test per verificare." });
                            return;
                          }
                          if (elapsed >= MAX_MS && pollLinkRef.current) {
                            clearInterval(pollLinkRef.current);
                            pollLinkRef.current = null;
                          }
                        }, POLL_MS);
                      } else {
                        setTelegramMessage({ type: "error", text: data.error ?? "Errore creazione link" });
                      }
                    } catch {
                      setTelegramMessage({ type: "error", text: "Errore di rete" });
                    } finally {
                      setTelegramLinking(false);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 px-3 py-2 text-sm font-medium text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 disabled:opacity-50"
                >
                  <Link2 className="h-4 w-4" />
                  {telegramLinking ? "Generazione…" : "Collega ora"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setTelegramMessage(null);
                    const chatId = await refetchRules();
                    if (!chatId) {
                      setTelegramMessage({ type: "error", text: "Nessuna chat collegata. Usa Collega ora e invia /start nel bot." });
                      return;
                    }
                    setTelegramMessage({ type: "success", text: "Chat collegata." });
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700/50"
                >
                  Verifica collegamento
                </button>
                <button
                  type="button"
                  disabled={testAlertSending}
                  onClick={async () => {
                    setTestAlertSending(true);
                    setTelegramMessage(null);
                    try {
                      const chatId = await refetchRules();
                      if (!chatId) {
                        setTelegramMessage({ type: "error", text: "Collega prima la chat con Collega ora e invia /start nel bot." });
                        setTestAlertSending(false);
                        return;
                      }
                      const res = await fetch("/api/alerts", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          message: "Questo è un alert di test da RiskSent.",
                          severity: "medium",
                          solution: "Se lo vedi su Telegram, il collegamento funziona."
                        })
                      });
                      const data = await res.json();
                      if (res.ok) {
                        setTelegramMessage({ type: "success", text: "Messaggio inviato. Controlla Telegram e l'elenco sotto." });
                        const aRes = await fetch("/api/alerts", { cache: "no-store" });
                        if (aRes.ok) {
                          const a = await aRes.json();
                          setAlerts(a.alerts ?? []);
                        }
                      } else {
                        setTelegramMessage({ type: "error", text: data.error ?? "Invio fallito" });
                      }
                    } catch {
                      setTelegramMessage({ type: "error", text: "Errore di rete" });
                    } finally {
                      setTestAlertSending(false);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700/50 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {testAlertSending ? "Invio…" : "Test collegamento"}
                </button>
              </div>
              {telegramMessage && (
                <p className={`text-sm ${telegramMessage.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                  {telegramMessage.text}
                </p>
              )}
              {telegramLink && (
                <p className="text-xs text-slate-400 break-all">
                  Link: <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">{telegramLink}</a>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {exceedAlert && Object.keys(exceedAlert).length > 0 && (
            <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4">
              <div className="flex items-center gap-2 text-amber-300 font-medium mb-2">
                <AlertCircle className="h-4 w-4" />
                Values above suggested limits
              </div>
              <p className="text-xs text-slate-300 mb-3">You saved rules above the recommended maximums. Consider adjusting to reduce risk.</p>
              <ul className="space-y-1.5 text-xs">
                {exceedAlert.daily_loss_pct && (
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-400">Daily loss limit</span>
                    <span><span className="text-red-400">{exceedAlert.daily_loss_pct.current}%</span> → suggested <span className="text-emerald-400">{exceedAlert.daily_loss_pct.recommended}%</span></span>
                  </li>
                )}
                {exceedAlert.max_risk_per_trade_pct && (
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-400">Max risk per trade</span>
                    <span><span className="text-red-400">{exceedAlert.max_risk_per_trade_pct.current}%</span> → suggested <span className="text-emerald-400">{exceedAlert.max_risk_per_trade_pct.recommended}%</span></span>
                  </li>
                )}
                {exceedAlert.max_exposure_pct && (
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-400">Max exposure</span>
                    <span><span className="text-red-400">{exceedAlert.max_exposure_pct.current}%</span> → suggested <span className="text-emerald-400">{exceedAlert.max_exposure_pct.recommended}%</span></span>
                  </li>
                )}
                {exceedAlert.revenge_threshold_trades && (
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-400">Revenge threshold</span>
                    <span><span className="text-red-400">{exceedAlert.revenge_threshold_trades.current}</span> → suggested <span className="text-emerald-400">{exceedAlert.revenge_threshold_trades.recommended}</span> losses</span>
                  </li>
                )}
              </ul>
              <button
                type="button"
                onClick={() => setExceedAlert(null)}
                className="mt-3 text-xs text-slate-400 hover:text-slate-200"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="rounded-xl border border-slate-800 bg-surface p-5">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="text-sm font-medium text-slate-200">Alerts Center</h2>
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch("/api/alerts", { cache: "no-store" });
                  if (res.ok) {
                    const a = await res.json();
                    setAlerts(a.alerts ?? []);
                  }
                }}
                className="inline-flex items-center gap-1 rounded border border-slate-600 bg-slate-800/50 px-2 py-1 text-xs text-slate-400 hover:bg-slate-700/50"
              >
                <RefreshCw className="h-3 w-3" /> Aggiorna
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Stessi alert che ricevi su Telegram (notifiche). Qui li vedi tutti; risolvi subito quelli ad alta gravità.
            </p>
            <div className="flex gap-3 mb-3">
              <span className="flex items-center gap-1.5 text-[10px] text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> High</span>
              <span className="flex items-center gap-1.5 text-[10px] text-amber-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Medium</span>
            </div>
            {alerts.length === 0 ? (
              <p className="text-xs text-slate-500">No alerts yet. Alerts will appear here when risk rules are breached.</p>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 10).map((a) => (
                  <div
                    key={a.id}
                    className={`rounded-lg border p-3 ${
                      a.severity === "high" ? "border-red-500/40 bg-red-500/10" : "border-amber-500/40 bg-amber-500/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium ${a.severity === "high" ? "text-red-300" : "text-amber-300"}`}>
                        {a.severity === "high" ? "High" : "Medium"} {!a.read && "• New"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(a.alert_date).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-300 mb-1">Problem detected</p>
                    <p className="text-xs text-slate-400 mb-2">{a.message}</p>
                    {a.solution && (
                      <>
                        <p className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1"><Lightbulb className="h-3 w-3" /> Recommended action</p>
                        <p className="text-xs text-slate-400">{a.solution}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
