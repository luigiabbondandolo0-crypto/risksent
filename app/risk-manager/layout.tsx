import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Risk Manager",
  description:
    "Real-time risk monitoring with hard-block protection. The moment you're about to breach a rule, RiskSent stops you. Never blow an account again.",
  alternates: { canonical: "https://risksent.com/risk-manager" },
  openGraph: {
    title: "Risk Manager – RiskSent",
    description: "Hard blocks. Live monitoring. Zero excuses. Never blow an account again.",
    url: "https://risksent.com/risk-manager",
  },
};

export default function RiskManagerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
