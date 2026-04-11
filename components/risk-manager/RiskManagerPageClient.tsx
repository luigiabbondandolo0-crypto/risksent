"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Crosshair,
  Flame,
  Layers,
  ShieldAlert,
  TrendingDown
} from "lucide-react";
import { LiveGauge } from "./LiveGauge";
import { RuleCard } from "./RuleCard";
import { TelegramSetup, type TelegramSettings } from "./TelegramSetup";
import { ViolationTimeline, type ViolationItem } from "./ViolationTimeline";
import type { RiskGaugeStatus } from "@/lib/risk/riskTypes";
import {
  dailyDdRatio,
  exposureRatio,
  gaugeStatusFromRatio,
  revengeRatio,
  riskPerTradeRatio
} from "@/lib/risk/violationEngine";

type Rules = {
  daily_loss_pct: number;
  max_risk_per_trade_pct: number;
  max_exposure_pct: number;
  revenge_threshold_trades: number;
};

type DashboardRiskSlice = {
  dailyDdPct: number | null;
  currentExposurePct: number | null;
  maxOpenRiskPct: number | null;
  consecutiveLossesAtEnd: number;
};

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const }
  })
};

function parseNum(s: string, fallback: number): number {
  const n = Number(String(s).replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

export function RiskManagerPageClient({
  isMock = false
}: {
  isMock?: boolean;
}) {
  const [rules, setRules] = useState<Rules>({
    daily_loss_pct: 5,
    max_risk_per_trade_pct: 1,
    max_exposure_pct: 6,
    revenge_threshold_trades: 3
  });
  const [draft, setDraft] = useState({
    daily_loss_pct: "5",
    max_risk_per_trade_pct: "1",
    max_exposure_pct: "6",
    revenge_threshold_trades: "3"
  });
  const [savedRules, setSavedRules] = useState<Rules | null>(null);

  const [live, setLive] = useState<DashboardRiskSlice>({
    dailyDdPct: null,
    currentExposurePct: null,
    maxOpenRiskPct: null,
    consecutiveLossesAtEnd: 0
  });

  const [violations, setViolations] = useState<ViolationItem[]>([]);
  const [tg, setTg] = useState<TelegramSettings>({
    telegram_chat_id: null,
    telegram_enabled: false,
    notify_daily_dd: true,
    notify_exposure: true,
    notify_revenge: true,
    notify_risk_per_trade: true
  });
  const [chatDraft, setChatDraft] = useState("");

  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(!isMock);

  const showToast = useCallback((text: string, ok: boolean) => {
    setToast({ text, ok });
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  const dirty = useMemo(() => {
    if (!savedRules || isMock) return false;
    return (
      parseNum(draft.daily_loss_pct, savedRules.daily_loss_pct) !== savedRules.daily_loss_pct ||
      parseNum(draft.max_risk_per_trade_pct, savedRules.max_risk_per_trade_pct) !==
        savedRules.max_risk_per_trade_pct ||
      parseNum(draft.max_exposure_pct, savedRules.max_exposure_pct) !== savedRules.max_exposure_pct ||
      parseNum(draft.revenge_threshold_trades, savedRules.revenge_threshold_trades) !==
        savedRules.revenge_threshold_trades
    );
  }, [draft, savedRules, isMock]);

  const loadViolations = useCallback(async () => {
    if (isMock) return;
    const res = await fetch("/api/risk/violations?limit=30");
    if (!res.ok) return;
    const j = (await res.json()) as { violations: ViolationItem[] };
    setViolations(j.violations ?? []);
  }, [isMock]);

  useEffect(() => {
    if (isMock) {
      setRules({
        daily_loss_pct: 5,
        max_risk_per_trade_pct: 1,
        max_exposure_pct: 6,
        revenge_threshold_trades: 3
      });
      setDraft({
        daily_loss_pct: "5",
        max_risk_per_trade_pct: "1",
        max_exposure_pct: "6",
        revenge_threshold_trades: "3"
      });
      setSavedRules({
        daily_loss_pct: 5,
        max_risk_per_trade_pct: 1,
        max_exposure_pct: 6,
        revenge_threshold_trades: 3
      });
      setLive({
        dailyDdPct: -2.1,
        currentExposurePct: 3.4,
        maxOpenRiskPct: 0.8,
        consecutiveLossesAtEnd: 1
      });
      setViolations([
        {
          id: "m1",
          rule_type: "exposure",
          value_at_violation: 5.2,
          limit_value: 6,
          message: "Open exposure approaching limit: 5.20% (limit 6%).",
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "m2",
          rule_type: "daily_dd",
          value_at_violation: -4.1,
          limit_value: 5,
          message: "Daily drawdown −4.10% is approaching −5% limit.",
          created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "m3",
          rule_type: "risk_per_trade",
          value_at_violation: 1.15,
          limit_value: 1,
          message: "Largest open risk 1.15% exceeds per-trade limit 1%.",
          created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);
      setTg({
        telegram_chat_id: "****1234",
        telegram_enabled: true,
        notify_daily_dd: true,
        notify_exposure: true,
        notify_revenge: true,
        notify_risk_per_trade: true
      });
      setChatDraft("****1234");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [rRes, nRes, vRes] = await Promise.all([
          fetch("/api/risk/rules"),
          fetch("/api/risk/notifications"),
          fetch("/api/risk/violations?limit=30")
        ]);
        if (rRes.ok) {
          const r = (await rRes.json()) as Rules;
          if (!cancelled) {
            setRules(r);
            setSavedRules(r);
            setDraft({
              daily_loss_pct: String(r.daily_loss_pct),
              max_risk_per_trade_pct: String(r.max_risk_per_trade_pct),
              max_exposure_pct: String(r.max_exposure_pct),
              revenge_threshold_trades: String(r.revenge_threshold_trades)
            });
          }
        }
        if (nRes.ok) {
          const n = (await nRes.json()) as TelegramSettings;
          if (!cancelled) {
            setTg({
              telegram_chat_id: n.telegram_chat_id,
              telegram_enabled: n.telegram_enabled,
              notify_daily_dd: n.notify_daily_dd,
              notify_exposure: n.notify_exposure,
              notify_revenge: n.notify_revenge,
              notify_risk_per_trade: n.notify_risk_per_trade
            });
            setChatDraft(n.telegram_chat_id ?? "");
          }
        }
        if (vRes.ok) {
          const v = (await vRes.json()) as { violations: ViolationItem[] };
          if (!cancelled) setViolations(v.violations ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isMock]);

  const refreshDashboard = useCallback(async () => {
    if (isMock) return;
    const res = await fetch("/api/dashboard-stats");
    if (!res.ok) return;
    const j = await res.json();
    setLive({
      dailyDdPct: typeof j.dailyDdPct === "number" ? j.dailyDdPct : null,
      currentExposurePct: typeof j.currentExposurePct === "number" ? j.currentExposurePct : null,
      maxOpenRiskPct: typeof j.maxOpenRiskPct === "number" ? j.maxOpenRiskPct : null,
      consecutiveLossesAtEnd: typeof j.consecutiveLossesAtEnd === "number" ? j.consecutiveLossesAtEnd : 0
    });
  }, [isMock]);

  useEffect(() => {
    if (isMock) return;
    void refreshDashboard();
    const t = window.setInterval(() => void refreshDashboard(), 30_000);
    return () => window.clearInterval(t);
  }, [isMock, refreshDashboard]);

  useEffect(() => {
    if (isMock) return;
    const t = window.setInterval(() => void loadViolations(), 60_000);
    return () => window.clearInterval(t);
  }, [isMock, loadViolations]);

  const saveRules = async () => {
    if (isMock) return;
    const body = {
      daily_loss_pct: parseNum(draft.daily_loss_pct, rules.daily_loss_pct),
      max_risk_per_trade_pct: parseNum(draft.max_risk_per_trade_pct, rules.max_risk_per_trade_pct),
      max_exposure_pct: parseNum(draft.max_exposure_pct, rules.max_exposure_pct),
      revenge_threshold_trades: Math.round(
        parseNum(draft.revenge_threshold_trades, rules.revenge_threshold_trades)
      )
    };
    const res = await fetch("/api/risk/rules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      showToast("Could not save rules", false);
      return;
    }
    const next = (await res.json()) as Rules;
    setRules(next);
    setSavedRules(next);
    setDraft({
      daily_loss_pct: String(next.daily_loss_pct),
      max_risk_per_trade_pct: String(next.max_risk_per_trade_pct),
      max_exposure_pct: String(next.max_exposure_pct),
      revenge_threshold_trades: String(next.revenge_threshold_trades)
    });
    showToast("Rules saved", true);
  };

  const saveTg = async (patch: Partial<TelegramSettings>) => {
    if (isMock) {
      setTg((prev) => ({ ...prev, ...patch }));
      return;
    }
    const res = await fetch("/api/risk/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    if (!res.ok) {
      showToast("Could not update Telegram settings", false);
      return;
    }
    const data = (await res.json()) as TelegramSettings;
    setTg({
      telegram_chat_id: data.telegram_chat_id,
      telegram_enabled: data.telegram_enabled,
      notify_daily_dd: data.notify_daily_dd,
      notify_exposure: data.notify_exposure,
      notify_revenge: data.notify_revenge,
      notify_risk_per_trade: data.notify_risk_per_trade
    });
    if (patch.telegram_chat_id !== undefined) setChatDraft(data.telegram_chat_id ?? "");
  };

  const testTelegram = async () => {
    if (isMock) {
      showToast("Test message sent (demo)", true);
      return;
    }
    const res = await fetch("/api/risk/notifications/test", { method: "POST" });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      showToast(j.error ?? "Test failed", false);
      return;
    }
    showToast("Test message sent", true);
  };

  const ruleNums: Rules = {
    daily_loss_pct: parseNum(draft.daily_loss_pct, rules.daily_loss_pct),
    max_risk_per_trade_pct: parseNum(draft.max_risk_per_trade_pct, rules.max_risk_per_trade_pct),
    max_exposure_pct: parseNum(draft.max_exposure_pct, rules.max_exposure_pct),
    revenge_threshold_trades: Math.round(parseNum(draft.revenge_threshold_trades, rules.revenge_threshold_trades))
  };

  const ddRatio = dailyDdRatio(live.dailyDdPct, ruleNums.daily_loss_pct);
  const exRatio = exposureRatio(live.currentExposurePct, ruleNums.max_exposure_pct);
  const rtRatio = riskPerTradeRatio(live.maxOpenRiskPct, ruleNums.max_risk_per_trade_pct);
  const revRatio = revengeRatio(live.consecutiveLossesAtEnd, ruleNums.revenge_threshold_trades);

  const cardStatus = (r: number): RiskGaugeStatus => gaugeStatusFromRatio(r);

  const dailyDisplay =
    live.dailyDdPct != null ? `${live.dailyDdPct >= 0 ? "+" : ""}${live.dailyDdPct.toFixed(2)}%` : "—";
  const exposureDisplay =
    live.currentExposurePct != null ? `${live.currentExposurePct.toFixed(2)}%` : "—";
  const riskDisplay = live.maxOpenRiskPct != null ? `${live.maxOpenRiskPct.toFixed(2)}%` : "—";
  const revDisplay = `${live.consecutiveLossesAtEnd}`;

  return (
    <div className="min-h-0 text-slate-100">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -24, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -12, x: 10 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="fixed right-6 top-20 z-[100] max-w-sm rounded-xl border border-white/[0.1] px-4 py-3 text-sm font-[family-name:var(--font-mono)] shadow-xl backdrop-blur-md"
            style={{
              background: toast.ok ? "rgba(0,230,118,0.12)" : "rgba(255,60,60,0.12)",
              color: toast.ok ? "#b9f6ca" : "#ffcdd2"
            }}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      {isMock && (
        <div className="mb-6 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-2 text-center text-sm font-[family-name:var(--font-mono)] text-amber-200">
          Demo mode — sample data, no account changes.
        </div>
      )}

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="rs-page-title font-[family-name:var(--font-display)]">Risk Manager</h1>
          <p className="rs-page-sub">Set your rules. Monitor your limits. Stay protected.</p>
        </div>
        <AnimatePresence>
          {dirty && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            >
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => void saveRules()}
                className="rounded-xl bg-gradient-to-r from-[#ff3c3c] to-[#c92a2a] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#ff3c3c]/20"
              >
                Save rules
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading && <p className="text-sm font-[family-name:var(--font-mono)] text-slate-500">Loading…</p>}

      <motion.section
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="rs-card-accent relative z-0 mb-8 p-6 sm:p-8"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)" }}
      >
        <div className="relative z-10">
          <p className="rs-kpi-label mb-4">Your rules</p>
          <div className="grid gap-4 md:grid-cols-2">
            <RuleCard
              icon={TrendingDown}
              label="Daily loss limit"
              description="Max loss allowed on a single trading day, as % of balance."
              value={draft.daily_loss_pct}
              onChange={(v) => setDraft((d) => ({ ...d, daily_loss_pct: v }))}
              status={cardStatus(ddRatio)}
            />
            <RuleCard
              icon={Crosshair}
              label="Max risk per trade"
              description="Cap risk per position when stop loss is defined (open positions)."
              value={draft.max_risk_per_trade_pct}
              onChange={(v) => setDraft((d) => ({ ...d, max_risk_per_trade_pct: v }))}
              status={cardStatus(rtRatio)}
            />
            <RuleCard
              icon={Layers}
              label="Max exposure"
              description="Total risk across open positions vs equity (sum of SL risk)."
              value={draft.max_exposure_pct}
              onChange={(v) => setDraft((d) => ({ ...d, max_exposure_pct: v }))}
              status={cardStatus(exRatio)}
            />
            <RuleCard
              icon={Flame}
              label="Revenge trading"
              description="Alert after consecutive closed losses reach this count."
              value={draft.revenge_threshold_trades}
              onChange={(v) => setDraft((d) => ({ ...d, revenge_threshold_trades: v }))}
              status={cardStatus(revRatio)}
              suffix="losses"
            />
          </div>
          {isMock && (
            <p className="mt-4 text-center text-xs font-[family-name:var(--font-mono)] text-slate-500">
              <span title="Not available in demo">Save rules disabled in demo.</span>
            </p>
          )}
        </div>
      </motion.section>

      <motion.section
        custom={1}
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="rs-card mb-8 p-6 sm:p-8"
      >
        <div className="mb-6 flex items-center gap-2">
          <Activity className="h-5 w-5 text-cyan-400" />
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-white">Live monitor</h2>
        </div>
        <p className="rs-page-sub mb-6 !mt-0 text-xs">
          Compared to your rule limits · refreshes every 30s from dashboard stats.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <LiveGauge
            label="Daily DD"
            value={live.dailyDdPct}
            limit={ruleNums.daily_loss_pct}
            unit="%"
            ratio={ddRatio}
            status={cardStatus(ddRatio)}
            valueDisplay={dailyDisplay}
          />
          <LiveGauge
            label="Exposure"
            value={live.currentExposurePct}
            limit={ruleNums.max_exposure_pct}
            unit="%"
            ratio={exRatio}
            status={cardStatus(exRatio)}
            valueDisplay={exposureDisplay}
          />
          <LiveGauge
            label="Risk (max open)"
            value={live.maxOpenRiskPct}
            limit={ruleNums.max_risk_per_trade_pct}
            unit="%"
            ratio={rtRatio}
            status={cardStatus(rtRatio)}
            valueDisplay={riskDisplay}
          />
          <LiveGauge
            label="Consecutive losses"
            value={live.consecutiveLossesAtEnd}
            limit={ruleNums.revenge_threshold_trades}
            unit="losses"
            ratio={revRatio}
            status={cardStatus(revRatio)}
            valueDisplay={revDisplay}
          />
        </div>
      </motion.section>

      <motion.section
        id="violations"
        custom={2}
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="rs-card mb-8 scroll-mt-28 p-6 sm:p-8"
      >
        <div className="mb-6 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-[#ff3c3c]" />
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-white">Violation history</h2>
        </div>
        <ViolationTimeline violations={violations} />
      </motion.section>

      <motion.section
        custom={3}
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="rs-card p-6 sm:p-8"
      >
        <h2 className="mb-2 font-[family-name:var(--font-display)] text-lg font-bold text-white">Telegram alerts</h2>
        <p className="rs-page-sub mb-6 !mt-0 text-xs">
          Optional push alerts when limits are approached or breached (requires TELEGRAM_BOT_TOKEN on the server).
        </p>
        <TelegramSetup
          settings={tg}
          chatIdDraft={chatDraft}
          onChatIdChange={setChatDraft}
          onSaveField={(patch) => void saveTg(patch)}
          onTest={() => void testTelegram()}
          isMock={isMock}
          testDisabledReason={
            isMock ? undefined : !chatDraft.trim() ? "Enter a chat ID first" : undefined
          }
        />
      </motion.section>
    </div>
  );
}
