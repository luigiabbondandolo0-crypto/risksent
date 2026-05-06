import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminRole } from "@/lib/adminAuth";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await checkAdminRole();
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as { active?: boolean; title?: string; message?: string; type?: string; target_plan?: string };
  const admin = serviceClient();
  // Explicit whitelist — never spread body directly to avoid mass assignment
  const safe: Record<string, unknown> = {};
  if (body.active !== undefined) safe.active = Boolean(body.active);
  if (body.title !== undefined) safe.title = String(body.title).slice(0, 200);
  if (body.message !== undefined) safe.message = String(body.message).slice(0, 2000);
  if (body.type !== undefined) safe.type = String(body.type).slice(0, 50);
  if (body.target_plan !== undefined) safe.target_plan = String(body.target_plan).slice(0, 50);
  if (Object.keys(safe).length === 0) return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  const { error } = await admin.from("announcements").update(safe).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await checkAdminRole();
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const admin = serviceClient();
  const { error } = await admin.from("announcements").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
