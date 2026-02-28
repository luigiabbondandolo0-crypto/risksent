import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: accounts, error } = await supabase
    .from("trading_account")
    .select("id, broker_type, account_number, metaapi_account_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ accounts: accounts ?? [] });
}
