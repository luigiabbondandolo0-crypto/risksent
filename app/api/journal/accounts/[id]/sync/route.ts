import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { syncJournalAccountFromMetaApi } from "@/lib/journal/metaApiJournalSync";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: row, error: fetchErr } = await supabase
    .from("journal_account")
    .select(
      "id, user_id, nickname, broker_server, account_number, platform, currency, initial_balance, current_balance, status, metaapi_account_id, last_synced_at, created_at"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sync = await syncJournalAccountFromMetaApi(supabase, user.id, {
    id: row.id,
    metaapi_account_id: row.metaapi_account_id,
    platform: String(row.platform ?? "MT5"),
    broker_server: String(row.broker_server ?? ""),
    account_number: String(row.account_number ?? "")
  });

  if (!sync.ok) {
    return NextResponse.json(
      { error: sync.error },
      { status: sync.status ?? 502 }
    );
  }

  const now = new Date().toISOString();
  const { data: updated, error: updErr } = await supabase
    .from("journal_account")
    .update({ last_synced_at: now })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(
      "id, user_id, nickname, broker_server, account_number, platform, currency, initial_balance, current_balance, status, metaapi_account_id, last_synced_at, created_at"
    )
    .maybeSingle();

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    imported: sync.imported,
    balance_updated: sync.balanceUpdated,
    account: updated
  });
}
