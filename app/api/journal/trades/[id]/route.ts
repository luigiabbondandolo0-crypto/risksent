import { NextRequest, NextResponse } from "next/server";
import { parseUuidParam, sanitizeText } from "@/lib/security/validation";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await ctx.params;
  const idCheck = parseUuidParam(rawId, "id");
  if (!idCheck.ok) {
    return NextResponse.json({ error: idCheck.error }, { status: 400 });
  }
  const id = idCheck.id;
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("journal_trade")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ trade: data });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await ctx.params;
  const idCheck = parseUuidParam(rawId, "id");
  if (!idCheck.ok) {
    return NextResponse.json({ error: idCheck.error }, { status: 400 });
  }
  const id = idCheck.id;
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    notes?: string | null;
    setup_tags?: string[] | null;
    screenshot_url?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if ("notes" in body && body.notes != null) {
    patch.notes = sanitizeText(String(body.notes), 20_000);
  } else if ("notes" in body) {
    patch.notes = null;
  }
  if (body.setup_tags != null && Array.isArray(body.setup_tags)) {
    patch.setup_tags = body.setup_tags
      .filter((x): x is string => typeof x === "string")
      .slice(0, 40)
      .map((t) => sanitizeText(t, 120));
  }
  if ("screenshot_url" in body) {
    const u = body.screenshot_url;
    if (u == null || u === "") {
      patch.screenshot_url = null;
    } else if (typeof u === "string" && (u.startsWith("https://") || u.startsWith("/"))) {
      patch.screenshot_url = sanitizeText(u, 2048);
    } else {
      return NextResponse.json({ error: "Invalid screenshot_url" }, { status: 400 });
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "notes, setup_tags, and/or screenshot_url required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("journal_trade")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ trade: data });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await ctx.params;
  const idCheck = parseUuidParam(rawId, "id");
  if (!idCheck.ok) {
    return NextResponse.json({ error: idCheck.error }, { status: 400 });
  }
  const id = idCheck.id;
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("journal_trade").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
