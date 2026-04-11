import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import { COACH_SYSTEM_PROMPT } from "@/lib/ai-coach/coachPrompt";
import type { CoachModel, CoachReport } from "@/lib/ai-coach/coachTypes";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { model?: CoachModel; days?: number };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const model: CoachModel = body.model === "gpt4" ? "gpt4" : "claude";
  const days = Number(body.days ?? 90);
  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const toDate = new Date().toISOString().slice(0, 10);

  // ── Collect trading data ──────────────────────────────────────────────────
  const [tradesRes, reviewsRes, rulesRes, accountsRes] = await Promise.all([
    supabase
      .from("journal_trade")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "closed")
      .gte("open_time", fromDate)
      .order("open_time", { ascending: true })
      .limit(500),
    supabase
      .from("journal_trade_review")
      .select("*, journal_strategy(name)")
      .eq("user_id", user.id),
    supabase
      .from("app_user")
      .select(
        "daily_loss_pct, max_risk_per_trade_pct, max_exposure_pct, revenge_threshold_trades"
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("journal_account")
      .select("initial_balance, current_balance, currency, nickname")
      .eq("user_id", user.id)
      .limit(5),
  ]);

  const rawTrades = tradesRes.data ?? [];

  if (rawTrades.length < 10) {
    return NextResponse.json(
      {
        error:
          "Insufficient data — load more trades. Minimum 10 closed trades required.",
      },
      { status: 422 }
    );
  }

  // Build review map
  const reviewMap = new Map<string, Record<string, unknown>>();
  for (const r of reviewsRes.data ?? []) {
    reviewMap.set(r.trade_id, r);
  }

  const trades = rawTrades.map((t) => {
    const rev = reviewMap.get(t.id);
    const checklistResults: Record<string, boolean> =
      (rev?.checklist_results as Record<string, boolean>) ?? {};
    const rulesFollowed: Record<string, boolean> =
      (rev?.rules_followed as Record<string, boolean>) ?? {};
    const checklistValues = Object.values(checklistResults);
    const rulesValues = Object.values(rulesFollowed);
    return {
      id: t.id,
      symbol: t.symbol,
      direction: t.direction,
      open_time: t.open_time,
      close_time: t.close_time,
      open_price: t.open_price,
      close_price: t.close_price,
      lot_size: t.lot_size,
      stop_loss: t.stop_loss,
      take_profit: t.take_profit,
      pl: t.pl,
      commission: t.commission,
      swap: t.swap,
      pips: t.pips,
      risk_reward: t.risk_reward,
      setup_tags: t.setup_tags,
      emotion: rev?.emotion ?? null,
      strategy_name:
        (rev as { journal_strategy?: { name: string } } | undefined)
          ?.journal_strategy?.name ?? null,
      rating: rev?.rating ?? null,
      checklist_compliance_pct:
        checklistValues.length > 0
          ? Math.round(
              (checklistValues.filter(Boolean).length /
                checklistValues.length) *
                100
            )
          : null,
      rules_followed_pct:
        rulesValues.length > 0
          ? Math.round(
              (rulesValues.filter(Boolean).length / rulesValues.length) * 100
            )
          : null,
    };
  });

  const riskRules = rulesRes.data ?? {
    daily_loss_pct: 5,
    max_risk_per_trade_pct: 1,
    max_exposure_pct: 6,
    revenge_threshold_trades: 3,
  };

  const firstAccount = accountsRes.data?.[0];
  const context = {
    trades,
    risk_rules: riskRules,
    account: firstAccount
      ? {
          initial_balance: firstAccount.initial_balance,
          current_balance: firstAccount.current_balance,
          currency: firstAccount.currency,
          nickname: firstAccount.nickname,
        }
      : null,
    period: { from: fromDate, to: toDate, days },
  };

  const userMessage =
    "Analyze this trading data and return a JSON report: " +
    JSON.stringify(context);

  // ── Call AI ───────────────────────────────────────────────────────────────
  let rawContent: string;

  if (model === "gpt4") {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 4000,
        temperature: 0.3,
        messages: [
          { role: "system", content: COACH_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `OpenAI error: ${err}` },
        { status: 502 }
      );
    }
    const j = await res.json();
    rawContent = j.choices?.[0]?.message?.content ?? "";
  } else {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 4000,
        system: COACH_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `Anthropic error: ${err}` },
        { status: 502 }
      );
    }
    const j = await res.json();
    rawContent = j.content?.[0]?.text ?? "";
  }

  // ── Parse JSON ────────────────────────────────────────────────────────────
  let report: CoachReport;
  try {
    const cleaned = rawContent
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    report = JSON.parse(cleaned) as CoachReport;
  } catch {
    return NextResponse.json(
      { error: "AI returned invalid JSON. Try again." },
      { status: 502 }
    );
  }

  // ── Persist ───────────────────────────────────────────────────────────────
  const { data: saved, error: saveErr } = await supabase
    .from("ai_coach_report")
    .insert({
      user_id: user.id,
      model,
      period_from: fromDate,
      period_to: toDate,
      trades_analyzed: trades.length,
      report,
    })
    .select()
    .single();

  if (saveErr) {
    return NextResponse.json({ error: saveErr.message }, { status: 500 });
  }

  return NextResponse.json({ report: saved });
}
