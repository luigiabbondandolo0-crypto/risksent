"use client";

import { useEffect, useState } from "react";
import { DashboardAlertsSection } from "@/components/dashboard/DashboardAlertsSection";

type AlertRow = {
  id: string;
  message: string;
  severity: string;
  solution: string | null;
  alert_date: string;
  read: boolean | null;
  dismissed?: boolean | null;
  rule_type?: string | null;
  account_nickname?: string | null;
};

type AlertsOverviewProps = {
  onRefresh?: () => void;
  /** When false, empty state shows “No alerts” (no linked trading account). */
  hasLinkedAccount?: boolean;
  /** When set, skip fetch and show these rows (subscription demo). */
  demoItems?: AlertRow[] | null;
};

export function AlertsOverview({
  onRefresh,
  hasLinkedAccount = true,
  demoItems = null,
}: AlertsOverviewProps) {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (demoItems != null) {
      setAlerts(demoItems);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async (initial: boolean) => {
      try {
        const res = await fetch("/api/alerts", { cache: "no-store" });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setAlerts(data.alerts ?? []);
        }
      } finally {
        if (initial && !cancelled) setLoading(false);
      }
    };

    void load(true);
    const id = window.setInterval(() => void load(false), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [onRefresh, demoItems]);

  return (
    <DashboardAlertsSection
      items={alerts}
      loading={loading}
      maxItems={4}
      viewAllHref="/app/risk-manager"
      viewAllLabel="Open Risk Manager"
      subtitle="Unread items that need attention"
      emptyHeadline={hasLinkedAccount ? undefined : "No alerts"}
      emptyDescription={
        hasLinkedAccount
          ? undefined
          : "Link a trading account to receive live risk alerts."
      }
    />
  );
}
