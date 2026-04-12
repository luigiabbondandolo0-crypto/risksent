import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST() {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check current plan — only 'user' (demo) accounts can start a trial
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();

  if (existingSub && existingSub.plan !== "user") {
    return NextResponse.json(
      { error: "Trial already used or active paid plan" },
      { status: 400 }
    );
  }

  const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const service = createServiceClient();
  const { error } = await service
    .from("subscriptions")
    .upsert(
      {
        user_id: user.id,
        plan: "trial",
        status: "trialing",
        current_period_start: new Date().toISOString(),
        current_period_end: trialEnd,
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, trialEndsAt: trialEnd });
}
