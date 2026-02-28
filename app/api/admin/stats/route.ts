import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const ADMIN_EMAIL = "luigiabbondandolo0@gmail.com";

export async function GET() {
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const admin = createSupabaseAdmin();
    const [usersRes, accountsRes, tradesRes] = await Promise.all([
      admin.from("app_user").select("id", { count: "exact", head: true }),
      admin.from("trading_account").select("id", { count: "exact", head: true }),
      admin.from("trade").select("id", { count: "exact", head: true })
    ]);
    return NextResponse.json({
      users: usersRes.count ?? 0,
      tradingAccounts: accountsRes.count ?? 0,
      trades: tradesRes.count ?? 0
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load stats";
    return NextResponse.json(
      { error: msg.includes("Missing") ? msg : `Stats: ${msg}. Set SUPABASE_SERVICE_ROLE_KEY and ensure app_user/trading_account/trade tables exist.` },
      { status: 500 }
    );
  }
}
