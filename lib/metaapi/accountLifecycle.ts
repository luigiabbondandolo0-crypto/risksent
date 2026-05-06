/**
 * MetaApi account lifecycle: deploy / undeploy / touch for inactivity-based cost reduction.
 * Accounts inactive for 48h are undeployed by cron; on next dashboard load they are
 * redeployed automatically.
 */

import { normalizeMetaApiToken } from "@/lib/metaapiTokenNormalize";
import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_PROVISIONING_BASE =
  "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";

function provisioningBase(): string {
  const raw = process.env.METAAPI_PROVISIONING_URL?.trim() || DEFAULT_PROVISIONING_BASE;
  return raw.replace(/\/$/, "");
}

function getToken(): string | null {
  return normalizeMetaApiToken(process.env.METAAPI_TOKEN) || null;
}

export async function deployMetaApiAccount(accountId: string): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  const id = String(accountId ?? "").trim();
  if (!id) return false;
  const base = provisioningBase();
  try {
    const res = await fetch(
      `${base}/users/current/accounts/${encodeURIComponent(id)}/deploy`,
      {
        method: "POST",
        headers: { Accept: "application/json", "auth-token": token },
        cache: "no-store"
      }
    );
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

export async function undeployMetaApiAccount(accountId: string): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  const id = String(accountId ?? "").trim();
  if (!id) return false;
  const base = provisioningBase();
  try {
    const res = await fetch(
      `${base}/users/current/accounts/${encodeURIComponent(id)}/undeploy`,
      {
        method: "POST",
        headers: { Accept: "application/json", "auth-token": token },
        cache: "no-store"
      }
    );
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

/**
 * Update last_active_at for all trading accounts belonging to this user.
 * Fire-and-forget — never awaited on the hot path.
 */
export async function touchUserAccounts(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await supabase
    .from("trading_account")
    .update({ last_active_at: new Date().toISOString() })
    .eq("user_id", userId)
    .not("metaapi_account_id", "is", null);
}

/**
 * Check if the given metaapi account is undeployed; if so, trigger redeploy.
 * Returns { reconnecting: true } when redeployment was triggered or is in progress.
 */
export async function ensureAccountDeployed(
  supabase: SupabaseClient,
  userId: string,
  metaapiAccountId: string
): Promise<{ reconnecting: boolean }> {
  const { data: row } = await supabase
    .from("trading_account")
    .select("metaapi_status")
    .eq("user_id", userId)
    .eq("metaapi_account_id", metaapiAccountId)
    .maybeSingle();

  const status = (row as { metaapi_status?: string | null } | null)?.metaapi_status ?? null;

  if (status === "undeployed") {
    const ok = await deployMetaApiAccount(metaapiAccountId);
    if (ok) {
      await supabase
        .from("trading_account")
        .update({ metaapi_status: "reconnecting" })
        .eq("metaapi_account_id", metaapiAccountId)
        .eq("user_id", userId);
    }
    return { reconnecting: true };
  }

  if (status === "reconnecting") {
    return { reconnecting: true };
  }

  return { reconnecting: false };
}

/**
 * Mark account as connected after a successful MetaApi data fetch.
 * Fire-and-forget.
 */
export async function markAccountConnected(
  supabase: SupabaseClient,
  userId: string,
  metaapiAccountId: string
): Promise<void> {
  await supabase
    .from("trading_account")
    .update({ metaapi_status: "connected" })
    .eq("user_id", userId)
    .eq("metaapi_account_id", metaapiAccountId);
}
