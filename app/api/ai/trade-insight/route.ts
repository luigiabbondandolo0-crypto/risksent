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
      "Analisi sui trade selezionati: presenza di perdite consecutive in giorni recenti; size in linea con le regole nella maggior parte dei casi. Suggerimento: evitare di aumentare il lot size dopo 2 perdite di fila.",
    patterns: [
      "Sequenza di 2–3 trade in perdita in rapida successione",
      "Profitti concentrati in pochi trade; molte piccole perdite"
    ],
    emotional: [
      "Possibile effetto revenge dopo le perdite del 28/02",
      "Rispetto del risk per trade nella maggior parte dei casi"
    ]
  };

  return NextResponse.json(insight);
}
