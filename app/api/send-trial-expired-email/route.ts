import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getTrialExpiredEmailTemplate } from "@/lib/email";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "RiskSent <info@risksent.com>";
const REPLY_TO = process.env.RESEND_REPLY_TO || "support@risksent.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, userName } = body as { to?: string; userName?: string };

    if (!to || typeof to !== "string") {
      return NextResponse.json({ error: "Missing `to` email address" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("[Email] RESEND_API_KEY not set — skipping trial-expired email");
      return NextResponse.json({ success: true, skipped: true });
    }

    const resend = new Resend(apiKey);
    const displayName = userName || to.split("@")[0];

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      replyTo: REPLY_TO,
      to,
      subject: "Your RiskSent trial has ended — choose a plan to continue",
      html: getTrialExpiredEmailTemplate(displayName),
    });

    if (error) {
      console.error("[Email] Failed to send trial-expired email:", error);
      return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
