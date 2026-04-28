import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { emailFingerprint, logAuthAttempt } from "@/lib/security/authAudit";
import { validatePasswordPolicy } from "@/lib/security/passwordPolicy";
import { checkRateLimit, getClientIpFromRequestHeaders } from "@/lib/security/rateLimit";
import { securityLog } from "@/lib/security/structuredLog";
import { sendRegistrationEmail } from "@/lib/email";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const SIGNUP_LIMIT = 5;
const SIGNUP_WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string; fullName?: string } = {};
  try {
    body = await req.json();
  } catch {
    logAuthAttempt(req, "auth.signup", "validation_error", { reason: "invalid_json" });
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const fullName = body.fullName?.trim() ?? "";
  if (!email || !password) {
    logAuthAttempt(req, "auth.signup", "validation_error", { reason: "missing_fields" });
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    logAuthAttempt(req, "auth.signup", "validation_error", { reason: "invalid_email" });
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const pwValidation = validatePasswordPolicy(password);
  if (!pwValidation.valid) {
    logAuthAttempt(req, "auth.signup", "validation_error", { reason: "password_policy" });
    return NextResponse.json({ error: pwValidation.message }, { status: 400 });
  }

  const fp = emailFingerprint(email);
  const ip = getClientIpFromRequestHeaders(req.headers);
  const limiter = checkRateLimit(`auth:signup:${ip}:${email}`, SIGNUP_LIMIT, SIGNUP_WINDOW_MS);
  if (!limiter.allowed) {
    logAuthAttempt(req, "auth.signup", "rate_limited", { email_fp: fp });
    const blocked = NextResponse.json(
      { error: "Too many signup attempts. Try again later." },
      { status: 429 }
    );
    blocked.headers.set("Retry-After", String(limiter.retryAfterSeconds));
    return blocked;
  }

  try {
    const adminClient = createSupabaseAdmin();
    const redirectTo = new URL("/auth/callback?next=/login", req.nextUrl.origin).toString();

    // Use admin generateLink to bypass Supabase's built-in SMTP and send via Resend instead.
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        redirectTo,
        data: { full_name: fullName },
      },
    });

    if (error) {
      logAuthAttempt(req, "auth.signup", "failure", { email_fp: fp, reason: "supabase_error" });
      if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "Unable to create account." }, { status: 400 });
    }

    const verificationUrl = data.properties?.action_link;
    logAuthAttempt(req, "auth.signup", "success", {
      email_fp: fp,
      user_id: data.user?.id ?? null
    });

    void sendRegistrationEmail({
      to: email,
      userName: fullName || undefined,
      verificationUrl: verificationUrl ?? undefined,
    }).catch((err) => {
      securityLog("warn", "api.auth.signup.email_failed", { email_fp: fp, message: err instanceof Error ? err.message : "unknown" });
    });

    return NextResponse.json(
      { ok: true, message: "Account created. Check your email to verify your address." }
    );
  } catch (e) {
    Sentry.captureException(e);
    securityLog("error", "api.auth.signup.exception", {
      ip,
      message: e instanceof Error ? e.message : "unknown"
    });
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
