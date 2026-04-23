import { fetchMetaApiAccountInformation } from "@/lib/tradingApi";

/** Shown when login/server/password fail validation or the terminal never returns account info. */
export const METAAPI_INVALID_ACCOUNT_MESSAGE = "Invalid Credentials/Account";

const INVALID_HINTS =
  /invalid|password|credential|authentication|unauthori|login failed|access denied|wrong password|bad password|auth failed|not authorized|invalid account|invalid login|authorization failed|access rights|disconnected|rejected/i;

function looksLikeInvalidCredentials(message: string): boolean {
  const m = message.trim();
  if (!m) return false;
  return INVALID_HINTS.test(m);
}

export type VerifyProvisionedResult =
  | { ok: true; info: Record<string, unknown> }
  | { ok: false; error: string };

/**
 * Poll MetaApi account-information until we get finite balance/equity (broker connected),
 * or fail with auth-like errors / timeout. Used after provisioning to avoid keeping dead accounts.
 */
export async function verifyProvisionedMetaApiAccount(
  accountId: string,
  options?: { maxAttempts?: number; delayMs?: number }
): Promise<VerifyProvisionedResult> {
  const maxAttempts = options?.maxAttempts ?? 14;
  const delayMs = options?.delayMs ?? 3500;
  let lastError = "";

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetchMetaApiAccountInformation(accountId);
    if (res.ok && res.info) {
      const balance = Number(res.info.balance);
      const equity = Number(res.info.equity);
      if (Number.isFinite(balance) && Number.isFinite(equity)) {
        return { ok: true, info: res.info };
      }
    }
    lastError = res.error ?? "";
    if (looksLikeInvalidCredentials(lastError)) {
      return { ok: false, error: lastError };
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return { ok: false, error: lastError || "timeout" };
}
