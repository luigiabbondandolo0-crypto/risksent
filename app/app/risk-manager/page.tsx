"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, FlaskConical } from "lucide-react";
import { useSubscription } from "@/lib/subscription/SubscriptionContext";
import { RiskManagerPageClient } from "@/components/risk-manager/RiskManagerPageClient";
import { NoAccountState } from "@/components/shared/NoAccountState";
import { AddAccountModal } from "@/components/shared/AddAccountModal";
import type { JournalAccountPublic } from "@/lib/journal/journalTypes";

const ALERT_BUTTONS = [
  {
    label: "Daily Drawdown",
    alertType: "daily_drawdown",
    data: { currentDD: 1.8, limitDD: 2.0, balance: 10000 },
  },
  {
    label: "Max Drawdown",
    alertType: "max_drawdown",
    data: { currentDD: 4.5, limitDD: 5.0, balance: 10000 },
  },
  {
    label: "Position Size",
    alertType: "position_size",
    data: { positionSize: 3.2, limit: 2.0, symbol: "EURUSD" },
  },
  {
    label: "Consecutive Losses",
    alertType: "consecutive_losses",
    data: { count: 4, totalLoss: 320 },
  },
  {
    label: "Weekly Loss",
    alertType: "weekly_loss",
    data: { currentLoss: 3.8, limit: 4.0 },
  },
  {
    label: "Overtrading",
    alertType: "overtrading",
    data: { tradesCount: 18, avgTrades: 6 },
  },
  {
    label: "Revenge Trading",
    alertType: "revenge_trading",
    data: { tradesCount: 5, minutes: 12 },
  },
] as const;

type BtnState = "idle" | "loading" | "ok" | "error";

function AdminTestPanel() {
  const [open, setOpen] = useState(false);
  const [states, setStates] = useState<Record<string, BtnState>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fire = async (alertType: string, data: Record<string, unknown>) => {
    setStates((s) => ({ ...s, [alertType]: "loading" }));
    setErrors((e) => { const n = { ...e }; delete n[alertType]; return n; });
    try {
      const res = await fetch("/api/risk/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ alertType, data }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStates((s) => ({ ...s, [alertType]: "error" }));
        setErrors((e) => ({ ...e, [alertType]: json.error ?? "Failed" }));
      } else {
        setStates((s) => ({ ...s, [alertType]: "ok" }));
        setTimeout(() => setStates((s) => ({ ...s, [alertType]: "idle" })), 3000);
      }
    } catch {
      setStates((s) => ({ ...s, [alertType]: "error" }));
      setErrors((e) => ({ ...e, [alertType]: "Request failed" }));
    }
  };

  return (
    <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <FlaskConical className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-slate-200 font-[family-name:var(--font-mono)]">
            Test Alerts
          </span>
          <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
            admin
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.06] px-5 pb-5 pt-4">
              <p className="mb-4 text-xs text-slate-500 font-[family-name:var(--font-mono)]">
                Fires an AI-generated Telegram alert for each type using sample data. Requires a saved chat ID.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {ALERT_BUTTONS.map(({ label, alertType, data }) => {
                  const state = states[alertType] ?? "idle";
                  return (
                    <div key={alertType}>
                      <button
                        type="button"
                        disabled={state === "loading"}
                        onClick={() => fire(alertType, data as Record<string, unknown>)}
                        className={[
                          "w-full rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all font-[family-name:var(--font-mono)]",
                          state === "ok"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : state === "error"
                            ? "border-red-500/30 bg-red-500/10 text-red-300"
                            : state === "loading"
                            ? "border-white/[0.06] bg-white/[0.03] text-slate-500 cursor-wait"
                            : "border-white/[0.08] bg-white/[0.04] text-slate-300 hover:border-amber-400/30 hover:bg-amber-400/5 hover:text-amber-300",
                        ].join(" ")}
                      >
                        {state === "loading"
                          ? "Sending…"
                          : state === "ok"
                          ? "✓ Sent"
                          : label}
                      </button>
                      {state === "error" && errors[alertType] && (
                        <p className="mt-1 text-[10px] text-red-400 font-[family-name:var(--font-mono)] leading-tight">
                          {errors[alertType]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RiskManagerPage() {
  const sub = useSubscription();
  const [accounts, setAccounts] = useState<JournalAccountPublic[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (sub?.isDemoMode) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/journal/accounts");
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          setAccounts(res.ok ? ((data.accounts ?? []) as JournalAccountPublic[]) : []);
        }
      } catch {
        if (!cancelled) setAccounts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sub?.isDemoMode]);

  if (sub?.isDemoMode) {
    return (
      <div className="pointer-events-none select-none opacity-50 blur-[1.5px]">
        <RiskManagerPageClient subscriptionDemo />
      </div>
    );
  }

  if (accounts === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm font-[family-name:var(--font-mono)] text-slate-500">Loading…</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="animate-fade-in">
        <NoAccountState
          title="Set up your account first"
          description="Connect a trading account before configuring your risk rules. Your rules will monitor your live account in real time."
          ctaLabel="Connect your first account"
          onCta={() => setModalOpen(true)}
        />
        <AddAccountModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    );
  }

  return (
    <>
      <RiskManagerPageClient />
      {sub?.isAdmin && <AdminTestPanel />}
    </>
  );
}
