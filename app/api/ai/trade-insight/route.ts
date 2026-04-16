import { NextRequest, NextResponse } from "next/server";
import { checkAiInsightRateLimit, rateLimitJsonResponse } from "@/lib/security/apiAbuse";
import { parsePositiveIntList } from "@/lib/security/validation";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lim = checkAiInsightRateLimit(user.id, "trades");
  if (!lim.allowed) {
    return rateLimitJsonResponse(lim);
  }

  let body: { ticketIds?: number[]; trades?: Record<string, unknown>[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ticketIds = parsePositiveIntList(body.ticketIds, 15);
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
