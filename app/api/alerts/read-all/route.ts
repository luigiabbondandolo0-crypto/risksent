import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

/**
 * POST /api/alerts/read-all
 * Marks every unread alert for the current user as `read: true`.
 * Used by the Topbar bell to clear the unread badge once the dropdown is opened.
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
    .update({ read: true }, { count: "exact" })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, updated: count ?? 0 });
}
