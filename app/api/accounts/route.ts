import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";

export async function GET() {
  try {
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
      return NextResponse.json(
        { error: `Accounts: ${error.message}. Ensure table trading_account exists (run supabase/schema.sql).` },
        { status: 500 }
      );
    }

    return NextResponse.json({ accounts: accounts ?? [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load accounts" },
      { status: 500 }
    );
  }
}
