import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/supabase/requireRouteUser";
import { fetchRiskLiveSnapshot, resolveTradingAccountForUser, tradingAccountLabel } from "@/lib/risk/resolveTradingAccount";
import { persistRiskViolations } from "@/lib/risk/persistViolations";
import type { RiskRulesDTO } from "@/lib/risk/riskTypes";

export async function POST(request: Request) {
  const auth = await requireRouteUser(request);
  if (auth instanceof NextResponse) return auth;
  const { supabase, user } = auth;

  const account = await resolveTradingAccountForUser(supabase, user.id, null);
  if (!account) {
    return NextResponse.json({ violations: [], warning: "No linked trading account" });
  }

  const snap = await fetchRiskLiveSnapshot(account);
  if (!snap) {
    return NextResponse.json({ error: "Failed to load account data" }, { status: 502 });
  }

  const { data: appUser } = await supabase
    .from("app_user")
    .select("daily_loss_pct, max_risk_per_trade_pct, max_exposure_pct, revenge_threshold_trades")
    .eq("id", user.id)
    .maybeSingle();

  const rules: RiskRulesDTO = {
    daily_loss_pct: Number(appUser?.daily_loss_pct) ?? 5,
    max_risk_per_trade_pct: Number(appUser?.max_risk_per_trade_pct) ?? 1,
    max_exposure_pct: Number(appUser?.max_exposure_pct) ?? 6,
    revenge_threshold_trades: Number(appUser?.revenge_threshold_trades) ?? 3
  };

  const live = {
    dailyDdPct: snap.dailyDdPct,
    currentExposurePct: snap.currentExposurePct,
    maxOpenRiskPct: snap.maxOpenRiskPct,
    consecutiveLossesAtEnd: snap.consecutiveLossesAtEnd
  };

  const { candidates } = await persistRiskViolations({
    userId: user.id,
    supabase,
    rules,
    live,
    accountLabel: tradingAccountLabel(snap.account)
  });

  const violations = candidates.map((v) => ({
    rule_type: v.rule_type,
    value_at_violation: v.value_at_violation,
    limit_value: v.limit_value,
    message: v.message,
    severity: v.severity
  }));

  return NextResponse.json({ violations });
}
