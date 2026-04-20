import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Mission",
  description:
    "Why we built RiskSent — make discipline inevitable. The platform for traders who are tired of living in spreadsheets.",
  alternates: { canonical: "https://risksent.com/mission" },
  openGraph: {
    title: "Make discipline inevitable — RiskSent",
    description:
      "We’re building the trading platform we wish existed when we were getting wiped out by our own decisions.",
    url: "https://risksent.com/mission",
    type: "website",
  },
};

export default function MissionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
