import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trading Journal",
  description:
    "Log every trade, tag setups, and uncover your behavioral patterns. Turn losses into lessons — automatically. The trading journal built for serious traders.",
  alternates: { canonical: "https://risksent.com/journaling" },
  openGraph: {
    title: "Trading Journal – RiskSent",
    description: "Every trade. Every lesson. Turn your history into an edge.",
    url: "https://risksent.com/journaling",
  },
};

export default function JournalingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
