import type { SupabaseClient } from "@supabase/supabase-js";
import type { RiskNotificationsRow, RiskRulesDTO, RiskViolationCandidate, LiveStatsForRisk } from "./riskTypes";
import {
  buildViolationCandidates,
  formatLimitForTelegram,
  formatValueForTelegram,
  notifyFlagForRule
} from "./violationEngine";
import { formatViolationTelegramMessage, ruleTypeToLabel, sendTelegramRiskMessage } from "./telegramRisk";

const DEDUPE_MINUTES = 30;

async function shouldSkipDedupe(
  supabase: SupabaseClient,
  userId: string,
  ruleType: string,
  message: string
): Promise<boolean> {
  const since = new Date(Date.now() - DEDUPE_MINUTES * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("risk_violations")
    .select("id")
    .eq("user_id", userId)
    .eq("rule_type", ruleType)
    .eq("message", message)
    .gte("created_at", since)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function loadNotificationsDefaults(supabase: SupabaseClient, userId: string): Promise<RiskNotificationsRow | null> {
  const { data } = await supabase.from("risk_notifications").select("*").eq("user_id", userId).maybeSingle();
  return data as RiskNotificationsRow | null;
}

export async function persistRiskViolations(params: {
  userId: string;
  supabase: SupabaseClient;
  rules: RiskRulesDTO;
  live: LiveStatsForRisk;
  accountLabel: string;
}): Promise<{ inserted: number; candidates: RiskViolationCandidate[] }> {
  const { userId, supabase, rules, live, accountLabel } = params;
  const candidates = buildViolationCandidates(rules, live);
  if (candidates.length === 0) {
    return { inserted: 0, candidates: [] };
  }

  const notif = await loadNotificationsDefaults(supabase, userId);
  const timeUtc = new Date().toISOString().slice(11, 16) + " UTC";

  let inserted = 0;
  for (const c of candidates) {
    const skip = await shouldSkipDedupe(supabase, userId, c.rule_type, c.message);
    if (skip) continue;

    let notified = false;
    if (
      notif?.telegram_enabled &&
      notif.telegram_chat_id &&
      notifyFlagForRule(c.rule_type, notif)
    ) {
      const text = formatViolationTelegramMessage({
        ruleLabel: ruleTypeToLabel(c.rule_type),
        current: formatValueForTelegram(c.rule_type, c.value_at_violation),
        limit: formatLimitForTelegram(c.rule_type, c.limit_value),
        account: accountLabel,
        timeUtc
      });
      const send = await sendTelegramRiskMessage(notif.telegram_chat_id, text);
      notified = send.ok;
    }

    const { error } = await supabase.from("risk_violations").insert({
      user_id: userId,
      rule_type: c.rule_type,
      value_at_violation: c.value_at_violation,
      limit_value: c.limit_value,
      message: c.message,
      notified_telegram: notified
    });
    if (!error) inserted += 1;
  }

  return { inserted, candidates };
}

export async function runDashboardRiskViolationSideEffect(params: {
  userId: string;
  supabase: SupabaseClient;
  rules: RiskRulesDTO;
  live: LiveStatsForRisk;
  accountLabel: string;
}): Promise<void> {
  try {
    await persistRiskViolations(params);
  } catch (e) {
    console.error("[risk] persistViolations", e);
  }
}
