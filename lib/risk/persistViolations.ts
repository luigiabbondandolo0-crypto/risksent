import type { SupabaseClient } from "@supabase/supabase-js";
import type { RiskNotificationsRow, RiskRulesDTO, RiskViolationCandidate, LiveStatsForRisk, RiskRuleType } from "./riskTypes";
import {
  buildViolationCandidates,
  formatLimitForTelegram,
  formatValueForTelegram,
  effectiveNotifySettings,
  notifyFlagForRule
} from "./violationEngine";
import { ruleTypeToLabel, sendSmartTelegramAlert } from "./telegramRisk";
import { canonicalAlertRuleType, hasRecentRuleNotification } from "./alertRuleDedupe";

function solutionForRule(ruleType: RiskRuleType): string {
  switch (ruleType) {
    case "daily_dd":
      return "Stop trading today and review your daily loss limit. Resume tomorrow.";
    case "exposure":
      return "Reduce open exposure — close or downsize positions to respect the portfolio limit.";
    case "risk_per_trade":
      return "Close or downsize the largest open position to respect the per-trade risk limit.";
    case "revenge":
    case "revenge_trading":
      return "Step away from the charts. Revenge trading locked in — take a break before reopening.";
    case "consecutive_losses":
      return "Pause trading after consecutive losses. Review the last setups before taking the next trade.";
    case "overtrading":
      return "You're trading above your average pace. Slow down and focus on quality setups.";
    default:
      return "Review Risk Manager and adjust your current risk.";
  }
}

export type TelegramAlertContext = {
  todayTrades: number;
  todayPl: number;
  currency: string;
};

async function loadTelegramAlertContext(
  supabase: SupabaseClient,
  userId: string,
  journalAccountId: string
): Promise<TelegramAlertContext> {
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const iso = dayStart.toISOString();

  const [accRes, tradesRes] = await Promise.all([
    supabase
      .from("journal_account")
      .select("currency")
      .eq("id", journalAccountId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("journal_trade")
      .select("pl")
      .eq("user_id", userId)
      .eq("account_id", journalAccountId)
      .eq("status", "closed")
      .gte("close_time", iso)
  ]);

  const currency = String(accRes.data?.currency ?? "USD");
  const rows = tradesRes.data ?? [];
  const todayTrades = rows.length;
  const todayPl = rows.reduce((s, r) => s + Number(r.pl ?? 0), 0);
  return { todayTrades, todayPl, currency };
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
  /** Optional; when omitted and journalAccountId is set, loaded from journal + today's trades */
  telegramAlertContext?: TelegramAlertContext;
}): Promise<{ inserted: number; candidates: RiskViolationCandidate[] }> {
  const {
    userId,
    supabase,
    rules,
    live,
    journalAccountId,
    accountNickname,
    brokerServer,
    telegramAlertContext: contextOverride
  } = params;
  const candidates = buildViolationCandidates(rules, live);
  // This path runs only from GET /api/dashboard-stats and POST /api/risk/check — never from
  // /api/cron/check-risk-all (that uses runRiskCheckForAccount in riskCheckRun.ts only).
  console.log("[persistRiskViolations] entry", {
    userId: userId.slice(0, 8) + "...",
    journalAccountId: journalAccountId?.slice(0, 8) ?? null,
    candidatesCount: candidates.length,
    liveSnapshot: {
      dailyDdPct: live.dailyDdPct,
      currentExposurePct: live.currentExposurePct,
      maxOpenRiskPct: live.maxOpenRiskPct,
      consecutiveLossesAtEnd: live.consecutiveLossesAtEnd,
      todayTrades: live.todayTrades ?? null,
      avgTradesPerDay: live.avgTradesPerDay ?? null
    }
  });
  if (candidates.length === 0) {
    console.log("[persistRiskViolations] exit: zero candidates (no rule near breach — no notif / gate logs)");
    return { inserted: 0, candidates: [] };
  }

  const notif = await loadNotificationsDefaults(supabase, userId);
  const effectiveNotif = effectiveNotifySettings(notif);
  console.log("[persistRiskViolations] notif loaded", {
    userId: userId.slice(0, 8) + "...",
    hasRow: !!notif,
    telegram_enabled: notif?.telegram_enabled ?? null,
    notify_daily_dd: notif?.notify_daily_dd ?? null,
    effective_daily_dd: effectiveNotif.notify_daily_dd,
    notify_max_dd: (notif as { notify_max_dd?: boolean | null } | null)?.notify_max_dd ?? null,
    notify_position_size: (notif as { notify_position_size?: boolean | null } | null)?.notify_position_size ?? null,
    notify_consecutive_losses: notif?.notify_consecutive_losses ?? null,
    notify_weekly_loss: (notif as { notify_weekly_loss?: boolean | null } | null)?.notify_weekly_loss ?? null,
    notify_overtrading: (notif as { notify_overtrading?: boolean | null } | null)?.notify_overtrading ?? null,
    notify_revenge: notif?.notify_revenge ?? null,
    candidatesCount: candidates.length
  });

  let enrich: TelegramAlertContext = {
    todayTrades: 0,
    todayPl: 0,
    currency: "USD"
  };
  if (contextOverride) {
    enrich = contextOverride;
  } else if (journalAccountId) {
    enrich = await loadTelegramAlertContext(supabase, userId, journalAccountId);
  }

  let inserted = 0;
  for (const c of candidates) {
    // User turned off notifications for this rule → don't persist anything.
    // This suppresses the Telegram message, the violation history entry, AND the
    // Dashboard / Topbar alert mirror. A disabled rule is fully silent.
    const allowed = notifyFlagForRule(c.rule_type, effectiveNotif);
    console.log("[persistRiskViolations] gate", {
      rule_type: c.rule_type,
      allowed,
      hasNotif: !!notif
    });
    if (!allowed) {
      continue;
    }

    const skipDup = await hasRecentRuleNotification(supabase, userId, c.rule_type, journalAccountId);
    const canonicalType = canonicalAlertRuleType(c.rule_type);

    if (!skipDup) {
      let notified = false;
      if (notif?.telegram_enabled && notif.telegram_chat_id) {
        const send = await sendSmartTelegramAlert({
          chatId: notif.telegram_chat_id,
          ruleType: c.rule_type,
          ruleLabel: ruleTypeToLabel(c.rule_type),
          current: formatValueForTelegram(c.rule_type, c.value_at_violation),
          limit: formatLimitForTelegram(c.rule_type, c.limit_value),
          accountNickname,
          brokerServer: brokerServer?.trim() ?? "",
          currency: enrich.currency,
          todayTrades: enrich.todayTrades,
          todayPl: enrich.todayPl,
          consecutiveLosses: live.consecutiveLossesAtEnd
        });
        notified = send.ok;
      }

      const { error: histErr } = await supabase.from("risk_violations").insert({
        user_id: userId,
        rule_type: canonicalType,
        value_at_violation: c.value_at_violation,
        limit_value: c.limit_value,
        message: c.message,
        notified_telegram: notified,
        account_id: journalAccountId,
        account_nickname: accountNickname,
        broker_server: brokerServer
      });
      if (histErr) {
        console.error("[persistRiskViolations] risk_violations insert failed", histErr);
      } else {
        inserted += 1;
      }

      const { error: alertErr } = await supabase.from("alert").insert({
        user_id: userId,
        message: c.message,
        severity: c.severity === "danger" ? "high" : "medium",
        solution: solutionForRule(c.rule_type),
        rule_type: canonicalType,
        account_id: journalAccountId,
        account_nickname: accountNickname
      });
      if (alertErr) {
        console.error("[persistRiskViolations] alert mirror failed", alertErr);
      }
    }
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
  telegramAlertContext?: TelegramAlertContext;
}): Promise<void> {
  try {
    await persistRiskViolations(params);
  } catch (e) {
    console.error("[risk] persistViolations", e);
  }
}
