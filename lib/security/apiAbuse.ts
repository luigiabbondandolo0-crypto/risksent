import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIpFromRequestHeaders, type RateLimitResult } from "@/lib/security/rateLimit";

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
export async function checkListApiRateLimit(req: NextRequest, userId: string): Promise<RateLimitResult> {
  const ip = getClientIpFromRequestHeaders(req.headers);
  const limit = envInt("API_LIST_BURST_PER_MINUTE", 90);
  return checkRateLimit(`api:list:${ip}:${userId}`, limit, 60_000);
}

/** AI coach chat — per user. */
export async function checkAiChatRateLimit(userId: string): Promise<RateLimitResult> {
  const limit = envInt("RATE_LIMIT_AI_CHAT_PER_HOUR", 40);
  const windowMs = envMs("RATE_LIMIT_AI_CHAT_WINDOW_MS", 60 * 60 * 1000);
  return checkRateLimit(`ai:chat:${userId}`, limit, windowMs);
}

/** AI coach analyze — expensive; per user per day. */
export async function checkAiAnalyzeRateLimit(userId: string): Promise<RateLimitResult> {
  const limit = envInt("RATE_LIMIT_AI_ANALYZE_PER_DAY", 12);
  const windowMs = envMs("RATE_LIMIT_AI_ANALYZE_WINDOW_MS", 24 * 60 * 60 * 1000);
  return checkRateLimit(`ai:analyze:${userId}`, limit, windowMs);
}

/** Stub / light AI insight endpoints. */
export async function checkAiInsightRateLimit(userId: string, kind: string): Promise<RateLimitResult> {
  const limit = envInt("RATE_LIMIT_AI_INSIGHT_PER_HOUR", 60);
  return checkRateLimit(`ai:insight:${kind}:${userId}`, limit, 60 * 60 * 1000);
}

/** Backtesting OHLCV fetches — per user to limit upstream API abuse. */
export async function checkOhlcvRateLimit(userId: string): Promise<RateLimitResult> {
  const limit = envInt("RATE_LIMIT_OHLCV_PER_MINUTE", 45);
  return checkRateLimit(`bt:ohlcv:${userId}`, limit, 60_000);
}

/** Journal image uploads — per IP + user (stricter than generic list endpoints). */
export async function checkJournalUploadRateLimit(req: NextRequest, userId: string): Promise<RateLimitResult> {
  const ip = getClientIpFromRequestHeaders(req.headers);
  const limit = envInt("RATE_LIMIT_JOURNAL_UPLOAD_PER_MINUTE", 20);
  return checkRateLimit(`api:upload:journal:${ip}:${userId}`, limit, 60_000);
}

export function rateLimitJsonResponse(
  limiter: RateLimitResult,
  message = "Too many requests. Try again later."
): NextResponse {
  const res = NextResponse.json({ error: message }, { status: 429 });
  res.headers.set("Retry-After", String(limiter.retryAfterSeconds));
  res.headers.set("X-RateLimit-Limit", String(limiter.limit));
  res.headers.set("X-RateLimit-Remaining", String(limiter.remaining));
  return res;
}
