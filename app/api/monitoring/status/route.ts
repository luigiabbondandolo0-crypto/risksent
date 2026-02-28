import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";

const METAAPI_BASE = "https://api.metatraderapi.dev";

/**
 * GET /api/monitoring/status
 * Returns connection status for MetaAPI and Supabase (for live-monitoring page).
 */
export async function GET() {
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.METATRADERAPI_API_KEY;
  const logs: { time: string; source: string; ok: boolean; message: string; detail?: string }[] = [];
  const t = () => new Date().toISOString();

  // Supabase
  try {
    const { data, error } = await supabase
      .from("app_user")
      .select("id")
      .eq("id", user.id)
      .limit(1)
      .single();
    if (error) {
      logs.push({ time: t(), source: "Supabase", ok: false, message: "DB query failed", detail: error.message });
    } else {
      logs.push({ time: t(), source: "Supabase", ok: true, message: "Connected", detail: data ? "User row found" : "No row" });
    }
  } catch (e) {
    logs.push({ time: t(), source: "Supabase", ok: false, message: "Exception", detail: e instanceof Error ? e.message : String(e) });
  }

  // MetaAPI: get first account uuid then ping
  let metaapiOk = false;
  if (!apiKey) {
    logs.push({ time: t(), source: "MetaAPI", ok: false, message: "METATRADERAPI_API_KEY not set" });
  } else {
    const { data: accounts } = await supabase
      .from("trading_account")
      .select("metaapi_account_id")
      .eq("user_id", user.id)
      .not("metaapi_account_id", "is", null)
      .limit(1);
    const uuid = accounts?.[0]?.metaapi_account_id ?? null;
    if (!uuid) {
      logs.push({ time: t(), source: "MetaAPI", ok: false, message: "No linked account (metaapi_account_id)" });
    } else {
      try {
        const res = await fetch(`${METAAPI_BASE}/AccountSummary?id=${encodeURIComponent(uuid)}`, {
          headers: { "x-api-key": apiKey, Accept: "application/json" }
        });
        metaapiOk = res.ok;
        if (res.ok) {
          const data = await res.json();
          const balance = data?.balance ?? "?";
          logs.push({ time: t(), source: "MetaAPI", ok: true, message: "AccountSummary OK", detail: `balance=${balance}` });
        } else {
          const text = await res.text();
          logs.push({ time: t(), source: "MetaAPI", ok: false, message: `HTTP ${res.status}`, detail: text.slice(0, 200) });
        }
      } catch (e) {
        logs.push({ time: t(), source: "MetaAPI", ok: false, message: "Request failed", detail: e instanceof Error ? e.message : String(e) });
      }
    }
  }

  const supabaseOk = logs.some((l) => l.source === "Supabase" && l.ok);
  return NextResponse.json({
    ok: supabaseOk && (metaapiOk || !apiKey),
    timestamp: new Date().toISOString(),
    logs,
    summary: {
      supabase: supabaseOk ? "connected" : "error",
      metaapi: !apiKey ? "no_key" : metaapiOk ? "connected" : "error"
    }
  });
}
