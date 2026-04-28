import { readServerCookieConsent } from "@/lib/cookieConsent";

/**
 * Server Component — injects Plausible analytics script only when the user
 * has accepted analytics cookies. Loaded on every page via the root layout.
 */
export async function AnalyticsScripts() {
  const consent = await readServerCookieConsent();
  if (!consent.analytics) return null;

  return (
    <>
      <script async src="https://plausible.io/js/pa-oX9WZUGUqZuP1MVHLh6zv.js" />
      <script
        dangerouslySetInnerHTML={{
          __html:
            "window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()",
        }}
      />
    </>
  );
}
