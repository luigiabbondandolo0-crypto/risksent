"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Flame,
  Layers,
  ShieldAlert,
  Trash2,
  TrendingDown
} from "lucide-react";
import { LiveGauge } from "./LiveGauge";
import { RuleCard } from "./RuleCard";
import { TelegramSetup, type TelegramSettings } from "./TelegramSetup";
import { ViolationTimeline, type ViolationItem } from "./ViolationTimeline";
import { authFetch } from "@/lib/api/authFetch";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
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
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }
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
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
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
  const [violationPage, setViolationPage] = useState(1);
  const [clearingViolations, setClearingViolations] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [tg, setTg] = useState<TelegramSettings>({
    telegram_chat_id: null,
    telegram_enabled: false,
    notify_daily_dd: true,
    notify_max_dd: true,
    notify_position_size: true,
    notify_consecutive_losses: true,
    notify_weekly_loss: true,
    notify_overtrading: true,
    notify_revenge: true
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

  // Ref so realtime handler can read the current selection without stale closure
  const selectedGlobalIdRef = useRef<string>(selectedGlobalId);
  useEffect(() => {
    selectedGlobalIdRef.current = selectedGlobalId;
  }, [selectedGlobalId]);

  const loadViolations = useCallback(async () => {
    if (demoData) return;
    const qs = selectedGlobalId !== "all"
      ? `&account_id=${encodeURIComponent(selectedGlobalId)}`
      : "";
    const res = await authFetch(`/api/risk/violations?limit=100${qs}`);
    if (!res.ok) return;
    const j = (await res.json()) as { violations: ViolationItem[] };
    setViolations(j.violations ?? []);
  }, [demoData, selectedGlobalId]);

  const VIOLATIONS_PER_PAGE = 10;
  const totalViolationPages = Math.max(1, Math.ceil(violations.length / VIOLATIONS_PER_PAGE));
  const currentViolationPage = Math.min(violationPage, totalViolationPages);
  const pagedViolations = useMemo(() => {
    const start = (currentViolationPage - 1) * VIOLATIONS_PER_PAGE;
    return violations.slice(start, start + VIOLATIONS_PER_PAGE);
  }, [violations, currentViolationPage]);

  const clearViolations = useCallback(async () => {
    if (demoData) {
      setViolations([]);
      setViolationPage(1);
      return;
    }
    if (violations.length === 0) return;
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        "Clear all violation history? This cannot be undone."
      );
      if (!ok) return;
    }
    setClearingViolations(true);
    try {
      const body = selectedGlobalId !== "all"
        ? JSON.stringify({ account_id: selectedGlobalId })
        : undefined;
      const res = await authFetch("/api/risk/violations", {
        method: "DELETE",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body,
      });
      if (res.ok) {
        setViolations([]);
        setViolationPage(1);
      }
    } finally {
      setClearingViolations(false);
    }
  }, [demoData, violations.length, selectedGlobalId]);

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
        notify_max_dd: true,
        notify_position_size: true,
        notify_consecutive_losses: true,
        notify_weekly_loss: true,
        notify_overtrading: true,
        notify_revenge: true
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
        const violQs = selectedGlobalId !== "all"
          ? `&account_id=${encodeURIComponent(selectedGlobalId)}`
          : "";
        const [nRes, vRes] = await Promise.all([
          authFetch("/api/risk/notifications"),
          authFetch(`/api/risk/violations?limit=100${violQs}`)
        ]);
        if (nRes.ok) {
          const n = (await nRes.json()) as TelegramSettings;
          if (!cancelled) {
            setTg({
              telegram_chat_id: n.telegram_chat_id,
              telegram_enabled: n.telegram_enabled,
              notify_daily_dd: n.notify_daily_dd,
              notify_max_dd: n.notify_max_dd ?? true,
              notify_position_size: n.notify_position_size ?? true,
              notify_consecutive_losses: n.notify_consecutive_losses ?? true,
              notify_weekly_loss: n.notify_weekly_loss ?? true,
              notify_overtrading: n.notify_overtrading ?? true,
              notify_revenge: n.notify_revenge
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
      const tz =
        typeof window !== "undefined"
          ? encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC")
          : encodeURIComponent("UTC");
      const url =
        uuid !== undefined && uuid !== ""
          ? `/api/dashboard-stats?uuid=${encodeURIComponent(uuid)}&tz=${tz}`
          : `/api/dashboard-stats?tz=${tz}`;
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

  // Reload violations whenever the account selection changes
  useEffect(() => {
    void loadViolations();
    setViolationPage(1);
  }, [loadViolations]); // loadViolations rebuilds when selectedGlobalId changes

  useEffect(() => {
    if (demoData) return;
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, [demoData, supabase]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("risk_violations_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "risk_violations",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const raw = payload.new as Record<string, unknown>;
          // Filter realtime event by selected account (use ref to avoid stale closure)
          const currentSel = selectedGlobalIdRef.current;
          if (currentSel !== "all") {
            const rawAccountId = raw.account_id != null ? String(raw.account_id) : null;
            if (rawAccountId !== currentSel) return;
          }
          const item: ViolationItem = {
            id: String(raw.id ?? ""),
            rule_type: String(raw.rule_type ?? ""),
            value_at_violation: Number(raw.value_at_violation ?? 0),
            limit_value: Number(raw.limit_value ?? 0),
            message: String(raw.message ?? ""),
            created_at: String(raw.created_at ?? new Date().toISOString()),
            account_nickname: raw.account_nickname != null ? String(raw.account_nickname) : null,
          };
          setViolations((prev) => [item, ...prev]);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("rs-alerts-refresh"));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

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
      notify_max_dd: data.notify_max_dd ?? true,
      notify_position_size: data.notify_position_size ?? true,
      notify_consecutive_losses: data.notify_consecutive_losses ?? true,
      notify_weekly_loss: data.notify_weekly_loss ?? true,
      notify_overtrading: data.notify_overtrading ?? true,
      notify_revenge: data.notify_revenge
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
    <div className="relative min-h-0 text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-40 left-1/4 h-96 w-96 rounded-full opacity-[0.06] blur-3xl"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />
        <div
          className="absolute top-1/3 right-0 h-72 w-72 rounded-full opacity-[0.04] blur-3xl"
          style={{ background: "radial-gradient(circle, #38bdf8, transparent)" }}
        />
        <div
          className="absolute bottom-1/4 left-0 h-64 w-64 rounded-full opacity-[0.04] blur-3xl"
          style={{ background: "radial-gradient(circle, #4ade80, transparent)" }}
        />
      </div>
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
          <h1
            className="rs-page-title font-[family-name:var(--font-display)]"
            style={{
              background: "linear-gradient(135deg, #e0e7ff 0%, #a78bfa 50%, #6366f1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Risk Manager
          </h1>
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
                  className="rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f46e5] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#6366f1]/20"
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
        className="rs-card-accent relative z-0 mb-8 overflow-hidden p-6 sm:p-8"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)" }}
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full opacity-20 blur-2xl"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />
        <div className="relative z-10">
          <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500">Rule limits</p>
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
        className="rs-card relative mb-8 overflow-hidden p-6 sm:p-8"
        style={{
          background: "rgba(56,189,248,0.04)",
          borderColor: "rgba(56,189,248,0.2)",
          boxShadow: "0 0 24px rgba(56,189,248,0.08)",
        }}
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-full opacity-20 blur-2xl"
          style={{ background: "radial-gradient(circle, #38bdf8, transparent)" }}
        />
        <p className="relative z-10 mb-2 text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500">
          Live data
        </p>
        <div className="relative z-10 mb-6 flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#6366f1]" />
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-white">Live monitor</h2>
        </div>
        <p className="relative z-10 rs-page-sub mb-6 !mt-0 text-xs">
          Compared to your rule limits · refreshes every 30s from dashboard stats.
        </p>
        <div className="relative z-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        className="rs-card relative mb-8 scroll-mt-28 overflow-hidden p-6 sm:p-8"
        style={{
          background: "rgba(248,113,113,0.04)",
          borderColor: "rgba(248,113,113,0.2)",
          boxShadow: "0 0 24px rgba(248,113,113,0.08)",
        }}
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-full opacity-20 blur-2xl"
          style={{ background: "radial-gradient(circle, #f87171, transparent)" }}
        />
        <p className="relative z-10 mb-2 text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500">History</p>
        <div className="relative z-10 mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-[#ff3c3c]" />
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-white">Violation history</h2>
          </div>
          {violations.length > 0 ? (
            <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-[family-name:var(--font-mono)] font-semibold uppercase tracking-wide text-slate-400">
              {violations.length} total
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void clearViolations()}
            disabled={clearingViolations || violations.length === 0}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-[family-name:var(--font-mono)] font-medium text-slate-300 transition hover:border-[#ff3c3c]/40 hover:bg-[#ff3c3c]/10 hover:text-[#ff7070] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/[0.08] disabled:hover:bg-white/[0.03] disabled:hover:text-slate-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {clearingViolations ? "Clearing…" : "Clear all"}
          </button>
        </div>
        <div className="relative z-10">
        <ViolationTimeline violations={pagedViolations} />
        {totalViolationPages > 1 ? (
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/[0.05] pt-4">
            <span className="text-[11px] font-[family-name:var(--font-mono)] text-slate-500">
              Page {currentViolationPage} of {totalViolationPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViolationPage((p) => Math.max(1, p - 1))}
                disabled={currentViolationPage <= 1}
                className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs font-[family-name:var(--font-mono)] text-slate-300 transition hover:border-white/[0.16] hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/[0.08] disabled:hover:bg-white/[0.03]"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>
              {Array.from({ length: totalViolationPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isActive = pageNum === currentViolationPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setViolationPage(pageNum)}
                    aria-current={isActive ? "page" : undefined}
                    className={
                      isActive
                        ? "inline-flex h-7 min-w-[28px] items-center justify-center rounded-md px-2 text-xs font-[family-name:var(--font-mono)] font-semibold text-white"
                        : "inline-flex h-7 min-w-[28px] items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] px-2 text-xs font-[family-name:var(--font-mono)] text-slate-300 transition hover:border-white/[0.16] hover:bg-white/[0.06]"
                    }
                    style={
                      isActive
                        ? {
                            background: "rgba(99,102,241,0.15)",
                            boxShadow: "0 0 12px rgba(99,102,241,0.2)",
                            border: "1px solid rgba(99,102,241,0.3)",
                          }
                        : undefined
                    }
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  setViolationPage((p) => Math.min(totalViolationPages, p + 1))
                }
                disabled={currentViolationPage >= totalViolationPages}
                className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs font-[family-name:var(--font-mono)] text-slate-300 transition hover:border-white/[0.16] hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/[0.08] disabled:hover:bg-white/[0.03]"
                aria-label="Next page"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : null}
        </div>
      </motion.section>

      <motion.section
        custom={3}
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="rs-card relative overflow-hidden p-6 sm:p-8"
        style={{
          background: "rgba(167,139,250,0.04)",
          borderColor: "rgba(167,139,250,0.2)",
          boxShadow: "0 0 24px rgba(167,139,250,0.08)",
        }}
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-full opacity-20 blur-2xl"
          style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }}
        />
        <p className="relative z-10 mb-2 text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500">Notifications</p>
        <h2 className="relative z-10 mb-6 font-[family-name:var(--font-display)] text-lg font-bold text-white">Telegram alerts</h2>
        <div className="relative z-10">
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
        </div>
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
