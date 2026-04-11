import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import { CHAT_SYSTEM_PROMPT } from "@/lib/ai-coach/coachPrompt";
import type { CoachModel } from "@/lib/ai-coach/coachTypes";

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

  let body: {
    message?: string;
    model?: CoachModel;
    history?: ChatMessage[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = String(body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }
  const model: CoachModel = body.model === "gpt4" ? "gpt4" : "claude";
  const history: ChatMessage[] = Array.isArray(body.history)
    ? body.history.slice(-20)
    : [];

  // ── Load last report for context ──────────────────────────────────────────
  const { data: lastReport } = await supabase
    .from("ai_coach_report")
    .select("report, trades_analyzed, created_at, period_from, period_to")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const contextBlock = lastReport
    ? `\n\nTRADER CONTEXT (from last report — ${lastReport.created_at?.slice(0, 10)}, ${lastReport.trades_analyzed} trades analyzed, period ${lastReport.period_from} to ${lastReport.period_to}):\n${JSON.stringify(lastReport.report)}`
    : "\n\nNo analysis report available yet. Encourage the user to generate one.";

  const systemWithContext = CHAT_SYSTEM_PROMPT + contextBlock;

  // Build message array (alternating user/assistant)
  const messages: ChatMessage[] = [
    ...history,
    { role: "user", content: message },
  ];

  // ── Call AI ───────────────────────────────────────────────────────────────
  let response: string;

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
        max_tokens: 800,
        temperature: 0.4,
        messages: [
          { role: "system", content: systemWithContext },
          ...messages,
        ],
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
    response = j.choices?.[0]?.message?.content ?? "";
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
        max_tokens: 800,
        system: systemWithContext,
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
    response = j.content?.[0]?.text ?? "";
  }

  if (!response) {
    return NextResponse.json(
      { error: "AI returned empty response" },
      { status: 502 }
    );
  }

  // ── Persist both messages ─────────────────────────────────────────────────
  await supabase.from("ai_coach_message").insert([
    { user_id: user.id, role: "user", content: message, model },
    { user_id: user.id, role: "assistant", content: response, model },
  ]);

  return NextResponse.json({ response, model });
}
