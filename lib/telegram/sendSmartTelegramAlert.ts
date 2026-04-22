import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are RiskSent, a professional trading risk management assistant.
Generate a short, direct Telegram alert message (max 3 lines) for a trader.
Be direct, professional, and actionable. Use 1 relevant emoji at the start.
Never use markdown formatting. Always end with one specific action the trader should take.
Keep it under 150 characters total.`;

const buildUserPrompt = (alertType: string, data: Record<string, unknown>): string => {
  switch (alertType) {
    case "daily_drawdown":
      return `Daily drawdown is at ${data.currentDD}% of ${data.limitDD}% limit. Balance: $${data.balance}. Generate a risk alert.`;
    case "max_drawdown":
      return `Max drawdown reached ${data.currentDD}% of ${data.limitDD}% limit. Balance: $${data.balance}. Generate a risk alert.`;
    case "position_size":
      return `Position size ${data.positionSize}% exceeds ${data.limit}% limit on ${data.symbol}. Generate a risk alert.`;
    case "consecutive_losses":
      return `${data.count} consecutive losses detected. Total loss: $${data.totalLoss}. Generate a risk alert.`;
    case "weekly_loss":
      return `Weekly loss at ${data.currentLoss}% approaching ${data.limit}% limit. Generate a risk alert.`;
    case "overtrading":
      return `${data.tradesCount} trades today vs average ${data.avgTrades}. Overtrading pattern detected. Generate a risk alert.`;
    case "revenge_trading":
      return `${data.tradesCount} trades in ${data.minutes} minutes after a loss. Revenge trading pattern detected. Generate a risk alert.`;
    default:
      return `Trading risk alert: ${JSON.stringify(data)}. Generate a risk alert.`;
  }
};

export async function sendSmartTelegramAlert({
  chatId,
  alertType,
  data,
  fallbackMessage,
}: {
  chatId: string;
  alertType: string;
  data: Record<string, unknown>;
  fallbackMessage: string;
}): Promise<{ ok: boolean; reason?: string }> {
  let message = fallbackMessage;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 150,
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(alertType, data) },
      ],
    });

    const generated = completion.choices[0]?.message?.content?.trim();
    if (generated) message = generated;
  } catch (err) {
    console.error("[sendSmartTelegramAlert] OpenAI error, using fallback:", err);
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
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: String(err) };
  }
}
