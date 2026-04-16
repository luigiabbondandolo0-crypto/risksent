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
  const from = String(url.searchParams.get("from") ?? "").trim();
  const to = String(url.searchParams.get("to") ?? "").trim();

  if (!from || !to) {
    return NextResponse.json({ error: "from and to required" }, { status: 400 });
  }
  if (!isIsoDate(from) || !isIsoDate(to)) {
    return NextResponse.json({ error: "from and to must be YYYY-MM-DD" }, { status: 400 });
  }
  if (!isTimeframe(timeframe)) {
    return NextResponse.json({ error: "invalid timeframe" }, { status: 400 });
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TWELVE_DATA_API_KEY not configured" }, { status: 500 });
  }

  const cacheKey = ohlcvCacheKey({ symbol, timeframe, from, to });
  const mem = getCachedOhlcv(cacheKey);
  if (mem) {
    return NextResponse.json({ candles: mem, cached: true, source: "memory" });
  }

  const twelveSymbol = normalizeTwelveDataSymbol(symbol);
  const interval = timeframeToInterval(timeframe);

  // Build query manually: URLSearchParams percent-encodes "/" in symbols like "EUR/USD"
  // but TwelveData requires the literal slash. Replace %2F back to "/" after encoding.
  const encSym = encodeURIComponent(twelveSymbol).replace(/%2F/gi, "/");
  const tdUrl =
    `https://api.twelvedata.com/time_series` +
    `?symbol=${encSym}` +
    `&interval=${encodeURIComponent(interval)}` +
    `&start_date=${encodeURIComponent(from)}` +
    `&end_date=${encodeURIComponent(to)}` +
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
