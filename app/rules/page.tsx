"use client";

/**
 * DATA SOURCES (what is real vs mock):
 * - Rules values: REAL from DB (app_user).
 * - Live status badges (Safe/Warning/Breach): REAL when account linked + MetaAPI ok; otherwise no live data (badges show "—" or "No data").
 * - Alerts list: REAL from DB (alert table).
 * - Telegram linked: REAL from DB (app_user.telegram_chat_id).
 * - AI "Analyze my rules": MOCK (stub response until AI is wired).
 */

import { useEffect, useState, FormEvent, ChangeEvent, useRef } from "react";
import { Save, AlertCircle, Lightbulb, SlidersHorizontal, Link2, RefreshCw, Info, Unlink } from "lucide-react";

const SUGGESTED = {
  daily_loss_pct: 2,
  max_risk_per_trade_pct: 1,
  max_exposure_pct: 15,
  revenge_threshold_trades: 2
} as const;

const RECOMMENDED_RANGES: Record<string, string> = {
  daily_loss_pct: "Recommended: 2%.",
  max_risk_per_trade_pct: "Recommended: 1%.",
  max_exposure_pct: "Recommended: 15%.",
  revenge_threshold_trades: "Recommended: 2 losses."
};

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
  rule_type?: string | null;
  dismissed?: boolean;
  acknowledged_at?: string | null;
  acknowledged_note?: string | null;
};

type ExceedAlert = {
  daily_loss_pct?: { current: number; recommended: number };
  max_risk_per_trade_pct?: { current: number; recommended: number };
  max_exposure_pct?: { current: number; recommended: number };
  revenge_threshold_trades?: { current: number; recommended: number };
};

type LiveStatus = {
  dailyLossPct: number | null;
  currentExposurePct: number | null;
} | null;

const DEFAULT_RULES: Rules = {
  daily_loss_pct: 2,
  max_risk_per_trade_pct: 1,
  max_exposure_pct: 15,
  revenge_threshold_trades: 2,
  telegram_chat_id: null
};

function getInlineError(field: keyof typeof SUGGESTED, value: number): string | null {
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

function getRuleBadge(
  ruleKey: string,
  limit: number,
  live: LiveStatus
): { label: string; color: string } {
  if (!live) return { label: "—", color: "text-slate-500" };
  if (ruleKey === "daily_loss_pct" && live.dailyLossPct != null) {
    const current = live.dailyLossPct;
    if (current >= limit) return { label: "Breach imminent", color: "text-red-400" };
    if (limit - current <= 1.5) return { label: "Warning – approaching limit", color: "text-amber-400" };
    return { label: "Safe – within limit", color: "text-emerald-400" };
  }
  if (ruleKey === "max_exposure_pct" && live.currentExposurePct != null) {
    const current = live.currentExposurePct;
    if (current >= limit) return { label: "Breach imminent", color: "text-red-400" };
    if (limit - current <= 2) return { label: "Warning – approaching limit", color: "text-amber-400" };
    return { label: "Safe – within limit", color: "text-emerald-400" };
  }
  return { label: "—", color: "text-slate-500" };
}

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} h ago`;
  if (days < 7) return `${days} d ago`;
  return d.toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" });
}

function maskChatId(chatId: string): string {
  if (chatId.length <= 6) return "***";
  return chatId.slice(0, 3) + "***" + chatId.slice(-3);
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
  const [telegramMessage, setTelegramMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [live, setLive] = useState<LiveStatus>(null);
  const [alertFilter, setAlertFilter] = useState<"all" | "high" | "medium">("all");
  const [testAlertSending, setTestAlertSending] = useState(false);
  const [aiInsightOpen, setAiInsightOpen] = useState(false);
  const [aiInsightText, setAiInsightText] = useState("");
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

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/rules/status", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setLive(data.live ?? null);
    } catch {
      setLive(null);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [rulesRes, alertsRes, statusRes] = await Promise.all([
          fetch("/api/rules", { cache: "no-store" }),
          fetch("/api/alerts", { cache: "no-store" }),
          fetch("/api/rules/status", { cache: "no-store" })
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
        if (statusRes.ok) {
          const s = await statusRes.json();
          setLive(s.live ?? null);
        }
      } catch {
        setMessage({ type: "error", text: "Failed to load rules" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const t = setInterval(fetchStatus, 60_000);
    return () => clearInterval(t);
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
      await fetchStatus();

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

  const updateAlert = async (id: string, updates: { read?: boolean; dismissed?: boolean; acknowledged?: boolean; acknowledged_note?: string }) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, ...data.alert } : a)));
      }
    } catch {
      // ignore
    }
  };

  const filteredAlerts = alerts
    .filter((a) => !a.dismissed)
    .filter((a) => alertFilter === "all" || a.severity === alertFilter);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-slate-50">Rules and Alerts</h1>
        <p className="text-slate-500 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-slate-50">Risk Rules & Alerts</h1>
        <p className="text-sm text-slate-500 mt-1">
          Define your trading boundaries and monitor active risk violations in real time.
        </p>
      </header>

      <section className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1 space-y-6">
          <div className="rounded-xl border border-cyan-500/20 bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-medium text-slate-200">Personal Risk Rules</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">Thresholds govern alert triggers and sanity scoring.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                { key: "daily_loss_pct" as const, label: "Daily Loss Limit (%)", min: 0, max: 10, step: 0.5, unit: "%" },
                { key: "max_risk_per_trade_pct" as const, label: "Max Risk Per Trade (%)", min: 0, max: 3, step: 0.1, unit: "%" },
                { key: "max_exposure_pct" as const, label: "Max Total Exposure (%)", min: 0, max: 30, step: 0.5, unit: "%" },
                { key: "revenge_threshold_trades" as const, label: "Revenge Trading Threshold", min: 0, max: 5, step: 1, unit: "losses" }
              ].map(({ key, label, min, max, step, unit }) => {
                const val = num(formValues[key]);
                const badge = getRuleBadge(key, Number(rules[key]) || 0, live);
                const limitNum = Number(rules[key]) || 0;
                const badgeDetail =
                  key === "daily_loss_pct" && live?.dailyLossPct != null
                    ? `Current ${live.dailyLossPct.toFixed(1)}% vs limit ${limitNum}%`
                    : key === "max_exposure_pct" && live?.currentExposurePct != null
                    ? `Current ${live.currentExposurePct.toFixed(1)}% vs limit ${limitNum}%`
                    : null;
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="text-xs font-medium text-slate-400" htmlFor={key}>{label}</label>
                      <span className="inline-flex items-center gap-1 text-slate-500" title={RECOMMENDED_RANGES[key]}>
                        <Info className="h-3 w-3" />
                      </span>
                      {!inlineErrors[key] && (
                        <span className="text-[11px] text-emerald-500">Recommended: {RECOMMENDED_RANGES[key]}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        id={key}
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={Number.isFinite(val) ? val : min}
                        onChange={(e) => setFormValues((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="flex-1 h-2 rounded-lg appearance-none bg-slate-700 accent-cyan-500"
                      />
                      <input
                        type="number"
                        min={min}
                        max={max}
                        step={step}
                        value={formValues[key]}
                        onChange={handleChange(key)}
                        className="w-16 rounded border border-slate-700 bg-slate-900/50 px-2 py-1.5 text-sm text-slate-100"
                      />
                      <span className="text-slate-500 text-sm w-12">{unit}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {inlineErrors[key] ? (
                        <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3 flex-shrink-0" /> {inlineErrors[key]}</p>
                      ) : (
                        <p className="text-[11px] text-slate-500">{RECOMMENDED_RANGES[key]}</p>
                      )}
                      <span className={`text-xs ${badge.color}`} title={badgeDetail ?? undefined}>
                        {badge.label}{badgeDetail ? ` (${badgeDetail})` : ""}
                      </span>
                    </div>
                  </div>
                );
              })}

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

          {!live && (
            <p className="text-xs text-slate-500 rounded-lg border border-slate-700 bg-slate-800/30 px-3 py-2">
              Connect an account in Dashboard to see live status badges.
            </p>
          )}

          <div className="rounded-xl border border-cyan-500/20 bg-surface p-6">
            <div className="flex items-center gap-2 mb-1">
              <Link2 className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-medium text-slate-200">Link Telegram</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              One-time link: open the link and send /start to the bot. No other commands needed.
            </p>
            <div className="space-y-3">
              {rules.telegram_chat_id ? (
                <>
                  <p className="text-sm text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Connected (chat_id: {maskChatId(rules.telegram_chat_id)})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={testAlertSending}
                      onClick={async () => {
                        setTestAlertSending(true);
                        setTelegramMessage(null);
                        try {
                          const res = await fetch("/api/bot/send-test-alert", { method: "POST" });
                          const data = await res.json();
                          if (res.ok) {
                            setTelegramMessage({ type: "success", text: "Test alert sent. Check Telegram." });
                          } else {
                            setTelegramMessage({ type: "error", text: data.error ?? "Send failed" });
                          }
                        } catch {
                          setTelegramMessage({ type: "error", text: "Network error" });
                        } finally {
                          setTestAlertSending(false);
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 px-3 py-2 text-sm font-medium text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 disabled:opacity-50"
                    >
                      {testAlertSending ? "Sending…" : "Send test alert"}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm("Disconnect Telegram? You will stop receiving alerts there.")) return;
                        try {
                          const res = await fetch("/api/rules", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ telegram_chat_id: null })
                          });
                          if (res.ok) {
                            setRules((prev) => ({ ...prev, telegram_chat_id: null }));
                            setTelegramMessage({ type: "success", text: "Disconnected." });
                          }
                        } catch {
                          setTelegramMessage({ type: "error", text: "Request failed" });
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700/50"
                    >
                      <Unlink className="h-4 w-4" /> Disconnect
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-slate-400">No chat linked. Use &quot;Link now&quot; and complete /start in the bot.</p>
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
                            setTelegramMessage({ type: "success", text: "Open the link and send /start. Status will update automatically." });
                            let elapsed = 0;
                            const POLL_MS = 2000;
                            const MAX_MS = 30000;
                            pollLinkRef.current = setInterval(async () => {
                              elapsed += POLL_MS;
                              const chatId = await refetchRules();
                              if (chatId) {
                                if (pollLinkRef.current) clearInterval(pollLinkRef.current);
                                pollLinkRef.current = null;
                                setTelegramMessage({ type: "success", text: "Chat linked." });
                                return;
                              }
                              if (elapsed >= MAX_MS && pollLinkRef.current) {
                                clearInterval(pollLinkRef.current);
                                pollLinkRef.current = null;
                              }
                            }, POLL_MS);
                          } else {
                            setTelegramMessage({ type: "error", text: data.error ?? "Failed to create link" });
                          }
                        } catch {
                          setTelegramMessage({ type: "error", text: "Network error" });
                        } finally {
                          setTelegramLinking(false);
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 px-3 py-2 text-sm font-medium text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 disabled:opacity-50"
                    >
                      <Link2 className="h-4 w-4" />
                      {telegramLinking ? "Generating…" : "Link now"}
                    </button>
                  </div>
                </>
              )}
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

          <div className="rounded-xl border border-cyan-500/20 bg-surface p-4">
            <button
              type="button"
              onClick={async () => {
                setAiInsightOpen(true);
                setAiInsightText("Analyzing your rules and recent trades…");
                try {
                  const res = await fetch("/api/ai/rules-insight", { method: "POST" });
                  const data = await res.json();
                  setAiInsightText(data.insight ?? "No insight available. (Stub: connect AI later.)");
                } catch {
                  setAiInsightText("Request failed. (Stub: connect AI later.)");
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700/50"
            >
              <Lightbulb className="h-4 w-4" /> Analyze my rules with AI
            </button>
            {aiInsightOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setAiInsightOpen(false)}>
                <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 max-w-lg w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-semibold text-slate-100 mb-3">AI rules insight</h3>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{aiInsightText}</p>
                  <p className="text-[10px] text-slate-500 mt-2">Data: MOCK (stub until AI is wired).</p>
                  <button type="button" className="mt-4 rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-slate-200" onClick={() => setAiInsightOpen(false)}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4 lg:min-w-[320px]">
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
              <button type="button" onClick={() => setExceedAlert(null)} className="mt-3 text-xs text-slate-400 hover:text-slate-200">Dismiss</button>
            </div>
          )}

          <div className="rounded-xl border border-cyan-500/20 bg-surface p-6">
            <div className="flex items-center justify-between gap-2 mb-2">
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
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">High alerts first.</p>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[10px] text-slate-500">Show:</span>
              {(["all", "high", "medium"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setAlertFilter(f)}
                  className={`rounded px-2 py-1 text-xs capitalize ${alertFilter === f ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "border border-slate-600 text-slate-400 hover:bg-slate-800/50"}`}
                >
                  {f}
                </button>
              ))}
            </div>
            {filteredAlerts.length === 0 ? (
              <p className="text-xs text-slate-500">No alerts. Alerts appear here when risk rules are breached.</p>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto">
                {filteredAlerts.map((a) => (
                  <div
                    key={a.id}
                    className={`rounded-lg border p-3 ${a.severity === "high" ? "border-red-500/40 bg-red-500/10" : "border-amber-500/40 bg-amber-500/10"}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <span className={`text-xs font-medium ${a.severity === "high" ? "text-red-300" : "text-amber-300"}`}>
                        {a.severity === "high" ? "High" : "Medium"} {!a.read && "• New"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(a.alert_date).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })} – {relativeTime(a.alert_date)}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-300 mb-1">Problem</p>
                    <p className="text-xs text-slate-400 mb-2">{a.message}</p>
                    {a.solution && (
                      <>
                        <p className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1"><Lightbulb className="h-3 w-3" /> Action</p>
                        <p className="text-xs text-slate-400">{a.solution}</p>
                      </>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {!a.read && (
                        <button type="button" className="text-xs text-cyan-400 hover:underline" onClick={() => updateAlert(a.id, { read: true })}>Mark as read</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="text-[10px] text-slate-600 border-t border-slate-800 pt-4">
        Rules & alerts: DB. Live badges: MetaAPI when account linked. AI insight: stub.
      </footer>
    </div>
  );
}
