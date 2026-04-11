import { NextRequest, NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/supabase/requireRouteUser";
import { loadMergedRiskRules } from "@/lib/risk/loadMergedRiskRules";

function parseBody(body: Record<string, unknown>) {
  const daily_loss_pct = body.daily_loss_pct != null ? Number(body.daily_loss_pct) : undefined;
  const max_risk_per_trade_pct =
    body.max_risk_per_trade_pct != null ? Number(body.max_risk_per_trade_pct) : undefined;
  const max_exposure_pct = body.max_exposure_pct != null ? Number(body.max_exposure_pct) : undefined;
  const revenge_threshold_trades =
    body.revenge_threshold_trades != null ? Number(body.revenge_threshold_trades) : undefined;
  return { daily_loss_pct, max_risk_per_trade_pct, max_exposure_pct, revenge_threshold_trades };
}

export async function GET(request: NextRequest) {
  const auth = await requireRouteUser(request);
  if (auth instanceof NextResponse) return auth;
  const { supabase, user } = auth;

  const accountId = request.nextUrl.searchParams.get("account_id")?.trim();
  if (!accountId) {
    return NextResponse.json({ error: "account_id query parameter required" }, { status: 400 });
  }

  const { data: ja } = await supabase
    .from("journal_account")
    .select("id")
    .eq("id", accountId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ja) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const { data: row } = await supabase
    .from("account_risk_rules")
    .select("id")
    .eq("user_id", user.id)
    .eq("account_id", accountId)
    .maybeSingle();

  const rules = await loadMergedRiskRules(supabase, user.id, accountId);
  return NextResponse.json({
    ...rules,
    has_account_override: Boolean(row)
  });
}

export async function POST(req: NextRequest) {
  return upsertAccountRules(req);
}

export async function PATCH(req: NextRequest) {
  return upsertAccountRules(req);
}

async function upsertAccountRules(req: NextRequest) {
  const auth = await requireRouteUser(req);
  if (auth instanceof NextResponse) return auth;
  const { supabase, user } = auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const accountId = typeof body.account_id === "string" ? body.account_id.trim() : "";
  if (!accountId) {
    return NextResponse.json({ error: "account_id required in body" }, { status: 400 });
  }

  const { data: ja } = await supabase
    .from("journal_account")
    .select("id")
    .eq("id", accountId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ja) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const p = parseBody(body);
  const defaults = await loadMergedRiskRules(supabase, user.id, accountId);

  const next = {
    daily_loss_pct: p.daily_loss_pct ?? defaults.daily_loss_pct,
    max_risk_per_trade_pct: p.max_risk_per_trade_pct ?? defaults.max_risk_per_trade_pct,
    max_exposure_pct: p.max_exposure_pct ?? defaults.max_exposure_pct,
    revenge_threshold_trades: p.revenge_threshold_trades ?? defaults.revenge_threshold_trades
  };

  if (
    next.daily_loss_pct < 0 ||
    next.max_risk_per_trade_pct < 0 ||
    next.max_exposure_pct < 0 ||
    next.revenge_threshold_trades < 0
  ) {
    return NextResponse.json({ error: "Invalid rule values" }, { status: 400 });
  }

  const payload = {
    user_id: user.id,
    account_id: accountId,
    daily_loss_pct: next.daily_loss_pct,
    max_risk_per_trade_pct: next.max_risk_per_trade_pct,
    max_exposure_pct: next.max_exposure_pct,
    revenge_threshold_trades: Math.round(next.revenge_threshold_trades),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from("account_risk_rules").upsert(payload, {
    onConflict: "user_id,account_id"
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    daily_loss_pct: payload.daily_loss_pct,
    max_risk_per_trade_pct: payload.max_risk_per_trade_pct,
    max_exposure_pct: payload.max_exposure_pct,
    revenge_threshold_trades: payload.revenge_threshold_trades,
    has_account_override: true
  });
}
