import { NextRequest, NextResponse } from "next/server";
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

  const url = req.nextUrl;
  const symbol = String(url.searchParams.get("symbol") ?? "").trim();
  const timeframe = String(url.searchParams.get("timeframe") ?? "").toUpperCase();
  const from = String(url.searchParams.get("from") ?? "").trim();
  const to = String(url.searchParams.get("to") ?? "").trim();

  if (!symbol || !from || !to) {
    return NextResponse.json({ error: "symbol, from, to required" }, { status: 400 });
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

  const u = new URL("https://api.twelvedata.com/time_series");
  u.searchParams.set("symbol", twelveSymbol);
  u.searchParams.set("interval", interval);
  u.searchParams.set("start_date", from);
  u.searchParams.set("end_date", to);
  u.searchParams.set("apikey", apiKey);
  u.searchParams.set("format", "JSON");
  u.searchParams.set("order", "asc");

  const res = await fetch(u.toString());
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
