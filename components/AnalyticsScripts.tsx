/**
 * Plausible Analytics — cookieless, no consent required under GDPR.
 * Loaded unconditionally on every page via the root layout.
 */
export function AnalyticsScripts() {
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
