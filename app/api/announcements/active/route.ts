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

export async function GET() {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ announcements: [] });

  const { data: subRow } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();
  const plan = (subRow?.plan as string | null) ?? "free";

  const admin = serviceClient();
  const now = new Date().toISOString();
  const { data } = await admin
    .from("announcements")
    .select("*")
    .eq("active", true)
    .or(`target_plan.eq.all,target_plan.eq.${plan}`)
    .order("created_at", { ascending: false });

  // Filter expired ones in JS since Supabase OR + complex filters can be tricky
  const valid = (data ?? []).filter(
    (a) => !a.expires_at || a.expires_at > now
  );

  return NextResponse.json({ announcements: valid });
}
