import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { deleteProvisionedMetaTraderAccount } from "@/lib/metaapiProvisioning";
import { normalizeMetaApiToken } from "@/lib/metaapiTokenNormalize";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: account, error: fetchError } = await supabase
    .from("trading_account")
    .select("id, user_id, metaapi_account_id, account_number, broker_type")
    .eq("id", id)
    .single();

  if (fetchError || !account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  if (account.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const metaId = account.metaapi_account_id?.trim() ?? "";
  if (normalizeMetaApiToken(process.env.METAAPI_TOKEN) && metaId) {
    try {
      await deleteProvisionedMetaTraderAccount(metaId);
    } catch (e) {
      console.warn("[accounts DELETE] MetaApi cleanup:", e);
    }
  }

  if (metaId) {
    const { error: jDel } = await supabase
      .from("journal_account")
      .delete()
      .eq("user_id", user.id)
      .eq("metaapi_account_id", metaId);
    if (jDel) {
      return NextResponse.json({ error: jDel.message }, { status: 500 });
    }
  } else {
    const { error: jDel } = await supabase
      .from("journal_account")
      .delete()
      .eq("user_id", user.id)
      .eq("account_number", account.account_number)
      .eq("platform", account.broker_type);
    if (jDel) {
      return NextResponse.json({ error: jDel.message }, { status: 500 });
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
