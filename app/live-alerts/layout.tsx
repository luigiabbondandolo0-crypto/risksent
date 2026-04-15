import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Alerts",
  description:
    "Instant Telegram notifications when your trading rules are breached. One alert. One decision. Sub-second latency — never miss a critical moment again.",
  alternates: { canonical: "https://risksent.com/live-alerts" },
  openGraph: {
    title: "Live Alerts – RiskSent",
    description: "One alert. One decision. Telegram notifications at the exact moment rules are hit.",
    url: "https://risksent.com/live-alerts",
  },
};

export default function LiveAlertsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
