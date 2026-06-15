import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";

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
    date?: string;
    trades?: Array<Record<string, unknown>>;
    session?: Record<string, unknown> | null;
    currency?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { date, trades = [], session = null, currency = "USD" } = body;
  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  const tradesSummary = trades
    .map((t, i) => {
      const pl = typeof t.pl === "number" ? t.pl.toFixed(2) : "?";
      const dir = t.direction ?? "?";
      const sym = t.symbol ?? "?";
      const pips = t.pips != null ? ` | ${t.pips} pips` : "";
      const rr = t.risk_reward != null ? ` | R:R ${t.risk_reward}` : "";
      const tags = Array.isArray(t.setup_tags) && t.setup_tags.length > 0
        ? ` [${t.setup_tags.join(", ")}]`
        : "";
      return `${i + 1}. ${dir} ${sym}: ${currency}${pl}${pips}${rr}${tags}`;
    })
    .join("\n");

  const bias = (session as Record<string, unknown> | null)?.bias ?? "None";
  const notes = (session as Record<string, unknown> | null)?.notes ?? "None";
  const totalPl = trades.reduce(
    (sum, t) => sum + (typeof t.pl === "number" ? t.pl : 0),
    0
  );
  const wins = trades.filter((t) => typeof t.pl === "number" && t.pl > 0).length;
  const winRate =
    trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;

  const prompt = `You are a trading coach. Give a concise daily recap (3-5 sentences) for this trading day. Be specific, analytical, direct. No fluff. No generic advice. Focus on what happened and why it matters.

Date: ${date}
Currency: ${currency}
Total P&L: ${totalPl >= 0 ? "+" : ""}${totalPl.toFixed(2)} ${currency}
Trades: ${trades.length} (${wins} wins, ${winRate}% win rate)
Bias: ${bias}
Session notes: ${notes}

Trade breakdown:
${tradesSummary || "No trades"}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 350,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[ai-recap] Anthropic error", res.status, err.slice(0, 200));
    return NextResponse.json(
      { error: "AI service temporarily unavailable" },
      { status: 502 }
    );
  }

  const j = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const recap: string = Array.isArray(j.content)
    ? j.content
        .map((b) => (b?.type === "text" && typeof b.text === "string" ? b.text : ""))
        .join("")
        .trim()
    : "";

  return NextResponse.json({ recap });
}
