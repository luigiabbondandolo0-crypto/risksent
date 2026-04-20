import { NextRequest, NextResponse } from "next/server";
import { checkOhlcvRateLimit, rateLimitJsonResponse } from "@/lib/security/apiAbuse";
import { isIsoDate, sanitizeMarketSymbol } from "@/lib/security/validation";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import type { BtTimeframe, Candle } from "@/lib/backtesting/btTypes";
import { getCachedOhlcv, ohlcvCacheKey, setCachedOhlcv } from "@/lib/backtesting/ohlcvServerCache";
import { normalizeTwelveDataSymbol, parseTwelveDataResponse, timeframeToInterval } from "@/lib/backtesting/twelveData";

const TIMEFRAMES: BtTimeframe[] = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"];

function isTimeframe(s: string): s is BtTimeframe {
  return (TIMEFRAMES as string[]).includes(s);
}

/**
 * Calculate a start date that is approximately `count` candles before `dateStr`.
 * Adds a 1.5× multiplier to account for weekends and market gaps.
 */
function subtractCandlesAsDate(dateStr: string, tf: BtTimeframe, count: number): string {
  const minutesPerCandle: Record<BtTimeframe, number> = {
    M1: 1, M5: 5, M15: 15, M30: 30, H1: 60, H4: 240, D1: 1440,
  };
  const totalMinutes = count * minutesPerCandle[tf] * 1.5;
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCMinutes(date.getUTCMinutes() - totalMinutes);
  return date.toISOString().split("T")[0];
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const burst = checkOhlcvRateLimit(user.id);
  if (!burst.allowed) {
    return rateLimitJsonResponse(burst, "Too many market data requests. Try again shortly.");
  }

  const url = req.nextUrl;
  const symCheck = sanitizeMarketSymbol(String(url.searchParams.get("symbol") ?? ""));
  if (!symCheck.ok) {
    return NextResponse.json({ error: symCheck.error }, { status: 400 });
  }
  const symbol = symCheck.symbol;
  const timeframe = String(url.searchParams.get("timeframe") ?? "").toUpperCase();
  const preload = url.searchParams.get("preload") === "true";

  if (!isTimeframe(timeframe)) {
    return NextResponse.json({ error: "invalid timeframe" }, { status: 400 });
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TWELVE_DATA_API_KEY not configured" }, { status: 500 });
  }

  let queryFrom: string;
  let queryTo: string;

  if (preload) {
    // Preload mode: 'from' is the session start (= end of preload window).
    // Route calculates the actual start by going back ~500 candles.
    const sessionStart = String(url.searchParams.get("from") ?? "").trim();
    if (!isIsoDate(sessionStart)) {
      return NextResponse.json({ error: "from must be YYYY-MM-DD" }, { status: 400 });
    }
    queryTo = sessionStart;
    queryFrom = subtractCandlesAsDate(sessionStart, timeframe, 500);
  } else {
    const from = String(url.searchParams.get("from") ?? "").trim();
    const to = String(url.searchParams.get("to") ?? "").trim();
    if (!from || !to) {
      return NextResponse.json({ error: "from and to required" }, { status: 400 });
    }
    if (!isIsoDate(from) || !isIsoDate(to)) {
      return NextResponse.json({ error: "from and to must be YYYY-MM-DD" }, { status: 400 });
    }
    if (from >= to) {
      return NextResponse.json({ error: "from must be before to" }, { status: 400 });
    }
    queryFrom = from;
    queryTo = to;
  }

  const cacheKey = ohlcvCacheKey({ symbol, timeframe, from: queryFrom, to: queryTo });
  const mem = getCachedOhlcv(cacheKey);
  if (mem) {
    return NextResponse.json({ candles: mem, cached: true, source: "memory" });
  }

  const twelveSymbol = normalizeTwelveDataSymbol(symbol);
  const interval = timeframeToInterval(timeframe);

  const encSym = encodeURIComponent(twelveSymbol).replace(/%2F/gi, "/");
  const tdUrl =
    `https://api.twelvedata.com/time_series` +
    `?symbol=${encSym}` +
    `&interval=${encodeURIComponent(interval)}` +
    `&start_date=${encodeURIComponent(queryFrom)}` +
    `&end_date=${encodeURIComponent(queryTo)}` +
    `&apikey=${encodeURIComponent(apiKey)}` +
    `&format=JSON` +
    `&order=asc` +
    `&outputsize=5000`;

  const res = await fetch(tdUrl);
  const json = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    return NextResponse.json(
      { error: typeof json.message === "string" ? json.message : "Twelve Data error" },
      { status: 502 }
    );
  }

  if (json.status === "error" && typeof json.message === "string") {
    return NextResponse.json({ error: json.message }, { status: 502 });
  }

  const candles: Candle[] = parseTwelveDataResponse(json as { values?: unknown[] });
  setCachedOhlcv(cacheKey, candles);

  return NextResponse.json({ candles, cached: false, source: "twelvedata" });
}
