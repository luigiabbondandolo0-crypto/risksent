import type { SupabaseClient } from "@supabase/supabase-js";
import type { RiskRulesDTO } from "./riskTypes";

const DEFAULTS: RiskRulesDTO = {
  daily_loss_pct: 5,
  max_risk_per_trade_pct: 1,
  max_exposure_pct: 6,
  revenge_threshold_trades: 3,
};

function fromAppUserRow(row: {
  daily_loss_pct?: number | null;
  max_risk_per_trade_pct?: number | null;
  max_exposure_pct?: number | null;
  revenge_threshold_trades?: number | null;
} | null): RiskRulesDTO {
  if (!row) return { ...DEFAULTS };
  return {
    daily_loss_pct: Number(row.daily_loss_pct) ?? DEFAULTS.daily_loss_pct,
    max_risk_per_trade_pct: Number(row.max_risk_per_trade_pct) ?? DEFAULTS.max_risk_per_trade_pct,
    max_exposure_pct: Number(row.max_exposure_pct) ?? DEFAULTS.max_exposure_pct,
    revenge_threshold_trades: Number(row.revenge_threshold_trades) ?? DEFAULTS.revenge_threshold_trades,
  };
}

/**
 * User-level defaults from app_user; if journalAccountId is set and a row exists in
 * account_risk_rules, those values replace defaults for that account.
 */
export async function loadMergedRiskRules(
  supabase: SupabaseClient,
  userId: string,
  journalAccountId: string | null
): Promise<RiskRulesDTO> {
  const { data: appUser } = await supabase
    .from("app_user")
    .select("daily_loss_pct, max_risk_per_trade_pct, max_exposure_pct, revenge_threshold_trades")
    .eq("id", userId)
    .maybeSingle();

  const base = fromAppUserRow(appUser);

  if (!journalAccountId) {
    return base;
  }

  const { data: acc } = await supabase
    .from("account_risk_rules")
    .select("daily_loss_pct, max_risk_per_trade_pct, max_exposure_pct, revenge_threshold_trades")
    .eq("user_id", userId)
    .eq("account_id", journalAccountId)
    .maybeSingle();

  if (!acc) {
    return base;
  }

  return {
    daily_loss_pct: Number(acc.daily_loss_pct) ?? base.daily_loss_pct,
    max_risk_per_trade_pct: Number(acc.max_risk_per_trade_pct) ?? base.max_risk_per_trade_pct,
    max_exposure_pct: Number(acc.max_exposure_pct) ?? base.max_exposure_pct,
    revenge_threshold_trades: Number(acc.revenge_threshold_trades) ?? base.revenge_threshold_trades,
  };
}
