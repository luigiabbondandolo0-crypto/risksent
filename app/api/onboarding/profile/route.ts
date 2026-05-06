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

  // Explicit whitelist — never spread body directly to avoid mass assignment
  const VALID_EXPERIENCE = new Set(["beginner", "intermediate", "expert"]);
  const VALID_GOAL = new Set(["prop_firm", "risk_management", "win_rate", "everything"]);

  const safe: Partial<OnboardingProfile> = {};
  if (body.full_name !== undefined) safe.full_name = body.full_name ? String(body.full_name).slice(0, 150) : null;
  if (body.experience_level !== undefined) {
    if (body.experience_level !== null && !VALID_EXPERIENCE.has(body.experience_level as string)) {
      return NextResponse.json({ error: "Invalid experience_level" }, { status: 400 });
    }
    safe.experience_level = body.experience_level;
  }
  if (body.main_goal !== undefined) {
    if (body.main_goal !== null && !VALID_GOAL.has(body.main_goal as string)) {
      return NextResponse.json({ error: "Invalid main_goal" }, { status: 400 });
    }
    safe.main_goal = body.main_goal;
  }
  if (body.broker_connected !== undefined) safe.broker_connected = Boolean(body.broker_connected);
  if (body.daily_dd_limit !== undefined) safe.daily_dd_limit = Math.max(0, Math.min(100, Number(body.daily_dd_limit) || 0));
  if (body.total_dd_limit !== undefined) safe.total_dd_limit = Math.max(0, Math.min(100, Number(body.total_dd_limit) || 0));
  if (body.onboarding_completed !== undefined) safe.onboarding_completed = Boolean(body.onboarding_completed);
  if (body.onboarding_step !== undefined) safe.onboarding_step = Math.max(0, Math.min(20, Math.floor(Number(body.onboarding_step) || 0)));

  const { data, error } = await supabase
    .from("user_profile")
    .upsert({ ...safe, id: user.id }, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
