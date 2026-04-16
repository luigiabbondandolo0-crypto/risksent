import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIpFromRequestHeaders } from "@/lib/security/rateLimit";
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
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const ip = getClientIpFromRequestHeaders(req.headers);
  const limiter = checkRateLimit(`auth:login:${ip}:${email}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!limiter.allowed) {
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
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401, headers: res.headers });
    }

    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "Please verify your email before signing in." },
        { status: 403, headers: res.headers }
      );
    }

    return res;
  } catch {
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500, headers: res.headers });
  }
}
