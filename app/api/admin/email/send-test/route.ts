import { NextRequest, NextResponse } from "next/server";
import { checkAdminRole } from "@/lib/adminAuth";
import { getEmailPreviewHtml, type PreviewEmailType } from "@/lib/email";
import { Resend } from "resend";

const ALL_TYPES: PreviewEmailType[] = [
  "onboarding-mastermail",
  "marketing-drip-1",
  "marketing-drip-2",
  "marketing-drip-3",
  "marketing-drip-4",
  "marketing-drip-5",
  "marketing-drip-6",
  "marketing-drip-7",
  "marketing-drip-8",
  "marketing-drip-9",
  "marketing-drip-10",
  "weekly-insight-1",
  "weekly-insight-2",
  "weekly-insight-3",
  "weekly-insight-4",
];

const SUBJECTS: Record<PreviewEmailType, string> = {
  "onboarding-mastermail": "[TEST] Your RiskSent setup guide",
  "marketing-drip-1": "[TEST] D+1 — Your risk command center is ready",
  "marketing-drip-2": "[TEST] D+2 — The rules that protect traders from themselves",
  "marketing-drip-3": "[TEST] D+3 — Get alerted before the damage is done",
  "marketing-drip-4": "[TEST] D+4 — Find out if your strategy actually works",
  "marketing-drip-5": "[TEST] D+5 — Replay any session bar by bar",
  "marketing-drip-6": "[TEST] D+6 — Your personal trading analyst 24/7",
  "marketing-drip-7": "[TEST] D+7 — The habit that separates professionals",
  "marketing-drip-8": "[TEST] D+8 — Get an objective review of every trade",
  "marketing-drip-9": "[TEST] D+9 — Your real-time risk radar",
  "marketing-drip-10": "[TEST] D+10 — Earn while you trade",
  "weekly-insight-1": "[TEST] Weekly Insight #1 — Daily loss story",
  "weekly-insight-2": "[TEST] Weekly Insight #2 — FTMO challenge",
  "weekly-insight-3": "[TEST] Weekly Insight #3 — Hidden pattern",
  "weekly-insight-4": "[TEST] Weekly Insight #4 — Journal habit",
  "onboarding-1": "[TEST] Onboarding tip D+1",
  "onboarding-2": "[TEST] Onboarding tip D+3",
  "onboarding-3": "[TEST] Onboarding tip D+7",
  "weekly-insight": "[TEST] Weekly insight",
};

/**
 * POST /api/admin/email/send-test
 * Body: { to: string, types?: PreviewEmailType[] }
 * Sends test versions of the specified (or all) email templates to `to`.
 * Admin-only. Requires RESEND_API_KEY.
 */
export async function POST(req: NextRequest) {
  const { isAdmin } = await checkAdminRole();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not configured. Add it to your environment variables." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body?.to) {
    return NextResponse.json({ error: "to is required" }, { status: 400 });
  }

  const types: PreviewEmailType[] = body.types ?? ALL_TYPES;
  const from = process.env.RESEND_FROM_EMAIL || "RiskSent <noreply@risksent.com>";
  const resend = new Resend(apiKey);

  const results: Array<{ type: string; ok: boolean; error?: string }> = [];

  for (const type of types) {
    try {
      const html = getEmailPreviewHtml(type);
      const subject = SUBJECTS[type] ?? `[TEST] ${type}`;
      const { error } = await resend.emails.send({ from, to: body.to, subject, html });
      if (error) {
        results.push({ type, ok: false, error: error.message });
      } else {
        results.push({ type, ok: true });
      }
    } catch (e) {
      results.push({ type, ok: false, error: e instanceof Error ? e.message : "unknown" });
    }
  }

  return NextResponse.json({
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
