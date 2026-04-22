import OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are RiskSent, a professional trading risk management assistant.
Generate a structured Telegram alert message for a trader. Always follow this exact format:

For HIGH severity (🚨):
"🚨 [RULE VIOLATED]
What to do NOW: [one specific immediate action]
Risk: [what could happen if ignored]"

For MEDIUM severity (⚠️):
"⚠️ [RULE VIOLATED]
Action required: [one specific action]
Risk: [what could happen if ignored]"

Rules:
- Be direct and specific, never vague
- Never use markdown formatting
- Max 3 lines total
- Risk line must state a concrete consequence
- Always match the severity emoji and label from the prompt`;

function detectSeverity(alertType: string, data: Record<string, unknown>): "medium" | "high" {
  switch (alertType) {
    case "daily_drawdown": {
      const current = Number(data.currentDD ?? 0);
      const limit = Number(data.limitDD ?? 100);
      return current >= limit * 0.8 ? "high" : "medium";
    }
    case "max_drawdown": {
      const current = Number(data.currentDD ?? 0);
      const limit = Number(data.limitDD ?? 100);
      return current >= limit * 0.75 ? "high" : "medium";
    }
    case "consecutive_losses":
      return Number(data.count ?? 0) >= 3 ? "high" : "medium";
    case "revenge_trading":
      return "high";
    case "position_size": {
      const pos = Number(data.positionSize ?? 0);
      const limit = Number(data.limit ?? 100);
      return pos >= limit * 2 ? "high" : "medium";
    }
    case "weekly_loss":
    case "overtrading":
    default:
      return "medium";
  }
}

function buildFallback(alertType: string, data: Record<string, unknown>, severity: "medium" | "high"): string {
  if (severity === "high") {
    switch (alertType) {
      case "daily_drawdown":
        return `🚨 Daily loss limit almost reached (${data.currentDD}% of ${data.limitDD}%)\nWhat to do NOW: Close all open positions and stop trading today.\nRisk: Exceeding daily limit may trigger prop firm violation or account suspension.`;
      case "max_drawdown":
        return `🚨 Max drawdown limit almost reached (${data.currentDD}% of ${data.limitDD}%)\nWhat to do NOW: Close all positions immediately and halt trading.\nRisk: Breaching max drawdown will likely result in account termination.`;
      case "consecutive_losses":
        return `🚨 ${data.count} consecutive losses detected — total loss $${data.totalLoss}\nWhat to do NOW: Stop trading now and review your last ${data.count} trades.\nRisk: Continuing after a losing streak multiplies drawdown and emotional errors.`;
      case "revenge_trading":
        return `🚨 Revenge trading detected — ${data.tradesCount} trades in ${data.minutes} minutes after a loss\nWhat to do NOW: Step away from the platform for at least 30 minutes.\nRisk: Emotional trading causes average 3x larger losses. You are not thinking clearly.`;
      case "position_size":
        return `🚨 Position size ${data.positionSize}% is ${data.positionSize}x your ${data.limit}% limit on ${data.symbol}\nWhat to do NOW: Reduce position size to your configured maximum immediately.\nRisk: Oversized positions can wipe out multiple sessions of profit in one trade.`;
      default:
        return `🚨 Critical risk alert — ${alertType}\nWhat to do NOW: Review your open positions and risk exposure immediately.\nRisk: Ignoring this alert may result in significant account drawdown.`;
    }
  } else {
    switch (alertType) {
      case "daily_drawdown":
        return `⚠️ Daily drawdown at ${data.currentDD}% approaching ${data.limitDD}% limit\nAction required: Reduce position sizes and avoid high-risk setups.\nRisk: One more loss could push you into your daily limit and halt trading.`;
      case "max_drawdown":
        return `⚠️ Max drawdown at ${data.currentDD}% approaching ${data.limitDD}% limit\nAction required: Switch to smaller positions and avoid correlated trades.\nRisk: Continued losses will breach your max drawdown and may suspend your account.`;
      case "consecutive_losses":
        return `⚠️ ${data.count} consecutive losses — total loss $${data.totalLoss}\nAction required: Pause and review your setup before placing another trade.\nRisk: Streak patterns often worsen without a deliberate reset.`;
      case "weekly_loss":
        return `⚠️ Weekly loss approaching limit — ${data.currentLoss}% of ${data.limit}% used\nAction required: Reduce position sizes by 50% for remaining trades this week.\nRisk: One more bad trade could trigger your weekly limit and lock your account.`;
      case "overtrading":
        return `⚠️ Overtrading alert — ${data.tradesCount} trades today vs your average of ${data.avgTrades}\nAction required: Stop opening new positions for the rest of the session.\nRisk: Overtrading increases commission costs and reduces strategy accuracy.`;
      case "position_size":
        return `⚠️ Position size ${data.positionSize}% exceeds your ${data.limit}% limit on ${data.symbol}\nAction required: Reduce position to your configured maximum before adding more.\nRisk: Oversized positions amplify losses and can break your risk plan.`;
      default:
        return `⚠️ Risk alert — ${alertType}\nAction required: Review your current exposure and adjust position sizing.\nRisk: Ignoring risk signals leads to compounding losses over time.`;
    }
  }
}

const buildUserPrompt = (alertType: string, data: Record<string, unknown>, severity: "medium" | "high"): string => {
  const severityInstruction =
    severity === "high"
      ? 'This is a HIGH severity alert. Use 🚨 emoji. Format: "🚨 [RULE VIOLATED]\\nWhat to do NOW: [action]\\nRisk: [consequence]"'
      : 'This is a MEDIUM severity alert. Use ⚠️ emoji. Format: "⚠️ [RULE VIOLATED]\\nAction required: [action]\\nRisk: [consequence]"';

  switch (alertType) {
    case "daily_drawdown":
      return `Daily drawdown is at ${data.currentDD}% of ${data.limitDD}% limit. Balance: $${data.balance}. ${severityInstruction}`;
    case "max_drawdown":
      return `Max drawdown reached ${data.currentDD}% of ${data.limitDD}% limit. Balance: $${data.balance}. ${severityInstruction}`;
    case "position_size":
      return `Position size ${data.positionSize}% exceeds ${data.limit}% limit on ${data.symbol}. ${severityInstruction}`;
    case "consecutive_losses":
      return `${data.count} consecutive losses detected. Total loss: $${data.totalLoss}. ${severityInstruction}`;
    case "weekly_loss":
      return `Weekly loss at ${data.currentLoss}% approaching ${data.limit}% limit. ${severityInstruction}`;
    case "overtrading":
      return `${data.tradesCount} trades today vs average ${data.avgTrades}. Overtrading pattern detected. ${severityInstruction}`;
    case "revenge_trading":
      return `${data.tradesCount} trades in ${data.minutes} minutes after a loss. Revenge trading pattern detected. ${severityInstruction}`;
    default:
      return `Trading risk alert: ${JSON.stringify(data)}. ${severityInstruction}`;
  }
};

export async function sendSmartTelegramAlert({
  chatId,
  alertType,
  data,
  fallbackMessage,
  supabase,
  userId,
}: {
  chatId: string;
  alertType: string;
  data: Record<string, unknown>;
  fallbackMessage?: string;
  supabase?: SupabaseClient;
  userId?: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const severity = detectSeverity(alertType, data);
  const staticFallback = buildFallback(alertType, data, severity);
  let message = fallbackMessage ?? staticFallback;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 200,
      temperature: 0.6,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(alertType, data, severity) },
      ],
    });

    const generated = completion.choices[0]?.message?.content?.trim();
    if (generated) message = generated;
  } catch (err) {
    console.error("[sendSmartTelegramAlert] OpenAI error, using fallback:", err);
    message = staticFallback;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, reason: "TELEGRAM_BOT_TOKEN not configured" };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    const result = (await res.json().catch(() => ({}))) as { ok: boolean; description?: string };
    if (!result.ok) return { ok: false, reason: result.description };

    if (supabase && userId) {
      await supabase
        .from("risk_violations")
        .insert({
          user_id: userId,
          rule_type: alertType,
          value_at_violation: String(
            data.currentDD ?? data.positionSize ?? data.count ?? data.tradesCount ?? data.currentLoss ?? ""
          ),
          limit_value: String(data.limitDD ?? data.limit ?? ""),
          message: message,
          notified_telegram: true,
          account_nickname: String(data.accountNickname ?? ""),
        })
        .then(({ error }) => {
          if (error) console.error("[sendSmartTelegramAlert] Failed to save violation:", error.message);
        });
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, reason: String(err) };
  }
}
