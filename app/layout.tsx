import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { RootLayoutChrome } from "@/components/RootLayoutChrome";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600", "700", "800", "900"] });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["300", "400", "500"] });

export const metadata: Metadata = {
  title: "RiskSent – Trading Risk Dashboard",
  description: "Ultra-clean dark fintech dashboard for disciplined traders.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png"
  },
  manifest: "/site.webmanifest"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${outfit.variable} ${jetbrainsMono.variable}`}>
      <body
        className={`${outfit.className} flex min-h-screen flex-col bg-background text-slate-100 antialiased`}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <RootLayoutChrome>{children}</RootLayoutChrome>
        </div>
      </body>
    </html>
  );
}