import { NextRequest, NextResponse } from "next/server";
import { checkAiChatRateLimit, rateLimitJsonResponse } from "@/lib/security/apiAbuse";
import { sanitizeText } from "@/lib/security/validation";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import { CHAT_SYSTEM_PROMPT } from "@/lib/ai-coach/coachPrompt";
import { capsForPlan, type Plan, type SubStatus } from "@/lib/subscription/caps";

const CLAUDE_COACH_MODEL = "claude-haiku-4-5-20251001";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: subRow } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, trial_started_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const caps = capsForPlan(
    ((subRow?.plan as Plan | "free") ?? "user") as Plan | "free",
    (subRow?.status as SubStatus) ?? "active",
    subRow?.current_period_end ?? null,
    Boolean((subRow as { trial_started_at?: string | null } | null)?.trial_started_at)
  );

  if (caps.isDemoMode || !caps.canAccessAICoach) {
    return NextResponse.json(
      { error: "plan_required", message: "Upgrade your plan to use AI Coach." },
      { status: 403 }
    );
  }

  const chatLimit = checkAiChatRateLimit(user.id);
  if (!chatLimit.allowed) {
    return rateLimitJsonResponse(chatLimit, "Too many AI chat requests. Try again later.");
  }

  let body: {
    message?: string;
    history?: ChatMessage[];
    journal_account_id?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const journalAccountId =
    typeof body.journal_account_id === "string" ? body.journal_account_id.trim() : "";
  if (!journalAccountId) {
    return NextResponse.json(
      { error: "journal_account_id is required" },
      { status: 400 }
    );
  }

  const { data: accountRow, error: accountErr } = await supabase
    .from("journal_account")
    .select("id")
    .eq("id", journalAccountId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (accountErr) {
    return NextResponse.json({ error: accountErr.message }, { status: 500 });
  }
  if (!accountRow) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const message = sanitizeText(String(body.message ?? ""), 12_000);
  if (!message) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }
  const history: ChatMessage[] = Array.isArray(body.history)
    ? body.history.slice(-20).map((m) => ({
        role: m?.role === "assistant" ? "assistant" : "user",
        content: sanitizeText(String(m?.content ?? ""), 12_000)
      }))
    : [];

  const { data: lastReport } = await supabase
    .from("ai_coach_report")
    .select("report, trades_analyzed, created_at, period_from, period_to")
    .eq("user_id", user.id)
    .eq("journal_account_id", journalAccountId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const contextBlock = lastReport
    ? `\n\nTRADER CONTEXT (from last report — ${lastReport.created_at?.slice(0, 10)}, ${lastReport.trades_analyzed} trades analyzed, period ${lastReport.period_from} to ${lastReport.period_to}):\n${JSON.stringify(lastReport.report)}`
    : "\n\nNo analysis report available yet for this account. Encourage the user to generate one.";

  const systemWithContext = CHAT_SYSTEM_PROMPT + contextBlock;

  const messages: ChatMessage[] = [
    ...history,
    { role: "user", content: message },
  ];

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
      "anthropic-beta": "prompt-caching-2024-07-31",
    },
    body: JSON.stringify({
      model: CLAUDE_COACH_MODEL,
      max_tokens: 800,
      system: [{ type: "text", text: systemWithContext, cache_control: { type: "ephemeral" } }],
      messages,
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
  const response: string = j.content?.[0]?.text ?? "";

  if (!response) {
    return NextResponse.json(
      { error: "AI returned empty response" },
      { status: 502 }
    );
  }

  await supabase.from("ai_coach_message").insert([
    {
      user_id: user.id,
      journal_account_id: journalAccountId,
      role: "user",
      content: message,
      model: "claude",
    },
    {
      user_id: user.id,
      journal_account_id: journalAccountId,
      role: "assistant",
      content: response,
      model: "claude",
    },
  ]);

  return NextResponse.json({ response });
}
