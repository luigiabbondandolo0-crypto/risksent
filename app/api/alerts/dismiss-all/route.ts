import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

/**
 * POST /api/alerts/dismiss-all
 * Dismisses every non-dismissed alert for the current user.
 * Also marks them as read. Used by the Topbar bell "Clear" action so the
 * Dashboard Live Alerts panel is cleared in sync with the headbar notifications.
 */
export async function POST() {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error, count } = await supabase
    .from("alert")
    .update({ dismissed: true, read: true }, { count: "exact" })
    .eq("user_id", user.id)
    .eq("dismissed", false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, updated: count ?? 0 });
}
