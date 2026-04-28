"use client";

import { useEffect, useState } from "react";
import { useSubscription } from "@/lib/subscription/SubscriptionContext";
import { AiCoachPageClient } from "@/components/ai-coach/AiCoachPageClient";
import { NoAccountState } from "@/components/shared/NoAccountState";
import { PlanGateWall } from "@/components/shared/PlanGateWall";
import { AddAccountModal } from "@/components/journal/AddAccountModal";
import type { JournalAccountPublic } from "@/lib/journal/journalTypes";

export default function AiCoachPage() {
  const sub = useSubscription();
  const [accounts, setAccounts] = useState<JournalAccountPublic[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [accountReloadToken, setAccountReloadToken] = useState(0);

  useEffect(() => {
    if (!sub || sub.isDemoMode || !sub.canAccessAICoach) return;

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
    return () => { cancelled = true; };
  }, [sub?.isDemoMode, sub?.canAccessAICoach, accountReloadToken]);

  if (sub?.isDemoMode) {
    return (
      <div className="pointer-events-none select-none opacity-50 blur-[1.5px]">
        <AiCoachPageClient isMock />
      </div>
    );
  }

  if (sub && !sub.canAccessAICoach) {
    return (
      <PlanGateWall
        feature="AI Coach"
        description="Upgrade to the Experienced plan to get personalised trading psychology reports and chat with your data."
      />
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
          title="Connect your trading account"
          description="Add a broker account in the journal to run AI Coach reports and chat about your real trading data."
          ctaLabel="Connect your first account"
          onCta={() => setModalOpen(true)}
        />
        <AddAccountModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            setAccountReloadToken((t) => t + 1);
          }}
        />
      </div>
    );
  }

  return <AiCoachPageClient />;
}
