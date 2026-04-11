"use client";

import { useCallback, useEffect, useState } from "react";
import { JournalDashboardClient } from "@/components/journal/JournalDashboardClient";
import { NoAccountState } from "@/components/shared/NoAccountState";
import { AddAccountModal } from "@/components/shared/AddAccountModal";
import { AccountSelector, readStoredAccountSelection } from "@/components/shared/AccountSelector";
import type { JournalAccountPublic } from "@/lib/journal/journalTypes";
import { jn } from "@/lib/journal/jnClasses";

export default function JournalingDashboardPage() {
  const [accounts, setAccounts] = useState<JournalAccountPublic[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("all");

  const loadAccounts = useCallback(async () => {
    const res = await fetch("/api/journal/accounts");
    const j = await res.json().catch(() => ({}));
    setAccounts(res.ok ? ((j.accounts ?? []) as JournalAccountPublic[]) : []);
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (accounts == null || accounts.length === 0) return;
    const stored = readStoredAccountSelection();
    if (stored == null || stored === "all") {
      setSelectedId("all");
      return;
    }
    if (accounts.some((a) => a.id === stored)) setSelectedId(stored);
    else setSelectedId("all");
  }, [accounts]);

  const tradeFilter = selectedId === "all" ? null : selectedId;

  if (accounts === null) {
    return (
      <div className={`${jn.page} space-y-6`}>
        <p className="text-slate-500 font-mono text-sm">Loading…</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className={`${jn.page} space-y-6`}>
        <NoAccountState
          title="No trading account connected"
          description="Connect your MT4 or MT5 account to sync your trades and start journaling your performance."
          ctaLabel="Connect your first account"
          onCta={() => setModalOpen(true)}
        />
        <AddAccountModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className={`${jn.page} space-y-6`}>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <AccountSelector
          accounts={accounts}
          selectedId={selectedId}
          onChange={setSelectedId}
          onAddAccount={() => setModalOpen(true)}
        />
      </div>
      <JournalDashboardClient tradeAccountId={tradeFilter} />
      <AddAccountModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
