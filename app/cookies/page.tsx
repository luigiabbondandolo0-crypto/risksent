import type { Metadata } from "next";
import { LegalPageShell } from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "How RiskSent uses cookies and similar technologies, and how you can control them.",
  alternates: { canonical: "https://risksent.com/cookies" },
};

export default function CookiesPage() {
  return (
    <LegalPageShell
      title="Cookie Policy"
      subtitle="What cookies and similar technologies we use, why, and how you can control them."
      lastUpdated="April 20, 2026"
    >
      <h2>1. What cookies are</h2>
      <p>
        Cookies are small text files stored on your device when you visit a
        website. They are used to remember your preferences, keep you logged
        in, and understand how the site is used. Similar technologies
        (localStorage, sessionStorage, pixels, SDKs) work in comparable ways
        — we refer to all of them as <strong>“cookies”</strong> in this
        policy for simplicity.
      </p>

      <h2>2. Categories we use</h2>

      <h3>Strictly necessary</h3>
      <p>
        Required for the Platform to function. These cannot be disabled via
        our cookie settings because without them the Platform would not work
        (for example, you could not stay logged in).
      </p>
      <ul>
        <li>
          <strong>Authentication</strong> — session token for{" "}
          <code>/app</code>.
        </li>
        <li>
          <strong>Security</strong> — CSRF protection, rate-limiting.
        </li>
        <li>
          <strong>Preferences</strong> — theme, sidebar state, locale.
        </li>
      </ul>

      <h3>Analytics (optional)</h3>
      <p>
        Help us understand which features you use and where things break, in
        an aggregated way. Set only with your consent.
      </p>
      <ul>
        <li>Page views, clicks, performance metrics.</li>
        <li>Error monitoring (Sentry).</li>
      </ul>

      <h3>Marketing (optional)</h3>
      <p>
        Used on the public website to measure campaign performance and show
        relevant RiskSent content on other platforms. Set only with your
        consent.
      </p>

      <h2>3. Managing your preferences</h2>
      <p>
        You can accept or reject non-essential cookies from our cookie banner
        when you first visit the site. You can change your choice at any time
        by clicking <strong>Cookie preferences</strong> at the bottom of any
        page, which re-opens the consent panel. Most browsers also let you
        block or delete cookies from their settings — consult your browser
        documentation for details.
      </p>
      <p>
        Please note that disabling strictly necessary cookies will break
        features like login and saved preferences.
      </p>

      <h2>4. Third parties</h2>
      <p>
        Some cookies are set by our trusted partners (payment processor,
        analytics provider, CDN). Those partners act as processors on our
        behalf and follow their own privacy notices.
      </p>

      <h2>5. Changes</h2>
      <p>
        We will update this Cookie Policy when we add or remove cookies. The{" "}
        <strong>Last updated</strong> date at the top will reflect the
        change.
      </p>

      <h2>6. Contact</h2>
      <p>
        Questions about cookies? Write to{" "}
        <a href="mailto:support@risksent.com">support@risksent.com</a>.
      </p>
    </LegalPageShell>
  );
}
