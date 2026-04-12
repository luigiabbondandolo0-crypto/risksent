"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { authFetch } from "@/lib/api/authFetch";
import { GlobalAccountSelector } from "@/components/shared/GlobalAccountSelector";
import { AddAccountModal } from "@/components/journal/AddAccountModal";
import { resolveMetaapiUuidForJournalSelection } from "@/lib/accounts/resolveMetaapiForJournal";
import type { JournalAccountPublic } from "@/lib/journal/journalTypes";
import type { RiskGaugeStatus } from "@/lib/risk/riskTypes";
import {
  dailyDdRatio,
  exposureRatio,
  gaugeStatusFromRatio,
  revengeRatio,
  riskPerTradeRatio
} from "@/lib/risk/violationEngine";
import { useDemoAction } from "@/hooks/useDemoAction";
import { DemoActionModal } from "@/components/demo/DemoActionModal";
import {
  DEMO_JOURNAL_ACCOUNT_PUBLIC,
  DEMO_METAAPI_ACCOUNT_ID,
} from "@/lib/demo/demoJournalAccount";

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
  isMock = false,
  subscriptionDemo = false,
}: {
  isMock?: boolean;
  subscriptionDemo?: boolean;
}) {
  const demoData = isMock || subscriptionDemo;
  const previewChrome = isMock && !subscriptionDemo;
  const { interceptAction, modalOpen, actionLabel, closeModal } = useDemoAction();
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
  const [loading, setLoading] = useState(!demoData);

  const [journalAccounts, setJournalAccounts] = useState<JournalAccountPublic[]>([]);
  const [tradingAccounts, setTradingAccounts] = useState<
    { account_number: string; metaapi_account_id: string | null }[]
  >([]);
  const [selectedGlobalId, setSelectedGlobalId] = useState<"all" | string>("all");
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const accInit = useRef(false);

  const showToast = useCallback((text: string, ok: boolean) => {
    setToast({ text, ok });
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  const dirty = useMemo(() => {
    if (!savedRules || previewChrome) return false;
    return (
      parseNum(draft.daily_loss_pct, savedRules.daily_loss_pct) !== savedRules.daily_loss_pct ||
      parseNum(draft.max_risk_per_trade_pct, savedRules.max_risk_per_trade_pct) !==
        savedRules.max_risk_per_trade_pct ||
      parseNum(draft.max_exposure_pct, savedRules.max_exposure_pct) !== savedRules.max_exposure_pct ||
      parseNum(draft.revenge_threshold_trades, savedRules.revenge_threshold_trades) !==
        savedRules.revenge_threshold_trades
    );
  }, [draft, savedRules, previewChrome]);

  const loadViolations = useCallback(async () => {
    if (demoData) return;
    const res = await authFetch("/api/risk/violations?limit=30");
    if (!res.ok) return;
    const j = (await res.json()) as { violations: ViolationItem[] };
    setViolations(j.violations ?? []);
  }, [demoData]);

  useEffect(() => {
    if (demoData) {
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
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          account_nickname: "IC Markets Demo"
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
      if (subscriptionDemo) {
        setJournalAccounts([DEMO_JOURNAL_ACCOUNT_PUBLIC]);
        setTradingAccounts([
          {
            account_number: DEMO_JOURNAL_ACCOUNT_PUBLIC.account_number,
            metaapi_account_id: DEMO_METAAPI_ACCOUNT_ID,
          },
        ]);
        setSelectedGlobalId(DEMO_JOURNAL_ACCOUNT_PUBLIC.id);
        accInit.current = true;
      }
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [nRes, vRes] = await Promise.all([
          authFetch("/api/risk/notifications"),
          authFetch("/api/risk/violations?limit=30")
        ]);
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
  }, [demoData, subscriptionDemo]);

  useEffect(() => {
    if (demoData) return;
    let cancelled = false;
    (async () => {
      try {
        if (selectedGlobalId === "all") {
          const rRes = await authFetch("/api/risk/rules");
          if (!rRes.ok || cancelled) return;
          const r = (await rRes.json()) as Rules;
          setRules(r);
          setSavedRules(r);
          setDraft({
            daily_loss_pct: String(r.daily_loss_pct),
            max_risk_per_trade_pct: String(r.max_risk_per_trade_pct),
            max_exposure_pct: String(r.max_exposure_pct),
            revenge_threshold_trades: String(r.revenge_threshold_trades)
          });
          return;
        }
        const rRes = await authFetch(
          `/api/risk/account-rules?account_id=${encodeURIComponent(selectedGlobalId)}`
        );
        if (!rRes.ok || cancelled) return;
        const r = (await rRes.json()) as Rules;
        setRules(r);
        setSavedRules(r);
        setDraft({
          daily_loss_pct: String(r.daily_loss_pct),
          max_risk_per_trade_pct: String(r.max_risk_per_trade_pct),
          max_exposure_pct: String(r.max_exposure_pct),
          revenge_threshold_trades: String(r.revenge_threshold_trades)
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [demoData, selectedGlobalId]);

  useEffect(() => {
    if (demoData) return;
    let cancelled = false;
    (async () => {
      try {
        const [jRes, tRes] = await Promise.all([
          fetch("/api/journal/accounts"),
          authFetch("/api/accounts"),
        ]);
        const jData = jRes.ok ? await jRes.json().catch(() => ({})) : {};
        const journals = (jData.accounts ?? []) as JournalAccountPublic[];
        let tradings: { account_number: string; metaapi_account_id: string | null }[] = [];
        if (tRes.ok) {
          const tData = (await tRes.json()) as {
            accounts?: { account_number?: string; metaapi_account_id?: string | null }[];
          };
          tradings = (tData.accounts ?? []).map((a) => ({
            account_number: String(a.account_number ?? ""),
            metaapi_account_id: a.metaapi_account_id ?? null,
          }));
        }
        if (!cancelled) {
          setJournalAccounts(journals);
          setTradingAccounts(tradings);
        }
      } catch {
        if (!cancelled) {
          setJournalAccounts([]);
          setTradingAccounts([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [demoData]);

  const reloadJournalAndTrading = useCallback(async () => {
    if (demoData) return;
    try {
      const [jRes, tRes] = await Promise.all([
        fetch("/api/journal/accounts"),
        authFetch("/api/accounts"),
      ]);
      const jData = jRes.ok ? await jRes.json().catch(() => ({})) : {};
      const journals = (jData.accounts ?? []) as JournalAccountPublic[];
      let tradings: { account_number: string; metaapi_account_id: string | null }[] = [];
      if (tRes.ok) {
        const tData = (await tRes.json()) as {
          accounts?: { account_number?: string; metaapi_account_id?: string | null }[];
        };
        tradings = (tData.accounts ?? []).map((a) => ({
          account_number: String(a.account_number ?? ""),
          metaapi_account_id: a.metaapi_account_id ?? null,
        }));
      }
      setJournalAccounts(journals);
      setTradingAccounts(tradings);
    } catch {
      setJournalAccounts([]);
      setTradingAccounts([]);
    }
  }, [demoData]);

  useEffect(() => {
    if (demoData || journalAccounts.length === 0 || accInit.current) return;
    accInit.current = true;
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("rs_selected_account") ??
          localStorage.getItem("rs_journal_account")
        : null;
    if (stored === "all" || (stored && journalAccounts.some((a) => a.id === stored))) {
      setSelectedGlobalId(stored === "all" ? "all" : stored);
    } else if (journalAccounts.length === 1) {
      setSelectedGlobalId(journalAccounts[0]!.id);
    } else {
      setSelectedGlobalId("all");
    }
  }, [demoData, journalAccounts]);

  const hasAnyBrokerMeta = useMemo(
    () => tradingAccounts.some((t) => Boolean(t.metaapi_account_id)),
    [tradingAccounts]
  );

  const resolvedDashUuid = useMemo(
    () =>
      journalAccounts.length > 0
        ? resolveMetaapiUuidForJournalSelection(
            selectedGlobalId,
            journalAccounts,
            tradingAccounts
          )
        : undefined,
    [selectedGlobalId, journalAccounts, tradingAccounts]
  );

  const refreshDashboard = useCallback(
    async (uuid?: string) => {
      if (demoData) return;
      if (!hasAnyBrokerMeta) {
        setLive({
          dailyDdPct: null,
          currentExposurePct: null,
          maxOpenRiskPct: null,
          consecutiveLossesAtEnd: 0,
        });
        return;
      }
      const url =
        uuid !== undefined && uuid !== ""
          ? `/api/dashboard-stats?uuid=${encodeURIComponent(uuid)}`
          : "/api/dashboard-stats";
      const res = await authFetch(url);
      if (!res.ok) return;
      const j = await res.json();
      setLive({
        dailyDdPct: typeof j.dailyDdPct === "number" ? j.dailyDdPct : null,
        currentExposurePct: typeof j.currentExposurePct === "number" ? j.currentExposurePct : null,
        maxOpenRiskPct: typeof j.maxOpenRiskPct === "number" ? j.maxOpenRiskPct : null,
        consecutiveLossesAtEnd: typeof j.consecutiveLossesAtEnd === "number" ? j.consecutiveLossesAtEnd : 0,
      });
    },
    [demoData, hasAnyBrokerMeta]
  );

  useEffect(() => {
    if (demoData) return;
    void refreshDashboard(resolvedDashUuid);
    const t = window.setInterval(() => void refreshDashboard(resolvedDashUuid), 30_000);
    return () => window.clearInterval(t);
  }, [demoData, resolvedDashUuid, refreshDashboard]);

  useEffect(() => {
    if (demoData) return;
    const t = window.setInterval(() => void loadViolations(), 60_000);
    return () => window.clearInterval(t);
  }, [demoData, loadViolations]);

  const saveRules = async () => {
    if (previewChrome) return;
    if (subscriptionDemo) {
      interceptAction(() => {}, "save your risk rules");
      return;
    }
    const body = {
      daily_loss_pct: parseNum(draft.daily_loss_pct, rules.daily_loss_pct),
      max_risk_per_trade_pct: parseNum(draft.max_risk_per_trade_pct, rules.max_risk_per_trade_pct),
      max_exposure_pct: parseNum(draft.max_exposure_pct, rules.max_exposure_pct),
      revenge_threshold_trades: Math.round(
        parseNum(draft.revenge_threshold_trades, rules.revenge_threshold_trades)
      )
    };
    const res =
      selectedGlobalId === "all"
        ? await authFetch("/api/risk/rules", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          })
        : await authFetch("/api/risk/account-rules", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ account_id: selectedGlobalId, ...body })
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
    if (demoData) {
      setTg((prev) => ({ ...prev, ...patch }));
      if (patch.telegram_chat_id !== undefined) {
        setChatDraft(patch.telegram_chat_id ?? "");
      }
      return;
    }
    const res = await authFetch("/api/risk/notifications", {
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
    if (demoData) {
      showToast("Test message sent (demo)", true);
      return;
    }
    const res = await authFetch("/api/risk/notifications/test", { method: "POST" });
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

  const rulesScopeLabel = useMemo(() => {
    if (previewChrome) return "";
    if (selectedGlobalId === "all") {
      return "Editing defaults for all accounts (per-account overrides use the dropdown).";
    }
    const a = journalAccounts.find((x) => x.id === selectedGlobalId);
    return a ? `Rules for: ${a.nickname}` : "Rules for selected account";
  }, [previewChrome, selectedGlobalId, journalAccounts]);

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

      {previewChrome && (
        <div className="mb-6 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-2 text-center text-sm font-[family-name:var(--font-mono)] text-amber-200">
          Demo mode — sample data, no account changes.
        </div>
      )}

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="rs-page-title font-[family-name:var(--font-display)]">Risk Manager</h1>
          <p className="rs-page-sub">Set your rules. Monitor your limits. Stay protected.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {!previewChrome && journalAccounts.length > 0 && (
            <GlobalAccountSelector
              accounts={journalAccounts.map((a) => ({
                id: a.id,
                nickname: a.nickname,
                status: a.status,
                platform: a.platform,
              }))}
              selectedId={selectedGlobalId}
              onChange={setSelectedGlobalId}
              onAddAccount={
                subscriptionDemo
                  ? () =>
                      interceptAction(
                        () => setAddAccountOpen(true),
                        "add a trading account"
                      )
                  : () => setAddAccountOpen(true)
              }
            />
          )}
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
          <p className="rs-kpi-label mb-1">Your rules</p>
          {!previewChrome && rulesScopeLabel ? (
            <p className="mb-4 text-xs font-[family-name:var(--font-mono)] text-cyan-300/90">
              {rulesScopeLabel}
            </p>
          ) : (
            <div className="mb-4" />
          )}
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
          {previewChrome && (
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
          isMock={previewChrome}
          testDisabledReason={
            previewChrome ? undefined : !chatDraft.trim() ? "Enter a chat ID first" : undefined
          }
        />
      </motion.section>

      {!demoData && (
        <AddAccountModal
          open={addAccountOpen}
          onClose={() => setAddAccountOpen(false)}
          onCreated={() => {
            setAddAccountOpen(false);
            void reloadJournalAndTrading();
          }}
        />
      )}

      {subscriptionDemo && (
        <DemoActionModal open={modalOpen} action={actionLabel} onClose={closeModal} />
      )}
    </div>
  );
}
