import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const PLAN_PRICES: Record<string, number> = { free: 0, new_trader: 25, experienced: 39 };

export async function GET() {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("app_user").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = serviceClient();
  const { data, error } = await admin
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];

  // Batch-fetch emails from auth admin
  const emailMap: Record<string, string> = {};
  for (const row of rows) {
    const uid = row.user_id as string;
    if (!emailMap[uid]) {
      try {
        const { data: authUser } = await admin.auth.admin.getUserById(uid);
        emailMap[uid] = authUser.user?.email ?? "unknown";
      } catch {
        emailMap[uid] = "unknown";
      }
    }
  }

  const subscriptions = rows.map((s) => ({
    ...s,
    user_email: emailMap[s.user_id as string] ?? "unknown",
  }));

  const mrr = subscriptions
    .filter((s) => s.status === "active" || s.status === "trialing")
    .reduce((sum, s) => sum + (PLAN_PRICES[s.plan as string] ?? 0), 0);

  const activeCount = subscriptions.filter((s) => s.status === "active" || s.status === "trialing").length;
  const canceledCount = subscriptions.filter((s) => s.status === "canceled").length;
  const churnRate = subscriptions.length > 0 ? Math.round((canceledCount / subscriptions.length) * 100) : 0;

  return NextResponse.json({ subscriptions, mrr, activeCount, churnRate });
}
