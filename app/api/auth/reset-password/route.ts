import { NextRequest, NextResponse } from "next/server";
import { logAuthAttempt } from "@/lib/security/authAudit";
import { validatePasswordPolicy } from "@/lib/security/passwordPolicy";
import { checkRateLimit, getClientIpFromRequestHeaders } from "@/lib/security/rateLimit";
import { securityLog } from "@/lib/security/structuredLog";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/routeHandlerClient";

const RESET_PASSWORD_LIMIT = 5;
const RESET_PASSWORD_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  let body: { newPassword?: string } = {};
  try {
    body = await req.json();
  } catch {
    logAuthAttempt(req, "auth.password_reset", "validation_error", { reason: "invalid_json" });
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const newPassword = body.newPassword ?? "";
  const pwValidation = validatePasswordPolicy(newPassword);
  if (!pwValidation.valid) {
    logAuthAttempt(req, "auth.password_reset", "validation_error", { reason: "password_policy" });
    return NextResponse.json({ error: pwValidation.message }, { status: 400 });
  }

  const ip = getClientIpFromRequestHeaders(req.headers);
  const limiter = checkRateLimit(`auth:reset-password:${ip}`, RESET_PASSWORD_LIMIT, RESET_PASSWORD_WINDOW_MS);
  if (!limiter.allowed) {
    logAuthAttempt(req, "auth.password_reset", "rate_limited", {});
    const blocked = NextResponse.json(
      { error: "Too many reset attempts. Try again later." },
      { status: 429 }
    );
    blocked.headers.set("Retry-After", String(limiter.retryAfterSeconds));
    return blocked;
  }

  const res = NextResponse.json({ ok: true });
  try {
    const supabase = createSupabaseRouteHandlerClient(req, res);
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      logAuthAttempt(req, "auth.password_reset", "failure", { reason: "no_session" });
      return NextResponse.json(
        { error: "Reset session expired. Request a new reset link." },
        { status: 401 }
      );
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      logAuthAttempt(req, "auth.password_reset", "failure", {
        user_id: user.id,
        reason: "update_rejected"
      });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await supabase.auth.signOut();
    logAuthAttempt(req, "auth.password_reset", "success", { user_id: user.id });
    return res;
  } catch (e) {
    securityLog("error", "api.auth.reset_password.exception", {
      ip,
      message: e instanceof Error ? e.message : "unknown"
    });
    return NextResponse.json({ error: "Unable to reset password." }, { status: 500 });
  }
}
