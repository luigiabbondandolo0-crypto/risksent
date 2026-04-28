import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { checkAdminRole } from "@/lib/adminAuth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const { isAdmin } = await checkAdminRole();

  if (!isAdmin) {
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
    Sentry.captureException(e);
    const msg = e instanceof Error ? e.message : "Failed to load stats";
    return NextResponse.json(
      { error: msg.includes("Missing") ? msg : `Stats: ${msg}. Set SUPABASE_SERVICE_ROLE_KEY and ensure app_user/trading_account/trade tables exist.` },
      { status: 500 }
    );
  }
}
