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
  rule_type?: string | null;
};

type AlertsOverviewProps = {
  onRefresh?: () => void;
};

export function AlertsOverview({ onRefresh }: AlertsOverviewProps) {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/alerts", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.alerts ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [onRefresh]);

  return (
    <DashboardAlertsSection
      items={alerts}
      loading={loading}
      maxItems={4}
      viewAllHref="/rules#alerts"
      viewAllLabel="Open alerts center"
      subtitle="Unread items that need attention"
    />
  );
}
