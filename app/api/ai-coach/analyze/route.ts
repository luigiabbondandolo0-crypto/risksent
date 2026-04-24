import { NextRequest, NextResponse } from "next/server";
import { checkAiAnalyzeRateLimit, rateLimitJsonResponse } from "@/lib/security/apiAbuse";
import { clampInt } from "@/lib/security/validation";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import { COACH_SYSTEM_PROMPT } from "@/lib/ai-coach/coachPrompt";
import { parseCoachReportFromModelText } from "@/lib/ai-coach/parseCoachReport";

const CLAUDE_COACH_MODEL = "claude-haiku-4-5-20251001";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const analyzeLimit = checkAiAnalyzeRateLimit(user.id);
  if (!analyzeLimit.allowed) {
    return rateLimitJsonResponse(analyzeLimit, "Too many analysis requests. Try again tomorrow.");
  }

  let body: { days?: number };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  let days: number;
  const rd = body.days;
  if (rd === undefined || rd === null) {
    days = 9999;
  } else {
    const n = typeof rd === "number" ? rd : Number.parseFloat(String(rd));
    if (!Number.isFinite(n) || n >= 9999) {
      days = 9999;
    } else {
      days = clampInt(n, 1, 3650, 30);
    }
  }

  // All time: no date filter
  const fromDate =
    days >= 9999
      ? null
      : new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);
  const toDate = new Date().toISOString().slice(0, 10);

  // ── Collect trading data ──────────────────────────────────────────────────
  let tradesQuery = supabase
    .from("journal_trade")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "closed")
    .order("open_time", { ascending: true })
    .limit(500);

  if (fromDate) {
    tradesQuery = tradesQuery.gte("open_time", fromDate);
  }

  const [tradesRes, reviewsRes, rulesRes, accountsRes] = await Promise.all([
    tradesQuery,
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
      .limit(1)
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
    period: {
      from: fromDate ?? "all_time",
      to: toDate,
      days: days >= 9999 ? "all" : days,
    },
  };

  const userMessage =
    "Analyze this trading data and return a JSON report: " +
    JSON.stringify(context);

  // ── Call AI ───────────────────────────────────────────────────────────────
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
      model: CLAUDE_COACH_MODEL,
      max_tokens: 8192,
      temperature: 0.2,
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
  const j = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
    stop_reason?: string | null;
  };
  const rawContent: string = Array.isArray(j.content)
    ? j.content
        .map((b) => (b?.type === "text" && typeof b.text === "string" ? b.text : ""))
        .join("")
    : "";

  const parsed = parseCoachReportFromModelText(rawContent, {
    stopReason: j.stop_reason ?? null,
  });
  if (!parsed.ok) {
    console.warn("[ai-coach/analyze] JSON parse failed", parsed.detail?.slice(0, 240));
    return NextResponse.json({ error: parsed.error }, { status: 422 });
  }
  const report = parsed.report;

  // ── Persist ───────────────────────────────────────────────────────────────
  const { data: saved, error: saveErr } = await supabase
    .from("ai_coach_report")
    .insert({
      user_id: user.id,
      model: "claude",
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
