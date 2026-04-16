import crypto from "crypto";
import { getClientIpFromRequestHeaders } from "@/lib/security/rateLimit";
import { securityLog, type SecurityLogPayload } from "@/lib/security/structuredLog";
import type { NextRequest } from "next/server";

export function emailFingerprint(email: string): string {
  const normalized = email.trim().toLowerCase();
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

export function clientIp(req: NextRequest): string {
  return getClientIpFromRequestHeaders(req.headers);
}

export function logAuthAttempt(
  req: NextRequest,
  event: "auth.login" | "auth.signup" | "auth.password_reset_request" | "auth.password_reset" | "auth.change_password",
  outcome: "success" | "failure" | "rate_limited" | "validation_error",
  extra: SecurityLogPayload = {}
) {
  securityLog(outcome === "failure" || outcome === "rate_limited" ? "warn" : "info", event, {
    outcome,
    ip: clientIp(req),
    ...extra
  });
}
