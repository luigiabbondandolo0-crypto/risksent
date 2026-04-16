import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIpFromRequestHeaders } from "@/lib/security/rateLimit";

function envInt(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function envMs(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Authenticated reads (list endpoints) — per IP + user id to limit scraping. */
export function checkListApiRateLimit(req: NextRequest, userId: string): ReturnType<typeof checkRateLimit> {
  const ip = getClientIpFromRequestHeaders(req.headers);
  const limit = envInt("API_LIST_BURST_PER_MINUTE", 90);
  const windowMs = 60_000;
  return checkRateLimit(`api:list:${ip}:${userId}`, limit, windowMs);
}

/** AI coach chat — per user. */
export function checkAiChatRateLimit(userId: string): ReturnType<typeof checkRateLimit> {
  const limit = envInt("RATE_LIMIT_AI_CHAT_PER_HOUR", 40);
  const windowMs = envMs("RATE_LIMIT_AI_CHAT_WINDOW_MS", 60 * 60 * 1000);
  return checkRateLimit(`ai:chat:${userId}`, limit, windowMs);
}

/** AI coach analyze — expensive; per user per day. */
export function checkAiAnalyzeRateLimit(userId: string): ReturnType<typeof checkRateLimit> {
  const limit = envInt("RATE_LIMIT_AI_ANALYZE_PER_DAY", 12);
  const windowMs = envMs("RATE_LIMIT_AI_ANALYZE_WINDOW_MS", 24 * 60 * 60 * 1000);
  return checkRateLimit(`ai:analyze:${userId}`, limit, windowMs);
}

/** Stub / light AI insight endpoints. */
export function checkAiInsightRateLimit(userId: string, kind: string): ReturnType<typeof checkRateLimit> {
  const limit = envInt("RATE_LIMIT_AI_INSIGHT_PER_HOUR", 60);
  const windowMs = 60 * 60 * 1000;
  return checkRateLimit(`ai:insight:${kind}:${userId}`, limit, windowMs);
}

/** Backtesting OHLCV fetches — per user to limit upstream API abuse. */
export function checkOhlcvRateLimit(userId: string): ReturnType<typeof checkRateLimit> {
  const limit = envInt("RATE_LIMIT_OHLCV_PER_MINUTE", 45);
  return checkRateLimit(`bt:ohlcv:${userId}`, limit, 60_000);
}

/** Journal image uploads — per IP + user (stricter than generic list endpoints). */
export function checkJournalUploadRateLimit(req: NextRequest, userId: string): ReturnType<typeof checkRateLimit> {
  const ip = getClientIpFromRequestHeaders(req.headers);
  const limit = envInt("RATE_LIMIT_JOURNAL_UPLOAD_PER_MINUTE", 20);
  return checkRateLimit(`api:upload:journal:${ip}:${userId}`, limit, 60_000);
}

export function rateLimitJsonResponse(
  limiter: ReturnType<typeof checkRateLimit>,
  message = "Too many requests. Try again later."
): NextResponse {
  const res = NextResponse.json({ error: message }, { status: 429 });
  res.headers.set("Retry-After", String(limiter.retryAfterSeconds));
  res.headers.set("X-RateLimit-Limit", String(limiter.limit));
  res.headers.set("X-RateLimit-Remaining", String(limiter.remaining));
  return res;
}
