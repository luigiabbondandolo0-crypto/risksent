import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { getAccountSummary, accountSelectColumns, type TradingAccountRow } from "@/lib/tradingApi";

/**
 * GET /api/monitoring/status
 * Returns connection status for the trading data layer and Supabase (for live-monitoring page).
 */
export async function GET() {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs: { time: string; source: string; ok: boolean; message: string; detail?: string }[] = [];
  const t = () => new Date().toISOString();

  // Supabase
  try {
    const { data, error } = await supabase
      .from("app_user")
      .select("id")
      .eq("id", user.id)
      .limit(1)
      .single();
    if (error) {
      logs.push({ time: t(), source: "Supabase", ok: false, message: "DB query failed", detail: error.message });
    } else {
      logs.push({ time: t(), source: "Supabase", ok: true, message: "Connected", detail: data ? "User row found" : "No row" });
    }
  } catch (e) {
    logs.push({ time: t(), source: "Supabase", ok: false, message: "Exception", detail: e instanceof Error ? e.message : String(e) });
  }

  // Trading provider: first linked account then AccountSummary (stub until new provider)
  let tradingOk = false;
  const { data: accounts } = await supabase
    .from("trading_account")
    .select(accountSelectColumns())
    .eq("user_id", user.id)
    .not("metaapi_account_id", "is", null)
    .limit(1);
  const accountRow = accounts?.[0] as TradingAccountRow | undefined;
  if (!accountRow?.metaapi_account_id) {
    logs.push({ time: t(), source: "TradingAPI", ok: false, message: "No linked account (session token)" });
  } else {
    try {
      const result = await getAccountSummary(accountRow);
      tradingOk = result.ok && result.summary != null;
      if (result.ok && result.summary) {
        logs.push({
          time: t(),
          source: "TradingAPI",
          ok: true,
          message: "Account summary OK",
          detail: `balance=${result.summary.balance}`
        });
      } else {
        logs.push({ time: t(), source: "TradingAPI", ok: false, message: result.error ?? "AccountSummary failed", detail: result.error });
      }
    } catch (e) {
      logs.push({ time: t(), source: "TradingAPI", ok: false, message: "Request failed", detail: e instanceof Error ? e.message : String(e) });
    }
  }

  const supabaseOk = logs.some((l) => l.source === "Supabase" && l.ok);
  return NextResponse.json({
    ok: supabaseOk && (tradingOk || !accountRow?.metaapi_account_id),
    timestamp: new Date().toISOString(),
    logs,
    summary: {
      supabase: supabaseOk ? "connected" : "error",
      trading: !accountRow ? "no_account" : tradingOk ? "connected" : "error"
    }
  });
}
