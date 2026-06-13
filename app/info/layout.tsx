import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Info",
  description:
    "Legal, company, and support pages for RiskSent — Terms of Service, Privacy Policy, Risk Disclosure, Mission, Help Center, and more.",
  alternates: { canonical: "https://risksent.com/info" },
  openGraph: {
    title: "Info – RiskSent",
    description: "Terms, Privacy, Risk Disclosure, Mission, Help & more — all in one place.",
    url: "https://risksent.com/info",
    images: [{ url: "https://risksent.com/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://risksent.com/opengraph-image"],
  },
};

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
