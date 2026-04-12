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

export async function GET() {
  const { isAdmin } = await checkAdminRole();
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = serviceClient();
  const { data, error } = await admin
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ announcements: data ?? [] });
}

export async function POST(req: Request) {
  const { isAdmin } = await checkAdminRole();
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as {
    title: string;
    message: string;
    type?: string;
    target_plan?: string;
    expires_at?: string;
  };

  const admin = serviceClient();
  const { data, error } = await admin
    .from("announcements")
    .insert({
      title: body.title,
      message: body.message,
      type: body.type ?? "info",
      target_plan: body.target_plan ?? "all",
      expires_at: body.expires_at ?? null,
      active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ announcement: data });
}
