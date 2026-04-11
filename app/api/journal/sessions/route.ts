import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dateParam = req.nextUrl.searchParams.get("date");
  const sessionDate = dateParam ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("journal_session")
    .select("*")
    .eq("user_id", user.id)
    .eq("session_date", sessionDate)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: data });
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

  let body: {
    session_date?: string;
    account_id?: string | null;
    bias?: string | null;
    key_levels?: string | null;
    watchlist?: string[] | null;
    notes?: string | null;
    images?: string[] | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionDate =
    body.session_date ?? new Date().toISOString().slice(0, 10);

  const validBias = ["Bullish", "Bearish", "Neutral"];
  const bias =
    body.bias && validBias.includes(body.bias) ? body.bias : null;

  const row = {
    user_id: user.id,
    session_date: sessionDate,
    account_id: body.account_id ?? null,
    bias,
    key_levels: body.key_levels ?? null,
    watchlist: Array.isArray(body.watchlist) ? body.watchlist : null,
    notes: body.notes ?? null,
    images: Array.isArray(body.images) ? body.images : null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("journal_session")
    .upsert(row, { onConflict: "user_id,session_date" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: data });
}
