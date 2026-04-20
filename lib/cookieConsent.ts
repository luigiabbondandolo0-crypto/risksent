import { cookies } from "next/headers";

/**
 * Server-side read of the persisted cookie-consent preference.
 *
 * Mirrors the shape written by `components/CookieConsent.tsx` to the
 * `risksent_consent` first-party cookie. Use this inside Server Components,
 * route handlers or middleware to gate server-rendered tracking snippets.
 *
 * Returns a safe "all rejected" default when no cookie is present, so callers
 * can always assume `necessary: true` and treat missing consent as opt-out
 * for analytics and marketing (GDPR-safe default).
 */

const COOKIE_NAME = "risksent_consent";
const CONSENT_VERSION = 1;

export type ServerCookieConsent = {
  version: number;
  timestamp: string;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  /** True when the user has NOT yet chosen (banner still pending). */
  unset: boolean;
};

const DEFAULT: ServerCookieConsent = {
  version: CONSENT_VERSION,
  timestamp: "",
  necessary: true,
  analytics: false,
  marketing: false,
  unset: true,
};

export async function readServerCookieConsent(): Promise<ServerCookieConsent> {
  try {
    const jar = await cookies();
    const raw = jar.get(COOKIE_NAME)?.value;
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<ServerCookieConsent>;
    if (!parsed || parsed.version !== CONSENT_VERSION) return DEFAULT;
    return {
      version: CONSENT_VERSION,
      timestamp: typeof parsed.timestamp === "string" ? parsed.timestamp : "",
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      unset: false,
    };
  } catch {
    return DEFAULT;
  }
}
