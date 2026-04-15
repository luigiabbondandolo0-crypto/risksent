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
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
