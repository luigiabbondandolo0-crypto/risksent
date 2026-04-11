import { NextResponse } from "next/server";
import { checkAdminRole } from "@/lib/adminAuth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const { isAdmin } = await checkAdminRole();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const checkedAt = new Date().toISOString();
  let supabaseOk = false;
  try {
    const admin = createSupabaseAdmin();
    const { error } = await admin.from("app_user").select("id", { count: "exact", head: true });
    supabaseOk = !error;
  } catch {
    supabaseOk = false;
  }

  return NextResponse.json({
    checkedAt,
    supabase: { ok: supabaseOk, label: supabaseOk ? "Connected" : "Error" },
    telegram: {
      ok: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      label: process.env.TELEGRAM_BOT_TOKEN ? "Configured" : "Not set"
    },
    anthropic: {
      ok: Boolean(process.env.ANTHROPIC_API_KEY),
      label: process.env.ANTHROPIC_API_KEY ? "Configured" : "Not set"
    }
  });
}
