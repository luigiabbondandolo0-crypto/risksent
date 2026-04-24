import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const journalAccountId = req.nextUrl.searchParams.get("journal_account_id")?.trim() ?? "";
  if (!journalAccountId) {
    return NextResponse.json(
      { error: "journal_account_id query parameter is required" },
      { status: 400 }
    );
  }

  const { data: accountRow, error: accountErr } = await supabase
    .from("journal_account")
    .select("id")
    .eq("id", journalAccountId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (accountErr) {
    return NextResponse.json({ error: accountErr.message }, { status: 500 });
  }
  if (!accountRow) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("ai_coach_report")
    .select(
      "id, user_id, journal_account_id, created_at, model, trades_analyzed, period_from, period_to, report"
    )
    .eq("user_id", user.id)
    .eq("journal_account_id", journalAccountId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reports: data ?? [] });
}
