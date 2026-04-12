import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

export type OnboardingProfile = {
  id: string;
  full_name: string | null;
  experience_level: "beginner" | "intermediate" | "expert" | null;
  main_goal: "prop_firm" | "risk_management" | "win_rate" | "everything" | null;
  broker_connected: boolean;
  daily_dd_limit: number;
  total_dd_limit: number;
  onboarding_completed: boolean;
  onboarding_step: number;
  created_at: string | null;
};

export async function GET() {
  const supabase = await createSupabaseRouteClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_profile")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<OnboardingProfile>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Strip id — always use auth user id
  const { id: _id, created_at: _ca, ...updates } = body as Record<string, unknown>;
  void _id; void _ca;

  const { data, error } = await supabase
    .from("user_profile")
    .upsert({ ...updates, id: user.id }, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
