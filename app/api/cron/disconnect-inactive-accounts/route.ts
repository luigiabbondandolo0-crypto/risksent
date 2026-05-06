import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { undeployMetaApiAccount } from "@/lib/metaapi/accountLifecycle";
import { securityLog } from "@/lib/security/structuredLog";

/**
 * GET/POST /api/cron/disconnect-inactive-accounts
 *
 * Undeploys MetaApi accounts that have been inactive for 48+ hours.
 * Runs every 6h via Vercel Cron. Auth: CRON_SECRET.
 *
 * DB columns required on trading_account:
 *   last_active_at  timestamptz
 *   metaapi_status  text  (values: 'connected' | 'reconnecting' | 'undeployed' | 'unknown')
 */
export async function GET(req: NextRequest) {
  return runCron(req);
}

export async function POST(req: NextRequest) {
  return runCron(req);
}

async function runCron(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, reason: "CRON_SECRET not configured" }, { status: 401 });
  }
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const headerSecret = req.headers.get("x-cron-secret");
  const valid = bearerToken === secret || headerSecret === secret;
  if (!valid) {
    return NextResponse.json({ ok: false, reason: "Unauthorized" }, { status: 401 });
  }

  const INACTIVE_MS = 48 * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - INACTIVE_MS).toISOString();

  const admin = createSupabaseAdmin();

  const { data: accounts, error } = await admin
    .from("trading_account")
    .select("metaapi_account_id, user_id")
    .not("metaapi_account_id", "is", null)
    .neq("metaapi_status", "undeployed")
    .or(`last_active_at.is.null,last_active_at.lt.${cutoff}`);

  if (error) {
    console.error("[cron/disconnect-inactive-accounts] query error:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const results: Array<{ accountId: string; ok: boolean }> = [];

  for (const acc of accounts ?? []) {
    const id = String(acc.metaapi_account_id ?? "").trim();
    if (!id) continue;

    const ok = await undeployMetaApiAccount(id);
    if (ok) {
      await admin
        .from("trading_account")
        .update({ metaapi_status: "undeployed" })
        .eq("metaapi_account_id", id);
    }
    results.push({ accountId: id, ok });
  }

  securityLog("info", "cron.disconnect-inactive-accounts.done", { processed: results.length, ok: results.filter((r) => r.ok).length });
  return NextResponse.json({ ok: true, processed: results.length, results });
}
