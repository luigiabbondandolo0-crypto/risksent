import type { Metadata } from "next";
import { LegalPageShell } from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How RiskSent collects, uses and protects your personal data, including GDPR rights for EU/EEA users.",
  alternates: { canonical: "https://risksent.com/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      subtitle="How we collect, use, share and protect your personal data when you use the RiskSent platform."
      lastUpdated="April 20, 2026"
    >
      <h2>1. Data controller</h2>
      <p>
        <strong>RiskSent</strong> (the <strong>“Controller”</strong>,{" "}
        <strong>“we”</strong>, <strong>“our”</strong>) is the data controller
        for personal data processed through the RiskSent website, apps and
        services (the <strong>“Platform”</strong>). For any privacy-related
        request you can contact us at{" "}
        <a href="mailto:support@risksent.com">support@risksent.com</a>.
      </p>

      <h2>2. What we collect</h2>
      <p>
        We collect only what we need to operate the Platform and to honour
        the agreement we have with you.
      </p>

      <h3>Account data</h3>
      <ul>
        <li>
          <strong>Identifiers:</strong> name, email, timezone, country,
          preferred language.
        </li>
        <li>
          <strong>Authentication:</strong> hashed password, session tokens and
          OAuth identifiers where applicable.
        </li>
        <li>
          <strong>Profile:</strong> trading style, risk preferences and
          onboarding answers you choose to provide.
        </li>
      </ul>

      <h3>Trading and usage data</h3>
      <ul>
        <li>
          <strong>Content you upload:</strong> strategies, journal entries,
          trades, notes, screenshots, backtest results.
        </li>
        <li>
          <strong>Broker / data connections:</strong> read-only account
          information, trade history and metadata retrieved from third-party
          providers (e.g. MetaApi, MetaTrader accounts) strictly for the
          features you enable.
        </li>
        <li>
          <strong>Alerts and integrations:</strong> Telegram chat IDs, webhook
          URLs and similar identifiers required to send you alerts.
        </li>
      </ul>

      <h3>Technical data</h3>
      <ul>
        <li>
          <strong>Device & network:</strong> IP address, user agent, device
          type, timestamps.
        </li>
        <li>
          <strong>Product analytics:</strong> page views, feature usage, error
          logs and performance metrics to improve reliability.
        </li>
        <li>
          <strong>Cookies:</strong> see our{" "}
          <a href="/cookies">Cookie Policy</a> for details.
        </li>
      </ul>

      <h3>Billing data</h3>
      <ul>
        <li>
          Plan, billing address, VAT ID (where applicable), invoices. Full
          card numbers are handled only by our PCI-compliant payment
          processor — we never store them.
        </li>
      </ul>

      <h2>3. How we use your data and legal bases (GDPR)</h2>
      <ul>
        <li>
          <strong>Provide the Platform</strong> (contractual necessity, art.
          6.1.b GDPR) — accounts, authentication, trade import, backtesting,
          journaling, risk monitoring, alerts.
        </li>
        <li>
          <strong>Billing & tax</strong> (legal obligation, art. 6.1.c GDPR) —
          issue invoices, keep accounting records.
        </li>
        <li>
          <strong>Security & abuse prevention</strong> (legitimate interest,
          art. 6.1.f GDPR) — rate-limiting, fraud detection, audit logs.
        </li>
        <li>
          <strong>Product improvement & analytics</strong> (legitimate
          interest) — aggregated metrics, bug reports, limited A/B testing.
          You can opt out of non-essential analytics at any time from{" "}
          <code>/cookies</code>.
        </li>
        <li>
          <strong>Transactional emails</strong> (contractual necessity) —
          trial status, billing, security notices.
        </li>
        <li>
          <strong>Marketing emails</strong> (consent, art. 6.1.a GDPR) — only
          if you opt in; you can unsubscribe from any marketing email.
        </li>
      </ul>

      <h2>4. Who we share data with</h2>
      <p>
        We do not sell your personal data. We share it only with carefully
        selected <strong>processors</strong> acting on our instructions:
      </p>
      <ul>
        <li>
          <strong>Cloud hosting & database</strong> (e.g. Supabase, Vercel,
          AWS) for running the Platform.
        </li>
        <li>
          <strong>Payment processor</strong> (e.g. Stripe) for billing.
        </li>
        <li>
          <strong>Email provider</strong> for transactional and — with
          consent — marketing emails.
        </li>
        <li>
          <strong>Analytics & error monitoring</strong> (e.g. Sentry) for
          performance and debugging.
        </li>
        <li>
          <strong>AI provider</strong> (e.g. OpenAI / Anthropic) for the AI
          Coach feature — prompts are sent to process your request and are
          not used to train third-party models under our agreements.
        </li>
        <li>
          <strong>Broker / data APIs</strong> (e.g. MetaApi) when you
          explicitly connect an account.
        </li>
        <li>
          <strong>Messaging</strong> (e.g. Telegram) when you enable live
          alerts.
        </li>
      </ul>
      <p>
        The full list of sub-processors is available on request at{" "}
        <a href="mailto:support@risksent.com">support@risksent.com</a>.
      </p>

      <h2>5. International transfers</h2>
      <p>
        Some of our providers are located outside the EU/EEA. In that case,
        we rely on the European Commission’s{" "}
        <strong>Standard Contractual Clauses (SCC)</strong> and, where
        required, supplementary technical measures to protect your data.
      </p>

      <h2>6. How long we keep your data</h2>
      <ul>
        <li>
          <strong>Account data:</strong> while your account is active. After
          deletion we keep minimal data for up to 30 days for backup
          rotation, then erase it.
        </li>
        <li>
          <strong>Trading content:</strong> deleted with the account (or on
          request) unless needed for legal defense.
        </li>
        <li>
          <strong>Billing records:</strong> kept for up to 10 years as
          required by Italian/EU tax law.
        </li>
        <li>
          <strong>Security logs:</strong> up to 12 months.
        </li>
      </ul>

      <h2>7. Your rights</h2>
      <p>
        Under the GDPR and similar laws, you have the right to:
      </p>
      <ul>
        <li>access the data we hold about you and receive a copy;</li>
        <li>rectify inaccurate data or complete incomplete data;</li>
        <li>
          erase your data (“right to be forgotten”) where conditions are met;
        </li>
        <li>restrict or object to certain processing;</li>
        <li>
          data portability — receive your data in a structured, machine-
          readable format;
        </li>
        <li>
          withdraw consent at any time, without affecting the lawfulness of
          prior processing;
        </li>
        <li>
          lodge a complaint with your local supervisory authority (in Italy:{" "}
          <em>Garante per la protezione dei dati personali</em>,{" "}
          <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">
            garanteprivacy.it
          </a>
          ).
        </li>
      </ul>
      <p>
        To exercise any right, email{" "}
        <a href="mailto:support@risksent.com">support@risksent.com</a>. We
        respond within 30 days.
      </p>

      <h2>8. Security</h2>
      <p>
        We apply appropriate technical and organisational measures — TLS
        everywhere, encryption at rest for sensitive fields, least-privilege
        access, 2FA for employees, audit logging, rate-limiting and regular
        backups — to protect your data. No system is 100% secure; in the
        event of a personal data breach affecting your rights, we will
        notify you and the competent authority as required by law.
      </p>

      <h2>9. Children</h2>
      <p>
        RiskSent is not directed to children under 18 and we do not
        knowingly collect personal data from children. If you believe a
        child has provided us data, contact us and we will delete it.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        When we change this policy we will update the “Last updated” date
        and, for material changes, notify you by email or via an in-app
        banner before the change takes effect.
      </p>

      <h2>11. Contact</h2>
      <p>
        Privacy questions, GDPR requests or suspected breaches:{" "}
        <a href="mailto:support@risksent.com">support@risksent.com</a>.
      </p>
    </LegalPageShell>
  );
}
