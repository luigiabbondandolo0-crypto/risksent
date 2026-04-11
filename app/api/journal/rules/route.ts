import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("journal_rule")
    .select("*")
    .eq("user_id", user.id)
    .order("order_index", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rules: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { text?: string; order_index?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = String(body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("journal_rule")
    .select("order_index")
    .eq("user_id", user.id)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const order_index = body.order_index ?? (existing ? existing.order_index + 1 : 0);

  const { data, error } = await supabase
    .from("journal_rule")
    .insert({ user_id: user.id, text, order_index })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rule: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("journal_rule")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
