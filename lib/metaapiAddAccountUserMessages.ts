/** Short UI copy for MetaApi add-account flows (provisioning + post-provision verify). */
export const META_USER_INVALID_BROKER_SERVER = "Invalid Broker Server";
export const META_USER_INVALID_ACCOUNT_NUMBER = "Invalid Account Number";
export const META_USER_INVALID_PASSWORD = "Invalid Password";
export const META_USER_INVALID_CREDENTIALS = "Invalid Credentials";
/** MetaApi client URL / region or terminal still connecting — not the MT broker name. */
export const META_USER_CONNECTION_PENDING =
  "Could not verify connection yet. Check METAAPI_BASE_URL for your region or try again.";

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Only true MT server / provisioning registry issues (.dat, unknown broker server in MetaApi).
 * Excludes MetaApi *client API region* / timeout text (wrong METAAPI_BASE_URL), which is not "wrong broker server".
 */
export function isMetaApiBrokerServerErrorMessage(raw: string): boolean {
  const s = norm(raw);
  if (!s) return false;
  if (/does not match the account region|api-access\/api-urls|not connected to broker yet/i.test(raw)) {
    return false;
  }
  return (
    s.includes(".dat") ||
    s.includes("dat file for server") ||
    s.includes("please check the server name") ||
    s.includes("suggested server names") ||
    (s.includes("provisioning profile") &&
      (s.includes("server") || s.includes("instead") || s.includes("use a"))) ||
    /\binvalid server\b/.test(s) ||
    /\bunknown server\b/.test(s)
  );
}

/** Explicit password rejection (broker or MetaApi). */
export function isMetaApiPasswordErrorMessage(raw: string): boolean {
  const s = norm(raw);
  if (!s) return false;
  return (
    s.includes("wrong password") ||
    s.includes("invalid password") ||
    s.includes("bad password") ||
    s.includes("incorrect password") ||
    s.includes("invalid master password") ||
    s.includes("invalid investor password") ||
    /\bpassword (is |was )?(invalid|wrong|incorrect)/.test(s)
  );
}

/** Likely wrong login / account id (not password-specific). */
export function isMetaApiAccountNumberErrorMessage(raw: string): boolean {
  const s = norm(raw);
  if (!s) return false;
  if (isMetaApiPasswordErrorMessage(raw)) return false;
  return (
    s.includes("unknown login") ||
    s.includes("login not found") ||
    s.includes("invalid login") ||
    (s.includes("account not found") && !s.includes("metaapi")) ||
    s.includes("no trading account") ||
    s.includes("invalid account number")
  );
}

/** Region / client API / still connecting — retry or fix METAAPI_BASE_URL, not broker name. */
export function isMetaApiRegionOrConnectionPendingMessage(raw: string): boolean {
  const s = norm(raw);
  if (!s) return false;
  return (
    /does not match the account region/i.test(raw) ||
    /not connected to broker yet/i.test(raw) ||
    /api-access\/api-urls/i.test(raw) ||
    (s.includes("timeout") && (s.includes("region") || s.includes("504"))) ||
    errorCodeTimeout(raw)
  );
}

function errorCodeTimeout(raw: string): boolean {
  try {
    const j = JSON.parse(raw) as { error?: string };
    return j.error === "TimeoutError";
  } catch {
    return /TimeoutError/i.test(raw);
  }
}

export function isMetaApiAccountAuthErrorMessage(raw: string): boolean {
  const s = norm(raw);
  if (!s) return false;
  return (
    s.includes("failed to authenticate") ||
    s.includes("invalid account") ||
    s.includes("account disabled") ||
    s.includes("authentication failed") ||
    s.includes("authorization failed") ||
    s.includes("not authorized") ||
    s.includes("invalid credentials") ||
    s.includes("access denied") ||
    s.includes("login failed") ||
    s.includes("auth failed") ||
    s.includes("excessive occurrence") ||
    s.includes("error on the trading terminal") ||
    s.includes("please check that your trading account")
  );
}

export function mapMetaApiErrorToAddAccountMessage(raw: string): string {
  if (!raw.trim()) return META_USER_INVALID_CREDENTIALS;
  if (isMetaApiRegionOrConnectionPendingMessage(raw)) return META_USER_CONNECTION_PENDING;
  if (isMetaApiBrokerServerErrorMessage(raw)) return META_USER_INVALID_BROKER_SERVER;
  if (isMetaApiPasswordErrorMessage(raw)) return META_USER_INVALID_PASSWORD;
  if (isMetaApiAccountNumberErrorMessage(raw)) return META_USER_INVALID_ACCOUNT_NUMBER;
  if (isMetaApiAccountAuthErrorMessage(raw)) return META_USER_INVALID_CREDENTIALS;
  if (norm(raw) === "timeout") return META_USER_CONNECTION_PENDING;
  return META_USER_INVALID_CREDENTIALS;
}
