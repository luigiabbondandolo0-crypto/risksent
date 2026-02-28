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

    const { data: authData, error: authErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 500 });
    }
    const authUsers = authData?.users ?? [];

    const { data: appUsers, error: appErr } = await admin
      .from("app_user")
      .select("id, role, daily_loss_pct, max_risk_per_trade_pct, created_at");
    if (appErr) {
      return NextResponse.json({ error: appErr.message }, { status: 500 });
    }

    const appById = new Map((appUsers ?? []).map((u) => [u.id, u]));

    const { data: accountCounts } = await admin
      .from("trading_account")
      .select("user_id");
    const countByUser = (accountCounts ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.user_id] = (acc[row.user_id] ?? 0) + 1;
      return acc;
    }, {});

    const users = authUsers.map((u) => {
      const app = appById.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "",
        role: (app as { role?: string } | undefined)?.role ?? "customer",
        createdAt: u.created_at,
        accountsCount: countByUser[u.id] ?? 0
      };
    });

    return NextResponse.json({ users });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load users" },
      { status: 500 }
    );
  }
}
