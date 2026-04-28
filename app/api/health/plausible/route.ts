import { NextResponse } from "next/server";

export async function GET() {
  const start = Date.now();
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) {
    return NextResponse.json({ ok: false, ms: 0, checkedAt: new Date().toISOString(), error: "NEXT_PUBLIC_PLAUSIBLE_DOMAIN not set" });
  }
  try {
    const res = await fetch("https://plausible.io/js/script.js", {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    return NextResponse.json({ ok: res.ok, ms: Date.now() - start, checkedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false, ms: Date.now() - start, checkedAt: new Date().toISOString() });
  }
}
