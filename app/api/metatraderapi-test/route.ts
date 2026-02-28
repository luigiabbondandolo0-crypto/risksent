import { NextResponse } from "next/server";

const BASE = "https://api.metatraderapi.dev";

export type MetatraderApiTestLog = {
  ts: string;
  level: "info" | "warn" | "error";
  message: string;
  data?: unknown;
};

export async function GET() {
  const logs: MetatraderApiTestLog[] = [];
  const addLog = (
    level: MetatraderApiTestLog["level"],
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

  const apiKey = process.env.METATRADERAPI_API_KEY;
  const accountId = process.env.METATRADERAPI_UUID;

  addLog("info", "Checking env vars", {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? `${apiKey.slice(0, 8)}...` : "missing",
    hasUuid: !!accountId,
    uuid: accountId ?? "missing"
  });

  if (!apiKey) {
    addLog("error", "METATRADERAPI_API_KEY not set in Vercel env");
    return NextResponse.json({
      ok: false,
      logs,
      error: "Missing METATRADERAPI_API_KEY"
    });
  }

  if (!accountId) {
    addLog("error", "METATRADERAPI_UUID not set in Vercel env");
    return NextResponse.json({
      ok: false,
      logs,
      error: "Missing METATRADERAPI_UUID"
    });
  }

  const url = `${BASE}/AccountSummary?id=${encodeURIComponent(accountId)}`;
  addLog("info", "Calling MetatraderApi.dev", { url, method: "GET" });

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json"
      }
    });

    addLog(
      res.ok ? "info" : "error",
      `MetatraderApi.dev response: ${res.status} ${res.statusText}`,
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
