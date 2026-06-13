import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "One subscription. Backtesting, trading journal, risk manager, live Telegram alerts — everything your edge needs. Start free, no credit card required.",
  alternates: { canonical: "https://risksent.com/pricing" },
  openGraph: {
    title: "Pricing – RiskSent",
    description: "One subscription. Everything included. Start free — no credit card required.",
    url: "https://risksent.com/pricing",
    images: [{ url: "https://risksent.com/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://risksent.com/opengraph-image"],
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What do I get during the trial?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Full Experienced access for 7 days — AI Coach, Risk Manager, unlimited backtesting, everything. No credit card needed.",
      },
    },
    {
      "@type": "Question",
      name: "What happens after the trial?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You choose a paid plan or your account reverts to demo mode with sample data. We'll remind you 2 days before the trial ends.",
      },
    },
    {
      "@type": "Question",
      name: "Can I cancel anytime?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. Cancel in one click. No questions, no penalties.",
      },
    },
    {
      "@type": "Question",
      name: "What's the difference between New Trader and Experienced?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "New Trader gives you the journal, backtesting (2 sessions), and basic alerts. Experienced adds AI Coach, Risk Manager, and removes all limits.",
      },
    },
    {
      "@type": "Question",
      name: "Is my data safe?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "All data is encrypted. We use read-only access to your trading account — we can never place or close trades.",
      },
    },
  ],
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
