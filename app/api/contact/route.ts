import { NextRequest, NextResponse } from "next/server";
import {
  sendSupportContactConfirmationEmail,
  sendSupportInquiryToTeam,
} from "@/lib/email";
import { checkRateLimit, getClientIpFromRequestHeaders } from "@/lib/security/rateLimit";
import { sanitizeText } from "@/lib/security/validation";

const TOPIC_LABELS: Record<string, string> = {
  general: "General question",
  billing: "Billing & invoices",
  technical: "Technical issue",
  security: "Security / data request",
  feedback: "Feedback / feature request",
};

const CONTACT_LIMIT = 8;
const CONTACT_WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const ip = getClientIpFromRequestHeaders(req.headers);
  const limiter = await checkRateLimit(`contact:form:${ip}`, CONTACT_LIMIT, CONTACT_WINDOW_MS);
  if (!limiter.allowed) {
    const res = NextResponse.json({ error: "Too many submissions. Try again later." }, { status: 429 });
    res.headers.set("Retry-After", String(limiter.retryAfterSeconds));
    return res;
  }

  let body: { name?: string; email?: string; topic?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = sanitizeText(String(body.name ?? ""), 200);
  const email = String(body.email ?? "").trim().toLowerCase();
  const topic = String(body.topic ?? "general").trim();
  const message = sanitizeText(String(body.message ?? ""), 8000);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!name || !emailRegex.test(email) || !message) {
    return NextResponse.json(
      { error: "Name, valid email, and message are required." },
      { status: 400 }
    );
  }

  const topicLabel = TOPIC_LABELS[topic] ?? TOPIC_LABELS.general;

  const [toTeam, toUser] = await Promise.all([
    sendSupportInquiryToTeam({
      fromEmail: email,
      fromName: name,
      topicLabel,
      message,
    }),
    sendSupportContactConfirmationEmail({
      to: email,
      userName: name,
      topicLabel,
    }),
  ]);

  if (!toTeam.success) {
    return NextResponse.json(
      { error: toTeam.error ?? "Could not deliver message. Try again or email support@risksent.com." },
      { status: 502 }
    );
  }

  if (!toUser.success) {
    console.warn("[contact] user confirmation email failed:", toUser.error);
  }

  return NextResponse.json({ ok: true });
}
