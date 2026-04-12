import { NextResponse } from "next/server";

export async function GET() {
  const start = Date.now();
  try {
    const apiKey = process.env.TWELVE_DATA_API_KEY ?? "demo";
    const res = await fetch(
      `https://api.twelvedata.com/time_series?symbol=EUR/USD&interval=1min&outputsize=1&apikey=${apiKey}`,
      { signal: AbortSignal.timeout(5000) }
    );
    return NextResponse.json({ ok: res.ok, ms: Date.now() - start, checkedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false, ms: Date.now() - start, checkedAt: new Date().toISOString() });
  }
}
