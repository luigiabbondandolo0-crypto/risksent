import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIpFromRequestHeaders } from "@/lib/security/rateLimit";
import { securityLog } from "@/lib/security/structuredLog";

const API_REQUESTS_PER_IP_PER_MIN = 240;
const SUSPICIOUS_LOG_COOLDOWN_MS = 60_000;

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
 * High-volume /api traffic from one IP (possible scan or abuse). Logs at most once per cooldown per IP per window.
 */
export function maybeLogSuspiciousApiTraffic(req: NextRequest): void {
  const path = req.nextUrl.pathname;
  if (!path.startsWith("/api/")) return;

  const ip = getClientIpFromRequestHeaders(req.headers);
  const burst = checkRateLimit(`traffic:api-burst:${ip}`, API_REQUESTS_PER_IP_PER_MIN, 60_000);
  if (burst.allowed) return;

  const logGate = checkRateLimit(`traffic:api-burst:log:${ip}`, 1, SUSPICIOUS_LOG_COOLDOWN_MS);
  if (!logGate.allowed) return;

  securityLog("warn", "security.suspicious.api_traffic", {
    ip,
    path,
    method: req.method,
    userAgent: req.headers.get("user-agent")?.slice(0, 200) ?? null,
    limitPerMinute: API_REQUESTS_PER_IP_PER_MIN
  });
}
