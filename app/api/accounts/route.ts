import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";

const DEBUG = process.env.NODE_ENV !== "production" || process.env.DEBUG_ACCOUNTS === "1";
const LOG = (...args: unknown[]) => (DEBUG ? console.log("[api/accounts]", ...args) : () => {});
const LOG_ERROR = (...args: unknown[]) => console.error("[api/accounts]", ...args);

export async function GET() {
  const requestId = `accounts-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  try {
    LOG(`[${requestId}] GET /api/accounts start`);

    const supabase = createSupabaseRouteClient();
    LOG(`[${requestId}] Supabase client created`);

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    LOG(`[${requestId}] getUser result:`, {
      hasUser: !!user,
      userId: user?.id ?? null,
      authError: authError ? String(authError) : null,
      authErrorDetails: authError ? JSON.stringify(authError, null, 2) : null
    });

    if (authError || !user) {
      LOG_ERROR(`[${requestId}] Unauthorized:`, authError ?? "no user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    LOG(`[${requestId}] Querying trading_account for user_id=${user.id}`);

    const { data: accounts, error } = await supabase
      .from("trading_account")
      .select("id, broker_type, account_number, account_name, metaapi_account_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    LOG(`[${requestId}] Query result:`, {
      rowCount: accounts?.length ?? 0,
      error: error ? String(error) : null,
      errorCode: error?.code,
      errorDetails: error ? JSON.stringify(error, null, 2) : null
    });

    if (error) {
      LOG_ERROR(`[${requestId}] Supabase error:`, error.message, "code:", error.code, "details:", error.details, "hint:", error.hint);
      return NextResponse.json(
        { error: `Accounts: ${error.message}. Ensure table trading_account exists (run supabase/schema.sql).` },
        { status: 500 }
      );
    }

    LOG(`[${requestId}] Success, returning ${accounts?.length ?? 0} accounts`);
    return NextResponse.json({ accounts: accounts ?? [] });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    LOG_ERROR(`[${requestId}] Exception:`, err.message, "stack:", err.stack);
    return NextResponse.json(
      {
        error: err.message,
        _debug: process.env.NODE_ENV !== "production" ? { requestId, stack: err.stack } : undefined
      },
      { status: 500 }
    );
  }
}
