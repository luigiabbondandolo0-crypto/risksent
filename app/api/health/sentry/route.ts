import { NextResponse } from "next/server";

export async function GET() {
  const start = Date.now();
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    return NextResponse.json({ ok: false, ms: 0, checkedAt: new Date().toISOString(), error: "SENTRY_DSN not set" });
  }
  try {
    // Extract host from DSN (https://KEY@HOST/PROJECT)
    const url = new URL(dsn);
    const base = `${url.protocol}//${url.hostname}`;
    const res = await fetch(base, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    return NextResponse.json({ ok: res.ok || res.status < 500, ms: Date.now() - start, checkedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false, ms: Date.now() - start, checkedAt: new Date().toISOString() });
  }
}
