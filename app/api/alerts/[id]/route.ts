import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";

/**
 * PATCH /api/alerts/[id]
 * Update alert: read, dismissed, or acknowledge (with optional note).
 * Body: { read?: boolean, dismissed?: boolean, acknowledged?: boolean, acknowledged_note?: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Alert id required" }, { status: 400 });
  }

  let body: { read?: boolean; dismissed?: boolean; acknowledged?: boolean; acknowledged_note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.read === "boolean") updates.read = body.read;
  if (typeof body.dismissed === "boolean") updates.dismissed = body.dismissed;
  if (body.acknowledged === true) {
    updates.acknowledged_at = new Date().toISOString();
    if (typeof body.acknowledged_note === "string") updates.acknowledged_note = body.acknowledged_note.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("alert")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, read, dismissed, acknowledged_at, acknowledged_note")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  return NextResponse.json({ alert: data });
}
