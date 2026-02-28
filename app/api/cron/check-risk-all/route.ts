import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { runRiskCheckForAccount } from "@/lib/riskCheckRun";

/**
 * GET/POST /api/cron/check-risk-all
 * Esegue il risk check per tutti gli account collegati (LIVE polling).
 * Protetto da CRON_SECRET (header x-cron-secret o query secret).
 * Da chiamare ogni 1–2 minuti tramite Vercel Cron o altro scheduler.
 */
export async function GET(req: NextRequest) {
  return runCron(req);
}

export async function POST(req: NextRequest) {
  return runCron(req);
}

async function runCron(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const headerSecret = req.headers.get("x-cron-secret");
    const url = new URL(req.url);
    const querySecret = url.searchParams.get("secret");
    if (headerSecret !== secret && querySecret !== secret) {
      return NextResponse.json({ ok: false, reason: "Unauthorized" }, { status: 401 });
    }
  }

  const apiKey = process.env.METATRADERAPI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, reason: "METATRADERAPI_API_KEY not set" },
      { status: 500 }
    );
  }

  const admin = createSupabaseAdmin();
  const { data: accounts, error: accountsError } = await admin
    .from("trading_account")
    .select("user_id, metaapi_account_id")
    .not("metaapi_account_id", "is", null);

  if (accountsError) {
    return NextResponse.json(
      { ok: false, reason: accountsError.message },
      { status: 500 }
    );
  }

  const list = accounts ?? [];
  const results: { user_id: string; uuid: string; ok: boolean; error?: string; findingsCount: number }[] = [];

  for (const row of list) {
    const userId = row.user_id as string;
    const uuid = row.metaapi_account_id as string;
    const result = await runRiskCheckForAccount({
      userId,
      uuid,
      supabase: admin,
      apiKey
    });
    results.push({
      user_id: userId.slice(0, 8) + "...",
      uuid: uuid.slice(0, 8) + "...",
      ok: result.ok,
      error: result.error,
      findingsCount: result.findings.length
    });
  }

  return NextResponse.json({
    ok: true,
    accountsChecked: list.length,
    results
  });
}
