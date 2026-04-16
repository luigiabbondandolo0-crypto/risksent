import { NextRequest, NextResponse } from "next/server";
import { emailFingerprint, logAuthAttempt } from "@/lib/security/authAudit";
import { checkRateLimit, getClientIpFromRequestHeaders } from "@/lib/security/rateLimit";
import { securityLog } from "@/lib/security/structuredLog";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/routeHandlerClient";

const RESET_LIMIT = 3;
const RESET_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  let body: { email?: string } = {};
  try {
    body = await req.json();
  } catch {
    logAuthAttempt(req, "auth.password_reset_request", "validation_error", { reason: "invalid_json" });
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    logAuthAttempt(req, "auth.password_reset_request", "validation_error", { reason: "missing_email" });
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    logAuthAttempt(req, "auth.password_reset_request", "validation_error", { reason: "invalid_email" });
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const fp = emailFingerprint(email);
  const ip = getClientIpFromRequestHeaders(req.headers);
  const limiter = checkRateLimit(`auth:reset-request:${ip}:${email}`, RESET_LIMIT, RESET_WINDOW_MS);
  if (!limiter.allowed) {
    logAuthAttempt(req, "auth.password_reset_request", "rate_limited", { email_fp: fp });
    const blocked = NextResponse.json(
      { error: "Too many reset requests. Try again later." },
      { status: 429 }
    );
    blocked.headers.set("Retry-After", String(limiter.retryAfterSeconds));
    return blocked;
  }

  const res = NextResponse.json({
    ok: true,
    message: "If the email exists, a reset link has been sent."
  });

  try {
    const supabase = createSupabaseRouteHandlerClient(req, res);
    const redirectTo = `${req.nextUrl.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
    await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    logAuthAttempt(req, "auth.password_reset_request", "success", { email_fp: fp });
    return res;
  } catch (e) {
    securityLog("warn", "api.auth.request_password_reset.exception", {
      email_fp: fp,
      ip,
      message: e instanceof Error ? e.message : "unknown"
    });
    // Keep response generic to avoid account enumeration.
    return res;
  }
}
