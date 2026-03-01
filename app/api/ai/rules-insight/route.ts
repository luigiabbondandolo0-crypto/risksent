import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";

/**
 * POST /api/ai/rules-insight
 * Stub: returns mock AI insight for "Analyze my rules with AI".
 * Replace with real AI call (rules + recent trades) when ready.
 */
export async function POST() {
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Stub response. Real implementation would fetch rules + last N trades and call LLM.
  const insight = `Your current rules are within common ranges. Revenge threshold 2–3 is good for catching emotional streaks. Daily loss 2–5% is typical; FTMO uses 5%. Consider max risk per trade 0.5–1% for consistency.\n\n(This is a stub. Connect an AI model for personalized analysis.)`;

  return NextResponse.json({ insight });
}
