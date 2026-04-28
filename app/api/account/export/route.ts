import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

/**
 * GET /api/account/export
 * Returns a JSON export of all user data for GDPR Article 20 (data portability).
 * Triggers a file download via Content-Disposition header.
 */
export async function GET() {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  const [profileRes, journalAccountsRes, journalEntriesRes, alertsRes, subscriptionRes] =
    await Promise.all([
      supabase
        .from("app_user")
        .select(
          "id, role, preference_timezone, preference_currency, created_at, updated_at"
        )
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("journal_account")
        .select("id, account_number, platform, broker_server, nickname, created_at")
        .eq("user_id", userId),
      supabase
        .from("journal_entry")
        .select(
          "id, journal_account_id, trade_date, symbol, direction, lots, open_price, close_price, profit, notes, tags, created_at"
        )
        .eq("user_id", userId)
        .order("trade_date", { ascending: false }),
      supabase
        .from("alert")
        .select("id, message, severity, solution, alert_date, rule_type, read, dismissed")
        .eq("user_id", userId)
        .order("alert_date", { ascending: false })
        .limit(500),
      supabase
        .from("subscriptions")
        .select("plan, status, current_period_start, current_period_end, cancel_at_period_end, updated_at")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  const payload = {
    exported_at: new Date().toISOString(),
    user: {
      id: userId,
      email: user.email ?? null,
      created_at: user.created_at ?? null,
      ...(profileRes.data ?? {}),
    },
    subscription: subscriptionRes.data ?? null,
    journal_accounts: journalAccountsRes.data ?? [],
    journal_entries: journalEntriesRes.data ?? [],
    alerts: alertsRes.data ?? [],
  };

  const filename = `risksent-data-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
