import type { SupabaseClient } from "@supabase/supabase-js";
import type { RiskNotificationsRow, RiskRulesDTO, RiskViolationCandidate, LiveStatsForRisk, RiskRuleType } from "./riskTypes";
import {
  buildViolationCandidates,
  effectiveNotifySettings,
  notifyFlagForRule
} from "./violationEngine";
import { canonicalAlertRuleType, hasRecentAlertRow } from "./alertRuleDedupe";

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
  /** IANA timezone for "today" resolution */
  timeZone?: string;
}): Promise<{ inserted: number; candidates: RiskViolationCandidate[] }> {
  const {
    userId,
    supabase,
    rules,
    live,
    journalAccountId,
    accountNickname,
    brokerServer,
  } = params;
  const candidates = buildViolationCandidates(rules, live);
  // This path runs only from GET /api/dashboard-stats and POST /api/risk/check — never from
  // /api/cron/check-risk-all (that uses runRiskCheckForAccount in riskCheckRun.ts only).
  // Telegram alerts are sent exclusively by riskCheckRun.ts (cron/button) to prevent
  // duplicate notifications from concurrent dashboard-stats calls.
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
    notify_daily_dd: notif?.notify_daily_dd ?? null,
    effective_daily_dd: effectiveNotif.notify_daily_dd,
    notify_consecutive_losses: notif?.notify_consecutive_losses ?? null,
    notify_revenge: notif?.notify_revenge ?? null,
    candidatesCount: candidates.length
  });

  let inserted = 0;
  for (const c of candidates) {
    // User turned off notifications for this rule → fully silent.
    const allowed = notifyFlagForRule(c.rule_type, effectiveNotif);
    console.log("[persistRiskViolations] gate", {
      rule_type: c.rule_type,
      allowed,
      hasNotif: !!notif
    });
    if (!allowed) {
      continue;
    }

    // Dedupe: only check alert table (UI state). risk_violations dedupe is owned by riskCheckRun.
    const skipDup = await hasRecentAlertRow(supabase, userId, c.rule_type, journalAccountId);
    if (skipDup) continue;

    const canonicalType = canonicalAlertRuleType(c.rule_type);

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
      console.error("[persistRiskViolations] alert insert failed", alertErr);
    } else {
      inserted += 1;
    }

    // Also mirror to risk_violations for history/audit (notified_telegram=false: Telegram
    // is sent by riskCheckRun.ts, not here).
    const { error: histErr } = await supabase.from("risk_violations").insert({
      user_id: userId,
      rule_type: canonicalType,
      value_at_violation: c.value_at_violation,
      limit_value: c.limit_value,
      message: c.message,
      notified_telegram: false,
      account_id: journalAccountId,
      account_nickname: accountNickname,
      broker_server: brokerServer
    });
    if (histErr) {
      console.error("[persistRiskViolations] risk_violations insert failed", histErr);
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
  timeZone?: string;
}): Promise<void> {
  try {
    await persistRiskViolations(params);
  } catch (e) {
    console.error("[risk] persistViolations", e);
  }
}
