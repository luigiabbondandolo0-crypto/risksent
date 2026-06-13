import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Public endpoint — returns the first active, non-expired announcement.
 * No auth required (announcements are public info).
 */
export async function GET() {
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const now = new Date().toISOString();

    const { data, error } = await admin
      .from("announcements")
      .select("id, title, message, type")
      .eq("active", true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return NextResponse.json({ announcement: null });
    return NextResponse.json({ announcement: data ?? null });
  } catch {
    return NextResponse.json({ announcement: null });
  }
}
