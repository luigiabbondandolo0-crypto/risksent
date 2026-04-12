import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

export async function GET() {
  const start = Date.now();
  try {
    const supabase = await createSupabaseRouteClient();
    await supabase.from("app_user").select("id").limit(1);
    return NextResponse.json({ ok: true, ms: Date.now() - start, checkedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false, ms: Date.now() - start, checkedAt: new Date().toISOString() });
  }
}
