"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { getCookieConsent, type CookieConsent } from "@/components/CookieConsent";

/**
 * Respects the cookie-consent choice persisted by <CookieConsentBanner />.
 *
 * - Reads both the localStorage and the first-party `risksent_consent` cookie
 *   (see CookieConsent.tsx) on mount and on every `cookie-consent:change`.
 * - If the user grants analytics consent, loads whichever analytics provider
 *   is configured via env (Plausible → GA4, in that order).
 * - If the user grants marketing consent, loads Meta Pixel if configured.
 * - Nothing is injected server-side: this ensures we never send a request to
 *   a tracking vendor before the user has actually opted-in.
 *
 * Providers are wired via env vars so ops can flip them on without a code
 * change:
 *   NEXT_PUBLIC_PLAUSIBLE_DOMAIN   e.g. "risksent.com"
 *   NEXT_PUBLIC_PLAUSIBLE_SRC      (optional) self-hosted plausible script url
 *   NEXT_PUBLIC_GA_ID              e.g. "G-XXXXXXXXXX"
 *   NEXT_PUBLIC_META_PIXEL_ID      e.g. "1234567890"
 */
export function AnalyticsScripts() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    setConsent(getCookieConsent());
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<CookieConsent>).detail;
      if (detail) setConsent(detail);
      else setConsent(getCookieConsent());
    };
    window.addEventListener("cookie-consent:change", handler);
    return () => window.removeEventListener("cookie-consent:change", handler);
  }, []);

  if (!consent) return null;

  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const plausibleSrc =
    process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || "https://plausible.io/js/script.js";
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <>
      {/* ---------- Analytics (opt-in) ---------- */}
      {consent.analytics && plausibleDomain && (
        <Script
          id="plausible-analytics"
          src={plausibleSrc}
          data-domain={plausibleDomain}
          strategy="afterInteractive"
          defer
        />
      )}

      {consent.analytics && !plausibleDomain && gaId && (
        <>
          <Script
            id="ga4-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', {
                anonymize_ip: true,
                send_page_view: true
              });
            `}
          </Script>
        </>
      )}

      {/* ---------- Marketing (opt-in) ---------- */}
      {consent.marketing && pixelId && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${pixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            <img
              height={1}
              width={1}
              style={{ display: "none" }}
              alt=""
              src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      )}
    </>
  );
}

export default AnalyticsScripts;
