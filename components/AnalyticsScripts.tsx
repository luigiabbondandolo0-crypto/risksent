import { readServerCookieConsent } from "@/lib/cookieConsent";

/**
 * Server Component — injects Plausible analytics script only when the user
 * has accepted analytics cookies. Loaded on every page via the root layout.
 *
 * Set NEXT_PUBLIC_PLAUSIBLE_DOMAIN in env (defaults to "risksent.com").
 * Plausible is cookieless; the consent gate is kept for GDPR completeness.
 */
export async function AnalyticsScripts() {
  const consent = await readServerCookieConsent();
  if (!consent.analytics) return null;

  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? "risksent.com";

  return (
    <script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
    />
  );
}
