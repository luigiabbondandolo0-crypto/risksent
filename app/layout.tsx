import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono, Syne } from "next/font/google";
import "./globals.css";
import { RootLayoutChrome } from "@/components/RootLayoutChrome";
import { Toaster } from "@/components/ui/toaster";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600", "700", "800", "900"] });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["300", "400", "500"] });
const syne = Syne({ subsets: ["latin"], variable: "--font-brand", weight: ["500", "600", "700", "800"] });

const SITE_URL = "https://risksent.com";
const SITE_NAME = "RiskSent";
const TITLE = "RiskSent – Backtesting, Journaling & Risk Management for Traders";
const DESCRIPTION =
  "All-in-one trading platform: backtest strategies, journal every trade, enforce risk rules with live Telegram alerts. One subscription for disciplined traders.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: `%s | ${SITE_NAME}` },
  description: DESCRIPTION,
  keywords: [
    "trading journal",
    "backtesting",
    "risk management",
    "forex trading",
    "prop firm",
    "FTMO",
    "trading dashboard",
    "live alerts",
    "telegram trading alerts",
    "trading risk",
    "drawdown control",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RiskSent – Trading Risk Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
    creator: "@risksent",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-32x32.png",
    apple: "/apple-icon.png",
  },
  manifest: "/site.webmanifest",
  alternates: { canonical: SITE_URL },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070710",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${outfit.variable} ${jetbrainsMono.variable} ${syne.variable}`}>
      <body
        className={`${outfit.className} flex min-h-screen flex-col bg-background text-slate-100 antialiased`}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <RootLayoutChrome>{children}</RootLayoutChrome>
        </div>
        <Toaster />
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://risksent.com/#org",
                  name: "RiskSent",
                  url: "https://risksent.com",
                  description: DESCRIPTION,
                  logo: { "@type": "ImageObject", url: "https://risksent.com/apple-icon.png" },
                },
                {
                  "@type": "WebSite",
                  "@id": "https://risksent.com/#website",
                  url: "https://risksent.com",
                  name: "RiskSent",
                  publisher: { "@id": "https://risksent.com/#org" },
                  potentialAction: {
                    "@type": "SearchAction",
                    target: "https://risksent.com/?q={search_term_string}",
                    "query-input": "required name=search_term_string",
                  },
                },
                {
                  "@type": "SoftwareApplication",
                  name: "RiskSent",
                  applicationCategory: "FinanceApplication",
                  operatingSystem: "Web",
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                    description: "7-day free trial available (one per account, no card required)",
                  },
                  description: DESCRIPTION,
                  url: "https://risksent.com",
                },
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}
