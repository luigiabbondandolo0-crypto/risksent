import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/security/validation";
import { calcSessionStats } from "@/lib/backtesting/calcSessionStats";
import type { Trade } from "@/lib/backtesting/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const supabase = await createSupabaseRouteClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: session }, { data: trades }] = await Promise.all([
    supabase.from("bt_sessions").select("*").eq("id", id).eq("user_id", user.id).single(),
    supabase.from("bt_trades").select("*").eq("session_id", id).eq("user_id", user.id).order("created_at", { ascending: true }),
  ]);

  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const closed = ((trades ?? []) as Trade[]).filter((t) => t.status === "closed");
  const stats = calcSessionStats((trades ?? []) as Trade[]);

  if (closed.length === 0) {
    return NextResponse.json({
      score: null,
      explanation: "No closed trades in this session yet. Complete at least a few trades before requesting an AI evaluation.",
    });
  }

  // Build prompt data
  const avgWin = stats.wins > 0
    ? closed.filter((t) => (t.pnl ?? 0) > 0).reduce((s, t) => s + (t.pnl ?? 0), 0) / stats.wins
    : 0;
  const avgLoss = stats.losses > 0
    ? Math.abs(closed.filter((t) => (t.pnl ?? 0) < 0).reduce((s, t) => s + (t.pnl ?? 0), 0) / stats.losses)
    : 0;
  const expectancy = stats.totalTrades > 0
    ? (stats.winRate / 100) * avgWin - ((100 - stats.winRate) / 100) * avgLoss
    : 0;
  const pl = session.current_balance - session.initial_balance;
  const plPct = session.initial_balance > 0 ? (pl / session.initial_balance) * 100 : 0;

  const prompt = `You are an expert trading performance analyst. Evaluate this backtesting session and assign a profitability score from 1 to 100.

Score scale:
- 1–20: Highly unprofitable — severe losses, poor risk management, system that cannot work
- 21–40: Below average — net negative, some edge but inconsistent
- 41–60: Average — roughly breakeven or slightly profitable, needs improvement
- 61–80: Good — profitable with solid risk management
- 81–100: Excellent — strong profitability, great risk management, scalable strategy

Session data:
- Symbol: ${session.symbol}
- Timeframe: ${session.timeframe}
- Initial balance: $${session.initial_balance.toFixed(2)}
- Final balance: $${session.current_balance.toFixed(2)}
- Net P&L: ${pl >= 0 ? "+" : ""}$${pl.toFixed(2)} (${plPct >= 0 ? "+" : ""}${plPct.toFixed(2)}%)
- Total closed trades: ${stats.totalTrades}
- Win rate: ${stats.winRate.toFixed(1)}%
- Wins: ${stats.wins}, Losses: ${stats.losses}
- Average R:R: 1:${stats.avgRR.toFixed(2)}
- Profit factor: ${stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}
- Max drawdown: $${stats.maxDrawdown.toFixed(2)}
- Best trade: +$${stats.bestTrade.toFixed(2)}
- Worst trade: $${stats.worstTrade.toFixed(2)}
- Average winning trade: +$${avgWin.toFixed(2)}
- Average losing trade: -$${avgLoss.toFixed(2)}
- Expectancy per trade: ${expectancy >= 0 ? "+" : ""}$${expectancy.toFixed(2)}

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation outside the JSON):
{
  "score": <integer 1-100>,
  "explanation": "<2-4 sentences explaining the score, mentioning the most important strengths and weaknesses>"
}`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Anthropic error:", errBody);
      return NextResponse.json({ error: "AI service error" }, { status: 502 });
    }

    const json = await res.json() as { content?: Array<{ text?: string }> };
    const text = json.content?.[0]?.text ?? "";
    const parsed = JSON.parse(text) as { score: number; explanation: string };

    if (typeof parsed.score !== "number" || typeof parsed.explanation !== "string") {
      throw new Error("Invalid AI response shape");
    }

    const score = Math.max(1, Math.min(100, Math.round(parsed.score)));
    return NextResponse.json({ score, explanation: parsed.explanation });
  } catch (err) {
    console.error("Score generation failed:", err);
    return NextResponse.json({ error: "Failed to generate score" }, { status: 500 });
  }
}
