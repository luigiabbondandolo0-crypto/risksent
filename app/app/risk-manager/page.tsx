"use client";

import { useEffect, useState } from "react";
import { useSubscription } from "@/lib/subscription/SubscriptionContext";
import { DemoRiskManager } from "@/components/demo/DemoRiskManager";
import { RiskManagerPageClient } from "@/components/risk-manager/RiskManagerPageClient";
import { NoAccountState } from "@/components/shared/NoAccountState";
import { AddAccountModal } from "@/components/shared/AddAccountModal";
import type { JournalAccountPublic } from "@/lib/journal/journalTypes";

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
    return <DemoRiskManager />;
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

  return <RiskManagerPageClient />;
}
