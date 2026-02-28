import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";

const METAAPI_BASE = "https://api.metatraderapi.dev";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: account, error: fetchError } = await supabase
    .from("trading_account")
    .select("id, user_id, metaapi_account_id")
    .eq("id", id)
    .single();

  if (fetchError || !account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  if (account.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.METATRADERAPI_API_KEY;
  if (apiKey && account.metaapi_account_id) {
    try {
      await fetch(
        `${METAAPI_BASE}/DeleteAccount?id=${encodeURIComponent(account.metaapi_account_id)}`,
        { method: "GET", headers: { "x-api-key": apiKey } }
      );
    } catch {
      // continue to delete from our DB even if provider call fails
    }
  }

  const { error: deleteError } = await supabase
    .from("trading_account")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
