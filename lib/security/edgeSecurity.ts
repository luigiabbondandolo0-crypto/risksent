import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIpFromRequestHeaders } from "@/lib/security/rateLimit";
import { securityLog } from "@/lib/security/structuredLog";

function globalApiLimitPerMinute(): number {
  const raw = process.env.API_BURST_LIMIT_PER_MINUTE;
  if (!raw) return 120;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 30 && n <= 2000 ? n : 120;
}

const SUSPICIOUS_LOG_COOLDOWN_MS = 60_000;

function isGlobalApiRateLimitExcluded(pathname: string): boolean {
  if (pathname === "/api/stripe/webhook") return true;
  if (pathname === "/api/telegram-webhook" || pathname.startsWith("/api/telegram-webhook/")) return true;
  if (pathname === "/api/telegram/webhook" || pathname.startsWith("/api/telegram/webhook/")) return true;
  if (pathname.startsWith("/api/cron/")) return true;
  if (pathname.startsWith("/api/health/")) return true;
  return false;
}

/**
 * Production: redirect HTTP → HTTPS when the edge reports plain HTTP (e.g. misconfigured proxy).
 * Set ENFORCE_HTTPS=false to disable (e.g. local tunnel without forwarded proto).
 */
export function httpsUpgradeResponseIfNeeded(req: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== "production") return null;
  if (process.env.ENFORCE_HTTPS === "false") return null;

  const proto = req.headers.get("x-forwarded-proto");
  if (proto && proto !== "https") {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }
  return null;
}

export function applySecurityHeaders(_req: NextRequest, res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (process.env.NODE_ENV === "production") {
    res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  const coep = process.env.SECURITY_CROSS_ORIGIN_EMBEDDER_POLICY;
  if (coep === "require-corp") {
    res.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
    res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  }

  return res;
}

/**
 * Per-IP burst limit on /api (scraping / scripted abuse). Webhooks and health excluded.
 * Returns 429 when over limit; logs throttled security events.
 */
export async function enforceGlobalApiRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const path = req.nextUrl.pathname;
  if (!path.startsWith("/api/") || isGlobalApiRateLimitExcluded(path)) {
    return null;
  }

  const limit = globalApiLimitPerMinute();
  const ip = getClientIpFromRequestHeaders(req.headers);
  const burst = await checkRateLimit(`traffic:api-burst:${ip}`, limit, 60_000);
  if (burst.allowed) return null;

  const logGate = await checkRateLimit(`traffic:api-burst:log:${ip}`, 1, SUSPICIOUS_LOG_COOLDOWN_MS);
  if (logGate.allowed) {
    securityLog("warn", "security.suspicious.api_traffic", {
      ip,
      path,
      method: req.method,
      userAgent: req.headers.get("user-agent")?.slice(0, 200) ?? null,
      limitPerMinute: limit,
      action: "blocked_429"
    });
  }

  const res = NextResponse.json(
    { error: "Too many requests. Slow down or try again later." },
    { status: 429 }
  );
  res.headers.set("Retry-After", String(burst.retryAfterSeconds));
  res.headers.set("X-RateLimit-Limit", String(burst.limit));
  res.headers.set("X-RateLimit-Remaining", "0");
  return res;
}
