import type { Candle } from "./btTypes";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const TTL_DAYS = 30;

export function ohlcvCacheKey(parts: Record<string, string>): string {
  return Object.entries(parts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

// Parse the key back to individual fields
function parseKey(key: string): { symbol: string; timeframe: string; from: string; to: string } {
  const map: Record<string, string> = {};
  for (const part of key.split("&")) {
    const eq = part.indexOf("=");
    if (eq > 0) map[part.slice(0, eq)] = part.slice(eq + 1);
  }
  return {
    symbol:    map.symbol    ?? "",
    timeframe: map.timeframe ?? "",
    from:      map.from      ?? "",
    to:        map.to        ?? "",
  };
}

export async function getCachedOhlcv(key: string): Promise<Candle[] | null> {
  try {
    const { symbol, timeframe, from, to } = parseKey(key);
    const admin = createSupabaseAdmin();
    const cutoff = new Date(Date.now() - TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await admin
      .from("ohlcv_cache")
      .select("candles, cached_at")
      .eq("symbol", symbol)
      .eq("timeframe", timeframe)
      .eq("date_from", from)
      .eq("date_to", to)
      .gt("cached_at", cutoff)
      .maybeSingle();

    if (error || !data) return null;
    return data.candles as Candle[];
  } catch {
    return null;
  }
}

export async function setCachedOhlcv(key: string, candles: Candle[]): Promise<void> {
  try {
    const { symbol, timeframe, from, to } = parseKey(key);
    const admin = createSupabaseAdmin();

    await admin
      .from("ohlcv_cache")
      .upsert(
        { symbol, timeframe, date_from: from, date_to: to, candles, cached_at: new Date().toISOString() },
        { onConflict: "symbol,timeframe,date_from,date_to" }
      );
  } catch {
    // Cache write failure is non-fatal
  }
}
