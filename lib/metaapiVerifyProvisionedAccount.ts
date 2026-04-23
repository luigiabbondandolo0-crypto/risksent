import { fetchMetaApiAccountInformation } from "@/lib/tradingApi";

const INVALID_HINTS =
  /invalid|password|credential|authentication|unauthori|login failed|access denied|wrong password|bad password|auth failed|not authorized|invalid account|invalid login|authorization failed|access rights|disconnected|rejected/i;

function looksLikeInvalidCredentials(message: string): boolean {
  const m = message.trim();
  if (!m) return false;
  return INVALID_HINTS.test(m);
}

/** Shorter waits early (terminal often connects in a few seconds), then backoff. */
function waitMsAfterAttempt(attempt: number): number {
  if (attempt < 2) return 650;
  if (attempt < 4) return 1000;
  if (attempt < 7) return 1400;
  if (attempt < 11) return 1900;
  return 2400;
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
  const maxAttempts = options?.maxAttempts ?? 16;
  /** @deprecated fixed delay; prefer adaptive waits unless explicitly set */
  const fixedDelay = options?.delayMs;
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
      const ms = fixedDelay ?? waitMsAfterAttempt(attempt);
      await new Promise((r) => setTimeout(r, ms));
    }
  }

  return { ok: false, error: lastError || "timeout" };
}
