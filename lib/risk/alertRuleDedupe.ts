/**
 * One Telegram / violation burst per (user, journal account, logical rule) within the dedupe window.
 * Historically `alert` and `risk_violations` mixed naming (e.g. max_risk_per_trade vs risk_per_trade).
 *
 * Dedupe strategy by category:
 *  - "live"       (overtrading): 45-min cooldown
 *  - "static"     (consecutive_losses, max_dd, exposure): 24h window; re-notify only if value worsened
 *  - "daily"      (daily_dd): same UTC day; re-notify only if value worsened by >0.5%
 *  - "once_daily" (daily_dd tiers, revenge_trading): same UTC day; fire exactly once, no re-notify
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** Cooldown for live rules (change with open trades). */
export const RISK_ALERT_DEDUPE_MS = 45 * 60 * 1000;

/** Cooldown for static/daily rules (based on closed-trade history). */
const STATIC_DEDUPE_MS = 24 * 60 * 60 * 1000;

/** Minimum worsening (absolute) to re-notify within the static window. */
const STATIC_REWARN_THRESHOLD = 0.5;

function startOfUtcDay(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfPreviousUtcDay(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function ruleCategory(ruleType: string): "live" | "static" | "daily" | "once_daily" {
  const c = canonicalAlertRuleType(ruleType);
  switch (c) {
    case "daily_dd":
    case "daily_dd_50":
    case "daily_dd_75":
    case "daily_dd_100":
    case "daily_dd_150":
      return "once_daily";
    case "max_dd":
    case "consecutive_losses":
      return "static";
    case "exposure":
      return "static"; // 24h cooldown, re-notify on worsening (approaching alert)
    case "exposure_100":
    case "exposure_150":
      return "once_daily";
    case "revenge_trading":
    case "revenge_trading_exceeded":
      return "once_daily"; // once per UTC day, no re-notify
    default:
      return "live";
  }
}

/** Normalized key stored on new rows and used for dedupe lookups. */
export function canonicalAlertRuleType(ruleType: string): string {
  const t = String(ruleType ?? "").trim().toLowerCase();
  switch (t) {
    case "daily_loss":
    case "daily_drawdown":
      return "daily_dd";
    case "max_drawdown":
    case "max_dd":
      return "max_dd";
    case "current_exposure":
    case "position_size":
      return "exposure";
    case "max_risk_per_trade":
      return "risk_per_trade";
    case "revenge":
      return "revenge_trading";
    case "daily_dd":
    case "daily_dd_50":
    case "daily_dd_75":
    case "daily_dd_100":
    case "daily_dd_150":
    case "exposure":
    case "exposure_100":
    case "exposure_150":
    case "risk_per_trade":
    case "revenge_trading":
    case "revenge_trading_exceeded":
    case "consecutive_losses":
    case "overtrading":
      return t;
    default:
      return t;
  }
}

/** All historical `rule_type` values that denote the same logical rule. */
export function alertRuleTypeAliases(ruleType: string): string[] {
  const c = canonicalAlertRuleType(ruleType);
  switch (c) {
    case "daily_dd":
      return ["daily_dd", "daily_loss", "daily_drawdown"];
    case "daily_dd_50":
      return ["daily_dd_50"];
    case "daily_dd_75":
      return ["daily_dd_75"];
    case "daily_dd_100":
      return ["daily_dd_100"];
    case "daily_dd_150":
      return ["daily_dd_150"];
    case "exposure_100":
      return ["exposure_100"];
    case "exposure_150":
      return ["exposure_150"];
    case "revenge_trading_exceeded":
      return ["revenge_trading_exceeded"];
    case "max_dd":
      return ["max_dd", "max_drawdown"];
    case "exposure":
      return ["exposure", "current_exposure", "position_size"];
    case "risk_per_trade":
      return ["risk_per_trade", "max_risk_per_trade"];
    case "revenge_trading":
      return ["revenge_trading", "revenge"];
    case "consecutive_losses":
      return ["consecutive_losses"];
    case "overtrading":
      return ["overtrading"];
    default:
      return [c];
  }
}

/**
 * True if this rule already fired a Telegram notification on this account recently.
 * Checks only `risk_violations` — the table written by riskCheckRun (cron/button).
 * `persistViolations` (dashboard) writes only to `alert` (UI state) and is excluded
 * intentionally so dashboard loads do not suppress cron/button Telegram alerts.
 *
 * @param currentValue - current metric value; passed for static/daily rules to detect worsening
 */
export async function hasRecentRuleNotification(
  supabase: SupabaseClient,
  userId: string,
  ruleType: string,
  journalAccountId: string | null,
  currentValue?: number
): Promise<boolean> {
  const category = ruleCategory(ruleType);
  const aliases = alertRuleTypeAliases(ruleType);

  let since: string;
  if (category === "daily" || category === "once_daily") {
    since = startOfUtcDay();
  } else if (category === "static") {
    since = new Date(Date.now() - STATIC_DEDUPE_MS).toISOString();
  } else {
    since = new Date(Date.now() - RISK_ALERT_DEDUPE_MS).toISOString();
  }

  let vq = supabase
    .from("risk_violations")
    .select("id, value_at_violation")
    .eq("user_id", userId)
    .in("rule_type", aliases)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1);
  vq = journalAccountId ? vq.eq("account_id", journalAccountId) : vq.is("account_id", null);
  const { data: vrows } = await vq;

  if (!vrows || vrows.length === 0) {
    // Nothing found in today's window. For once_daily rules, also check yesterday:
    // if the same violation fired yesterday the condition is carrying over from the
    // previous day (e.g. midnight UTC reset while condition still active) — suppress.
    if (category === "once_daily") {
      let yq = supabase
        .from("risk_violations")
        .select("id")
        .eq("user_id", userId)
        .in("rule_type", aliases)
        .gte("created_at", startOfPreviousUtcDay())
        .lt("created_at", startOfUtcDay())
        .limit(1);
      yq = journalAccountId ? yq.eq("account_id", journalAccountId) : yq.is("account_id", null);
      const { data: yrows } = await yq;
      if (yrows && yrows.length > 0) return true; // carry-over violation, suppress midnight re-fire
    }
    return false;
  }

  // "once_daily": fired today → always skip, no worsening re-notify.
  if (category === "once_daily") return true;

  // For static/daily rules: re-notify if the value worsened beyond the threshold.
  // "worsened" = higher absolute value (more losses, deeper drawdown).
  if ((category === "static" || category === "daily") && currentValue !== undefined) {
    const row = vrows[0] as { value_at_violation?: number | null };
    const lastValue = typeof row.value_at_violation === "number" ? row.value_at_violation : null;
    if (lastValue !== null && Math.abs(currentValue) - Math.abs(lastValue) >= STATIC_REWARN_THRESHOLD) {
      // Situation worsened — not a duplicate
      return false;
    }
  }

  return true;
}

/**
 * True if this rule already created an alert UI row on this account recently.
 * Used by persistViolations to deduplicate `alert` table inserts from dashboard loads.
 */
export async function hasRecentAlertRow(
  supabase: SupabaseClient,
  userId: string,
  ruleType: string,
  journalAccountId: string | null
): Promise<boolean> {
  const since = new Date(Date.now() - RISK_ALERT_DEDUPE_MS).toISOString();
  const aliases = alertRuleTypeAliases(ruleType);

  let aq = supabase
    .from("alert")
    .select("id")
    .eq("user_id", userId)
    .in("rule_type", aliases)
    .eq("dismissed", false)
    .gte("alert_date", since)
    .limit(1);
  aq = journalAccountId ? aq.eq("account_id", journalAccountId) : aq.is("account_id", null);
  const { data: arows } = await aq;
  return (arows?.length ?? 0) > 0;
}
