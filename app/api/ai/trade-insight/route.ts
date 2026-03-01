import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { ticketIds?: number[]; trades?: Record<string, unknown>[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ticketIds = Array.isArray(body.ticketIds) ? body.ticketIds.filter((id) => Number.isFinite(id)) : [];
  if (ticketIds.length === 0 || ticketIds.length > 15) {
    return NextResponse.json(
      { error: "Select between 1 and 15 trades to analyze" },
      { status: 400 }
    );
  }

  // Stub: return mock insight. Replace with real AI call when ready.
  const insight = {
    summary:
      "Analysis of selected trades: consecutive losses in recent days; position size in line with rules in most cases. Suggestion: avoid increasing lot size after 2 losses in a row.",
    patterns: [
      "Sequence of 2–3 losing trades in quick succession",
      "Profits concentrated in few trades; many small losses"
    ],
    emotional: [
      "Possible revenge trading after losses",
      "Risk per trade respected in most cases"
    ]
  };

  return NextResponse.json(insight);
}
