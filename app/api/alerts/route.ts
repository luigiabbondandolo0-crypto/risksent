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

  const { data: alerts, error } = await supabase
    .from("alert")
    .select("id, message, severity, solution, alert_date, read")
    .eq("user_id", user.id)
    .order("alert_date", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message, alerts: [] }, { status: 500 });
  }

  return NextResponse.json({ alerts: alerts ?? [] });
}
