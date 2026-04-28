import { NextRequest, NextResponse } from "next/server";
import { emailFingerprint, logAuthAttempt } from "@/lib/security/authAudit";
import { checkRateLimit, getClientIpFromRequestHeaders } from "@/lib/security/rateLimit";
import { securityLog } from "@/lib/security/structuredLog";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/routeHandlerClient";

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;

function buildRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  retryAfterSeconds: number
) {
  response.headers.set("X-RateLimit-Limit", String(limit));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("Retry-After", String(retryAfterSeconds));
}

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    logAuthAttempt(req, "auth.login", "validation_error", { reason: "invalid_json" });
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) {
    logAuthAttempt(req, "auth.login", "validation_error", { reason: "missing_fields" });
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const fp = emailFingerprint(email);
  const ip = getClientIpFromRequestHeaders(req.headers);
  const limiter = checkRateLimit(`auth:login:${ip}:${email}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!limiter.allowed) {
    logAuthAttempt(req, "auth.login", "rate_limited", { email_fp: fp });
    const blocked = NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 }
    );
    buildRateLimitHeaders(blocked, limiter.limit, limiter.remaining, limiter.retryAfterSeconds);
    return blocked;
  }

  const res = NextResponse.json({ ok: true });
  buildRateLimitHeaders(res, limiter.limit, limiter.remaining, limiter.retryAfterSeconds);

  try {
    const supabase = createSupabaseRouteHandlerClient(req, res);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      const msg = error?.message?.toLowerCase() ?? "";
      if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
        logAuthAttempt(req, "auth.login", "failure", { email_fp: fp, reason: "email_unverified" });
        return NextResponse.json(
          { error: "Please verify your email before signing in. Check your inbox for the confirmation link." },
          { status: 403, headers: res.headers }
        );
      }
      logAuthAttempt(req, "auth.login", "failure", { email_fp: fp, reason: "invalid_credentials" });
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401, headers: res.headers });
    }

    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      logAuthAttempt(req, "auth.login", "failure", { email_fp: fp, reason: "email_unverified" });
      return NextResponse.json(
        { error: "Please verify your email before signing in." },
        { status: 403, headers: res.headers }
      );
    }

    logAuthAttempt(req, "auth.login", "success", { email_fp: fp, user_id: data.user.id });
    return res;
  } catch (e) {
    securityLog("error", "api.auth.login.exception", {
      ip,
      message: e instanceof Error ? e.message : "unknown"
    });
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500, headers: res.headers });
  }
}
