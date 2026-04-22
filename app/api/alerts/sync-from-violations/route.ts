import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

type ViolationRow = {
  user_id: string;
  rule_type: string;
  message: string;
  account_id: string | null;
  account_nickname: string | null;
  created_at: string;
};

type AlertSignatureRow = {
  rule_type: string | null;
  message: string;
  account_id: string | null;
};

const HIGH_RULE_TYPES = new Set([
  "daily_dd",
  "daily_loss",
  "daily_drawdown",
  "max_dd",
  "max_drawdown",
  "revenge",
  "revenge_trading",
  "consecutive_losses"
]);

function solutionForRule(ruleType: string): string {
  const t = ruleType.toLowerCase();
  if (t === "daily_dd" || t === "daily_loss" || t === "daily_drawdown")
    return "Stop trading today and review your daily loss limit. Resume tomorrow.";
  if (t === "max_dd" || t === "max_drawdown")
    return "Review open exposure and reduce risk until the account recovers.";
  if (t === "exposure" || t === "risk_per_trade" || t === "position_size" || t === "max_risk_per_trade" || t === "current_exposure")
    return "Reduce open exposure or position size to respect your limits.";
  if (t === "revenge" || t === "revenge_trading")
    return "Step away from the charts. Revenge trading locked in — take a break before reopening.";
  if (t === "consecutive_losses")
    return "Pause trading after consecutive losses. Review the last setups before taking the next trade.";
  if (t === "overtrading")
    return "You're trading above your average pace. Slow down and focus on quality setups.";
  return "Review Risk Manager and adjust your current risk.";
}

function signature(ruleType: string, message: string, accountId: string | null): string {
  return `${ruleType}::${message}::${accountId ?? ""}`;
}

/**
 * POST /api/alerts/sync-from-violations
 *
 * For every row in `risk_violations` belonging to the current user that does
 * not have a matching row in `alert` (same rule_type + message + account_id),
 * create the alert mirror. Used as a fallback when the DB backfill migration
 * hasn't been applied yet, so the Dashboard Live Alerts and Topbar bell can
 * instantly catch up with the Risk Manager violation history.
 */
export async function POST() {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [violationsRes, alertsRes] = await Promise.all([
    supabase
      .from("risk_violations")
      .select("user_id, rule_type, message, account_id, account_nickname, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("alert")
      .select("rule_type, message, account_id")
      .eq("user_id", user.id)
      .limit(500)
  ]);

  if (violationsRes.error) {
    return NextResponse.json({ error: violationsRes.error.message }, { status: 500 });
  }
  if (alertsRes.error) {
    return NextResponse.json({ error: alertsRes.error.message }, { status: 500 });
  }

  const existing = new Set(
    (alertsRes.data ?? []).map((a) => {
      const row = a as AlertSignatureRow;
      return signature(row.rule_type ?? "", row.message, row.account_id);
    })
  );

  const toInsert = (violationsRes.data ?? [])
    .map((v) => v as ViolationRow)
    .filter((v) => !existing.has(signature(v.rule_type, v.message, v.account_id)))
    .map((v) => ({
      user_id: v.user_id,
      message: v.message,
      severity: HIGH_RULE_TYPES.has(v.rule_type.toLowerCase()) ? "high" : "medium",
      solution: solutionForRule(v.rule_type),
      rule_type: v.rule_type,
      account_id: v.account_id,
      account_nickname: v.account_nickname,
      alert_date: v.created_at
    }));

  if (toInsert.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0 });
  }

  const { error: insertErr, count } = await supabase
    .from("alert")
    .insert(toInsert, { count: "exact" });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, inserted: count ?? toInsert.length });
}
