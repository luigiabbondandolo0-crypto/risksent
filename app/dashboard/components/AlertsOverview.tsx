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

/** Same “high” rules as Risk Manager ViolationTimeline (red dot). */
const HIGH_SEVERITY_RULES = new Set([
  "daily_dd",
  "daily_drawdown",
  "daily_loss",
  "max_dd",
  "max_drawdown",
  "consecutive_losses",
  "revenge",
  "revenge_trading"
]);

function solutionLineForRule(ruleType: string): string {
  const t = ruleType.toLowerCase();
  if (t === "daily_dd" || t === "daily_loss" || t === "daily_drawdown")
    return "Stop trading today and review your daily loss limit. Resume tomorrow.";
  if (
    t === "exposure" ||
    t === "risk_per_trade" ||
    t === "position_size" ||
    t === "max_risk_per_trade" ||
    t === "current_exposure"
  )
    return "Reduce open exposure or position size to respect your limits.";
  if (t === "revenge" || t === "revenge_trading")
    return "Step away from the charts — take a break before reopening.";
  if (t === "consecutive_losses") return "Pause and review the last setups before the next trade.";
  if (t === "overtrading") return "Slow down and focus on quality setups.";
  if (t === "weekly_loss" || t === "weekly_dd" || t === "weekly_drawdown")
    return "Reduce size for the rest of the week to stay within the weekly cap.";
  return "Review Risk Manager and adjust your current risk.";
}

type ApiViolation = {
  id: string;
  rule_type: string;
  message: string;
  created_at: string;
  account_nickname?: string | null;
};

function mapViolationToAlertRow(v: ApiViolation): AlertRow {
  const t = (v.rule_type ?? "").toLowerCase();
  const high = HIGH_SEVERITY_RULES.has(t);
  return {
    id: v.id,
    message: v.message,
    severity: high ? "high" : "medium",
    solution: solutionLineForRule(t),
    alert_date: v.created_at,
    read: true,
    dismissed: false,
    rule_type: v.rule_type,
    account_nickname: v.account_nickname ?? null
  };
}

type AlertsOverviewProps = {
  onRefresh?: () => void;
  /** When false, empty state shows “No alerts” (no linked trading account). */
  hasLinkedAccount?: boolean;
  /** When set, skip fetch and show these rows (subscription demo). */
  demoItems?: AlertRow[] | null;
  /** Journal account id from the global account switcher; violations are scoped like Risk Manager. */
  selectedAccountId?: "all" | string;
};

export function AlertsOverview({
  onRefresh,
  hasLinkedAccount = true,
  demoItems = null,
  selectedAccountId = "all"
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
        const params = new URLSearchParams({ limit: "30" });
        if (selectedAccountId !== "all") {
          params.set("account_id", selectedAccountId);
        }
        const res = await fetch(`/api/risk/violations?${params.toString()}`, { cache: "no-store" });
        if (res.ok && !cancelled) {
          const data = (await res.json()) as { violations?: ApiViolation[] };
          const rows = (data.violations ?? []).map(mapViolationToAlertRow);
          setAlerts(rows);
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
  }, [onRefresh, demoItems, selectedAccountId]);

  return (
    <DashboardAlertsSection
      items={alerts}
      loading={loading}
      maxItems={4}
      viewAllHref="/app/risk-manager"
      viewAllLabel="Open Risk Manager"
      subtitle="Same items as violation history in Risk Manager"
      emptyHeadline={hasLinkedAccount ? undefined : "No alerts"}
      emptyDescription={
        hasLinkedAccount
          ? undefined
          : "Link a trading account to receive live risk alerts."
      }
    />
  );
}
