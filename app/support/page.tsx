import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  LifeBuoy,
  Mail,
  MessageCircle,
  Sparkles,
  FlaskConical,
  Shield,
  CreditCard,
  Lock,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Support & Help Center",
  description:
    "Get help with RiskSent: contact support, browse FAQ, read guides, and check system status.",
  alternates: { canonical: "https://risksent.com/support" },
};

const CHANNELS = [
  {
    icon: Mail,
    title: "Email support",
    desc: "The fastest way to get an answer. We reply within one business day.",
    cta: "support@risksent.com",
    href: "mailto:support@risksent.com",
    external: true,
  },
  {
    icon: MessageCircle,
    title: "In-app chat",
    desc: "Logged-in users can ping us directly from the help bubble in the top-right.",
    cta: "Open the app",
    href: "/app/dashboard",
  },
  {
    icon: LifeBuoy,
    title: "System status",
    desc: "Check live incidents, scheduled maintenance and uptime history.",
    cta: "status.risksent.com",
    href: "https://status.risksent.com",
    external: true,
  },
  {
    icon: BookOpen,
    title: "Changelog",
    desc: "Every shipped improvement, fix and new feature. Subscribe for updates.",
    cta: "View changelog",
    href: "/changelog",
  },
];

const TOPICS = [
  {
    icon: FlaskConical,
    title: "Backtesting",
    href: "/backtest",
    desc: "Import candles, define entries & exits, run fast sims and validate edges.",
  },
  {
    icon: BookOpen,
    title: "Journaling",
    href: "/journaling",
    desc: "Auto-import trades, tag setups, review screenshots and emotions.",
  },
  {
    icon: Shield,
    title: "Risk manager",
    href: "/risk-manager",
    desc: "Drawdown caps, daily loss limits, prop-firm rules and live alerts.",
  },
  {
    icon: Sparkles,
    title: "AI Coach",
    href: "/ai-coach",
    desc: "Personalised feedback, weekly reviews and actionable next steps.",
  },
  {
    icon: CreditCard,
    title: "Billing",
    href: "/app/billing",
    desc: "Plans, invoices, cancellations, upgrades and tax information.",
  },
  {
    icon: Lock,
    title: "Security & account",
    href: "/change-password",
    desc: "Passwords, 2FA, session devices and data export/delete requests.",
  },
];

const FAQ = [
  {
    q: "Do you offer a free trial?",
    a: "Yes. All plans come with a 14-day free trial — no card required. You can cancel any time before it ends and you will not be charged.",
  },
  {
    q: "Is RiskSent a broker or a signal provider?",
    a: "No. RiskSent is a software platform for backtesting, journaling and risk management. We do not execute orders, custody funds or send trading signals.",
  },
  {
    q: "Which brokers and data feeds do you support?",
    a: "MetaTrader 4 and 5 accounts via MetaApi, plus manual trade import via CSV and our API. More integrations are rolling out — see the changelog.",
  },
  {
    q: "Can I use RiskSent for prop-firm accounts (FTMO, MyForexFunds, etc.)?",
    a: "Yes. You can configure your prop-firm rules in the Risk Manager (max daily loss, max drawdown, news restrictions) and receive Telegram alerts when you approach a limit.",
  },
  {
    q: "Where is my data stored?",
    a: "Primarily in EU-region data centers via our hosting and database providers. Some sub-processors may be located outside the EU — see our Privacy Policy for details and safeguards.",
  },
  {
    q: "Can I cancel my subscription at any time?",
    a: "Yes, from /app/billing. Cancellation takes effect at the end of the current billing period; no partial refunds for unused days (unless required by law).",
  },
  {
    q: "How do I delete my account and data?",
    a: "Go to your profile settings and click Delete account, or email support@risksent.com. Your trading content is erased within 30 days; billing records are kept as required by law.",
  },
];

export default function SupportPage() {
  return (
    <div
      className="relative w-full"
      style={{
        background:
          "radial-gradient(1200px 500px at 50% -10%, rgba(255,60,60,0.08), transparent 60%), #080809",
      }}
    >
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-16 lg:px-8">
        {/* Header */}
        <header className="mb-12">
          <p className="mb-3 text-[11px] font-mono uppercase tracking-[0.18em] text-[#ff8c00]">
            Help center
          </p>
          <h1
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            How can we help?
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Get unblocked fast — browse common topics, check the FAQ, or talk
            to us directly. We aim for a reply within one business day.
          </p>
        </header>

        {/* Channels */}
        <section className="mb-16 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CHANNELS.map(({ icon: Icon, title, desc, cta, href, external }) => (
            <Link
              key={title}
              href={href}
              target={external && !href.startsWith("mailto:") ? "_blank" : undefined}
              rel={external && !href.startsWith("mailto:") ? "noopener noreferrer" : undefined}
              className="group relative flex h-full flex-col rounded-2xl border p-5 transition-all hover:-translate-y-0.5"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border"
                style={{
                  borderColor: "rgba(255,60,60,0.3)",
                  background:
                    "linear-gradient(135deg, rgba(255,60,60,0.1), rgba(255,140,0,0.08))",
                }}
              >
                <Icon className="h-5 w-5 text-[#ff8c00]" />
              </div>
              <h3
                className="text-lg font-bold tracking-tight text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {title}
              </h3>
              <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-slate-400">
                {desc}
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[13px] font-mono text-slate-300 transition-colors group-hover:text-white">
                {cta}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </section>

        {/* Topics */}
        <section className="mb-16">
          <h2
            className="mb-6 text-2xl font-bold tracking-tight text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Browse by topic
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map(({ icon: Icon, title, href, desc }) => (
              <Link
                key={title}
                href={href}
                className="group flex items-start gap-4 rounded-2xl border p-5 transition-all hover:-translate-y-0.5"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: "rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <Icon className="h-5 w-5 text-slate-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-semibold text-white">
                    {title}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-400">
                    {desc}
                  </p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-slate-300" />
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mb-16 scroll-mt-24">
          <h2
            className="mb-6 text-2xl font-bold tracking-tight text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {FAQ.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-2xl border px-5 py-4 transition-colors open:bg-white/[0.02]"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[15px] font-semibold text-white">
                  <span>{q}</span>
                  <span
                    className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs text-slate-400 transition-transform group-open:rotate-45"
                    style={{ borderColor: "rgba(255,255,255,0.1)" }}
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[14px] leading-relaxed text-slate-400">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section>
          <div
            className="flex flex-col items-start justify-between gap-5 rounded-3xl border p-8 sm:flex-row sm:items-center sm:gap-8"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              background:
                "linear-gradient(135deg, rgba(255,60,60,0.06), rgba(255,140,0,0.04))",
            }}
          >
            <div className="min-w-0">
              <h2
                className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Still stuck? Let’s talk.
              </h2>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-slate-400">
                Send us a message describing what you’re trying to do and
                we’ll get back to you — usually within a few hours on
                business days.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl px-6 py-3 text-[14px] font-semibold text-white transition-all hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, #ff3c3c, #ff8c00)",
                boxShadow: "0 10px 30px -12px rgba(255,60,60,0.6)",
              }}
            >
              Contact us
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
