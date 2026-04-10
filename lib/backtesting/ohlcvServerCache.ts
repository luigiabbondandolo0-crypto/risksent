import type { Candle } from "./btTypes";

type CacheEntry = { candles: Candle[]; cachedAt: number };

const store = new Map<string, CacheEntry>();
const TTL_MS = 1000 * 60 * 60 * 6;

export function getCachedOhlcv(key: string): Candle[] | null {
  const e = store.get(key);
  if (!e) return null;
  if (Date.now() - e.cachedAt > TTL_MS) {
    store.delete(key);
    return null;
  }
  return e.candles;
}

export function setCachedOhlcv(key: string, candles: Candle[]): void {
  store.set(key, { candles, cachedAt: Date.now() });
}

export function ohlcvCacheKey(parts: Record<string, string>): string {
  return Object.entries(parts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}
