import type { Metadata } from "next";
import { LegalPageShell } from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for RiskSent — the all-in-one trading platform for backtesting, journaling and risk management.",
  alternates: { canonical: "https://risksent.com/terms" },
};

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Terms of Service"
      subtitle="These terms govern your access to and use of the RiskSent platform, website and related services."
      lastUpdated="April 20, 2026"
    >
      <h2>1. Agreement</h2>
      <p>
        These Terms of Service (the <strong>“Terms”</strong>) form a binding
        agreement between you and <strong>RiskSent</strong> (the{" "}
        <strong>“Service”</strong>, <strong>“we”</strong>,{" "}
        <strong>“our”</strong>), covering your access to and use of the
        RiskSent website, applications, APIs and related services
        (collectively, the <strong>“Platform”</strong>). By creating an
        account, starting a trial or using the Platform in any way, you agree
        to be bound by these Terms. If you do not agree, do not use the
        Platform.
      </p>

      <h2>2. Who can use RiskSent</h2>
      <p>You may use the Platform only if you:</p>
      <ul>
        <li>are at least 18 years old and legally able to enter a contract;</li>
        <li>
          are not barred from using financial software or services under the
          laws of your jurisdiction;
        </li>
        <li>
          provide accurate registration information and keep it up to date;
        </li>
        <li>
          use the Platform in compliance with these Terms and all applicable
          laws.
        </li>
      </ul>

      <h2>3. Accounts and security</h2>
      <p>
        You are responsible for maintaining the confidentiality of your
        credentials, API keys and any third-party integrations (for example
        Telegram, brokers or data providers) connected to your account. You
        agree to notify us immediately at{" "}
        <a href="mailto:support@risksent.com">support@risksent.com</a> of any
        unauthorized access. We are not liable for losses resulting from
        credentials you disclose or fail to protect.
      </p>

      <h2>4. Subscriptions, trial and billing</h2>
      <p>
        Access to the Platform is sold as a subscription. You may be offered a
        free trial; at the end of the trial, your subscription automatically
        continues at the then-current price unless cancelled beforehand.
      </p>
      <ul>
        <li>
          <strong>Billing.</strong> Subscriptions renew automatically on a
          monthly or annual cycle. Payments are processed by our payment
          processor; we never store your full card details.
        </li>
        <li>
          <strong>Cancellation.</strong> You can cancel at any time from your{" "}
          <code>/app/billing</code> page. Cancellation takes effect at the end
          of the current billing period.
        </li>
        <li>
          <strong>Refunds.</strong> Except where required by applicable
          consumer protection law (including EU/EEA withdrawal rights where
          they apply), payments are non-refundable once the billing period has
          started.
        </li>
        <li>
          <strong>Price changes.</strong> We may change subscription prices;
          changes apply to the following renewal cycle and will be
          communicated by email.
        </li>
      </ul>

      <h2>5. Acceptable use</h2>
      <p>You agree that you will not:</p>
      <ul>
        <li>
          attempt to reverse-engineer, scrape, overload or disrupt the
          Platform or its API;
        </li>
        <li>
          resell, sublicense or share your account with third parties, or use
          it for another person/entity;
        </li>
        <li>
          upload unlawful, infringing or harmful content, including malware or
          credentials you do not own;
        </li>
        <li>
          use the Platform to provide regulated investment advice, asset
          management or brokerage services to third parties unless you are
          properly licensed to do so;
        </li>
        <li>
          use the Platform in breach of exchange, broker or prop-firm rules
          that apply to you.
        </li>
      </ul>

      <h2>6. No investment advice</h2>
      <p>
        <strong>
          RiskSent is a software tool. It is not a broker, exchange, financial
          advisor or portfolio manager.
        </strong>{" "}
        Backtests, simulations, journal analytics, AI Coach outputs and any
        content produced by the Platform are provided for informational and
        educational purposes only and do not constitute investment, tax or
        legal advice. You are solely responsible for your trading decisions
        and for evaluating whether they suit your personal circumstances.
      </p>

      <h2>7. Third-party services</h2>
      <p>
        The Platform integrates with third parties (brokers, data vendors,
        MetaApi, Telegram, payment processors, AI providers, analytics, etc.).
        Those services are governed by their own terms and privacy notices.
        We are not responsible for outages, data accuracy or changes on the
        side of those providers.
      </p>

      <h2>8. Intellectual property</h2>
      <p>
        The Platform, including its design, code, content and trademarks, is
        owned by RiskSent and/or its licensors and is protected by
        intellectual property laws. We grant you a limited, revocable,
        non-transferable, non-exclusive license to access and use the Platform
        for its intended purpose and under these Terms.
      </p>
      <p>
        You retain ownership of the content you upload (trades, notes,
        strategies, settings — <strong>“Your Content”</strong>). You grant us
        a worldwide, royalty-free license to host, store, process and display
        Your Content solely to operate and improve the Platform.
      </p>

      <h2>9. Beta features</h2>
      <p>
        Some features (including AI Coach, new backtesting modules and
        experimental integrations) may be provided as beta or preview. They
        are offered <strong>“as is”</strong>, may change, degrade or be
        removed at any time, and are not covered by any SLA.
      </p>

      <h2>10. Disclaimers</h2>
      <p>
        To the maximum extent permitted by law, the Platform is provided{" "}
        <strong>“as is” and “as available”</strong>, without warranties of
        any kind, express or implied, including fitness for a particular
        purpose, merchantability, accuracy, uninterrupted availability, or
        non-infringement. We do not warrant that trading signals, backtests,
        computed metrics or AI outputs will be accurate, complete or
        profitable.
      </p>

      <h2>11. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, in no event will RiskSent,
        its officers, employees or suppliers be liable for any indirect,
        incidental, special, consequential or punitive damages, including
        loss of profits, trading losses, loss of data or loss of goodwill,
        arising out of or related to your use of the Platform. Our aggregate
        liability for any claim shall not exceed the amount you paid us for
        the Platform in the twelve (12) months preceding the event giving
        rise to the claim.
      </p>

      <h2>12. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless RiskSent from any claims,
        damages, liabilities and expenses (including reasonable legal fees)
        arising from your use of the Platform, your content, or your breach
        of these Terms.
      </p>

      <h2>13. Suspension and termination</h2>
      <p>
        We may suspend or terminate your account if you breach these Terms,
        if required by law, or to protect the Platform and its users. You may
        terminate your account at any time by cancelling your subscription
        and deleting your account from the profile settings. Sections that by
        their nature should survive termination will continue to apply
        (including sections 6, 8, 10, 11, 12 and 15).
      </p>

      <h2>14. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will be
        notified by email or via an in-app banner at least 14 days before
        taking effect. Continued use of the Platform after the effective date
        means you accept the updated Terms.
      </p>

      <h2>15. Governing law and disputes</h2>
      <p>
        These Terms are governed by the laws of Italy, without regard to its
        conflict-of-laws rules. The courts of Italy will have exclusive
        jurisdiction over any dispute, subject to any mandatory consumer
        protection rules that grant you the right to bring claims in the
        courts of your country of residence.
      </p>

      <h2>16. Contact</h2>
      <p>
        Questions about these Terms can be sent to{" "}
        <a href="mailto:support@risksent.com">support@risksent.com</a>.
      </p>
    </LegalPageShell>
  );
}
