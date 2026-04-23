/** Short UI copy for MetaApi add-account flows (provisioning + post-provision verify). */
export const META_USER_INVALID_BROKER_SERVER = "Invalid Broker Server";
export const META_USER_INVALID_ACCOUNT_NUMBER = "Invalid Account Number";

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/** Broker / server / .dat / provisioning profile hints from MetaApi. */
export function isMetaApiBrokerServerErrorMessage(raw: string): boolean {
  const s = norm(raw);
  if (!s) return false;
  return (
    s.includes(".dat") ||
    s.includes("dat file") ||
    (s.includes("server") && (s.includes("not found") || s.includes("check the server"))) ||
    s.includes("please check the server name") ||
    s.includes("suggested server names") ||
    s.includes("provisioning profile") ||
    s.includes("invalid server") ||
    s.includes("unknown server") ||
    s.includes("host not found") ||
    s.includes("could not resolve") ||
    /does not match the account region/.test(s)
  );
}

/** Login / password / account disabled / auth failures. */
export function isMetaApiAccountAuthErrorMessage(raw: string): boolean {
  const s = norm(raw);
  if (!s) return false;
  return (
    s.includes("failed to authenticate") ||
    s.includes("invalid account") ||
    s.includes("account disabled") ||
    s.includes("invalid login") ||
    s.includes("wrong password") ||
    s.includes("invalid password") ||
    s.includes("authentication failed") ||
    s.includes("authorization failed") ||
    s.includes("not authorized") ||
    s.includes("invalid credentials") ||
    s.includes("access denied") ||
    s.includes("login failed") ||
    s.includes("bad password") ||
    s.includes("auth failed") ||
    s.includes("excessive occurrence") ||
    s.includes("error on the trading terminal") ||
    s.includes("please check that your trading account")
  );
}

export function mapMetaApiErrorToAddAccountMessage(raw: string): string {
  if (isMetaApiBrokerServerErrorMessage(raw)) return META_USER_INVALID_BROKER_SERVER;
  if (isMetaApiAccountAuthErrorMessage(raw)) return META_USER_INVALID_ACCOUNT_NUMBER;
  return META_USER_INVALID_ACCOUNT_NUMBER;
}
