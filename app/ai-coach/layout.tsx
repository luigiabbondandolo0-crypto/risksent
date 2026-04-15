import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Coach",
  description:
    "Your unfair advantage. AI trained on elite trading psychology that knows your journal, backtests, and risk patterns. Pattern detection, setup scoring, session insights.",
  alternates: { canonical: "https://risksent.com/ai-coach" },
  openGraph: {
    title: "AI Coach – RiskSent",
    description: "AI that knows your edge better than you do.",
    url: "https://risksent.com/ai-coach",
  },
};

export default function AiCoachLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
