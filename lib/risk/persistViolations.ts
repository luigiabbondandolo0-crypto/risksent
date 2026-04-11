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
  message: string,
  journalAccountId: string | null
): Promise<boolean> {
  const since = new Date(Date.now() - DEDUPE_MINUTES * 60 * 1000).toISOString();
  let q = supabase
    .from("risk_violations")
    .select("id")
    .eq("user_id", userId)
    .eq("rule_type", ruleType)
    .eq("message", message)
    .gte("created_at", since)
    .limit(1);
  q = journalAccountId ? q.eq("account_id", journalAccountId) : q.is("account_id", null);
  const { data } = await q;
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
  /** Journal account scope (null = legacy / user-wide dedupe bucket) */
  journalAccountId: string | null;
  accountNickname: string;
  brokerServer: string | null;
}): Promise<{ inserted: number; candidates: RiskViolationCandidate[] }> {
  const { userId, supabase, rules, live, journalAccountId, accountNickname, brokerServer } = params;
  const candidates = buildViolationCandidates(rules, live);
  if (candidates.length === 0) {
    return { inserted: 0, candidates: [] };
  }

  const notif = await loadNotificationsDefaults(supabase, userId);
  const timeUtc = new Date().toISOString().slice(11, 16) + " UTC";

  let inserted = 0;
  for (const c of candidates) {
    const skip = await shouldSkipDedupe(supabase, userId, c.rule_type, c.message, journalAccountId);
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
        accountNickname,
        brokerServer,
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
      notified_telegram: notified,
      account_id: journalAccountId,
      account_nickname: accountNickname,
      broker_server: brokerServer
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
  journalAccountId: string | null;
  accountNickname: string;
  brokerServer: string | null;
}): Promise<void> {
  try {
    await persistRiskViolations(params);
  } catch (e) {
    console.error("[risk] persistViolations", e);
  }
}
