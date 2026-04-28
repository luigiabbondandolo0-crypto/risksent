export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

// ─── In-memory fallback (local dev / KV unavailable) ─────────────────────────

type MemEntry = { count: number; resetAt: number };
const memStore = new Map<string, MemEntry>();

function checkRateLimitMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  for (const [k, v] of memStore) {
    if (v.resetAt <= now) memStore.delete(k);
  }
  const cur = memStore.get(key);
  if (!cur || cur.resetAt <= now) {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, limit, remaining: Math.max(0, limit - 1), retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }
  if (cur.count >= limit) {
    return { allowed: false, limit, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil((cur.resetAt - now) / 1000)) };
  }
  cur.count += 1;
  memStore.set(key, cur);
  return { allowed: true, limit, remaining: Math.max(0, limit - cur.count), retryAfterSeconds: Math.max(1, Math.ceil((cur.resetAt - now) / 1000)) };
}

// ─── Vercel KV (Redis) — persistent across serverless instances ───────────────

async function checkRateLimitKV(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const { kv } = await import("@vercel/kv");
  const redisKey = `rl:${key}`;
  const windowSecs = Math.ceil(windowMs / 1000);

  // INCR is atomic; set TTL only on first request so window doesn't slide
  const count = await kv.incr(redisKey);
  if (count === 1) {
    await kv.expire(redisKey, windowSecs);
  }

  const ttl = await kv.ttl(redisKey);
  const retryAfterSeconds = ttl > 0 ? ttl : windowSecs;

  if (count > limit) {
    return { allowed: false, limit, remaining: 0, retryAfterSeconds };
  }
  return { allowed: true, limit, remaining: Math.max(0, limit - count), retryAfterSeconds };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check rate limit for `key`. Uses Vercel KV when configured (persistent across
 * lambdas), falls back to in-memory Map for local dev.
 */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      return await checkRateLimitKV(key, limit, windowMs);
    } catch {
      // KV unavailable — degrade gracefully to in-memory
    }
  }
  return checkRateLimitMemory(key, limit, windowMs);
}

export function getClientIpFromRequestHeaders(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const firstIp = xff.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
