/**
 * One Telegram / violation burst per (user, journal account, logical rule) within the dedupe window.
 * Historically `alert` and `risk_violations` mixed naming (e.g. max_risk_per_trade vs risk_per_trade).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** Cooldown after the first alert for a rule on an account (dashboard + cron + refresh-safe). */
export const RISK_ALERT_DEDUPE_MS = 45 * 60 * 1000;

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
    case "exposure":
    case "risk_per_trade":
    case "revenge_trading":
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
 * True if this rule already fired on this account recently (either `risk_violations` or `alert`).
 * Cron may only insert `alert`; dashboard inserts both — checks must cover both.
 */
export async function hasRecentRuleNotification(
  supabase: SupabaseClient,
  userId: string,
  ruleType: string,
  journalAccountId: string | null
): Promise<boolean> {
  const since = new Date(Date.now() - RISK_ALERT_DEDUPE_MS).toISOString();
  const aliases = alertRuleTypeAliases(ruleType);

  let vq = supabase
    .from("risk_violations")
    .select("id")
    .eq("user_id", userId)
    .in("rule_type", aliases)
    .gte("created_at", since)
    .limit(1);
  vq = journalAccountId ? vq.eq("account_id", journalAccountId) : vq.is("account_id", null);
  const { data: vrows } = await vq;
  if ((vrows?.length ?? 0) > 0) return true;

  let aq = supabase
    .from("alert")
    .select("id")
    .eq("user_id", userId)
    .in("rule_type", aliases)
    .gte("alert_date", since)
    .limit(1);
  aq = journalAccountId ? aq.eq("account_id", journalAccountId) : aq.is("account_id", null);
  const { data: arows } = await aq;
  return (arows?.length ?? 0) > 0;
}
