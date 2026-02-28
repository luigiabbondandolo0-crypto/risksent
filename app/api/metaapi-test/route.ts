import { NextRequest, NextResponse } from "next/server";

const METAAPI_BASE =
  "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";

export type MetaApiTestLog = {
  ts: string;
  level: "info" | "warn" | "error";
  message: string;
  data?: unknown;
};

export async function GET(req: NextRequest) {
  const logs: MetaApiTestLog[] = [];
  const addLog = (
    level: MetaApiTestLog["level"],
    message: string,
    data?: unknown
  ) => {
    logs.push({
      ts: new Date().toISOString(),
      level,
      message,
      data
    });
  };

  const apiKey = process.env.METATRADER_API_KEY;
  addLog("info", "Checking env vars", {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? `${apiKey.slice(0, 8)}...` : "missing"
  });

  if (!apiKey) {
    addLog("error", "METATRADER_API_KEY not set in Vercel env");
    return NextResponse.json({
      ok: false,
      logs,
      error: "Missing METATRADER_API_KEY"
    });
  }

  const url = `${METAAPI_BASE}/users/current/accounts?limit=5`;
  addLog("info", "Calling MetaApi", { url, method: "GET" });

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "auth-token": apiKey,
        Accept: "application/json"
      }
    });

    addLog(
      res.ok ? "info" : "error",
      `MetaApi response: ${res.status} ${res.statusText}`,
      {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries())
      }
    );

    const text = await res.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text.slice(0, 500) };
    }

    addLog("info", "Response body", body);

    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        logs,
        status: res.status,
        body
      });
    }

    return NextResponse.json({
      ok: true,
      logs,
      status: res.status,
      body
    });
  } catch (err) {
    addLog("error", "Fetch failed", {
      error: err instanceof Error ? err.message : String(err)
    });
    return NextResponse.json({
      ok: false,
      logs,
      error: err instanceof Error ? err.message : String(err)
    });
  }
}
