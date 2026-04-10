import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Syne } from "next/font/google";
import "./globals.css";
import { RootLayoutChrome } from "@/components/RootLayoutChrome";

const inter = Inter({ subsets: ["latin"] });
const syne = Syne({ subsets: ["latin"], variable: "--font-display", weight: ["400", "600", "700", "800"] });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["300", "400", "500"] });

export const metadata: Metadata = {
  title: "RiskSent – Trading Risk Dashboard",
  description: "Ultra-clean dark fintech dashboard for MT4/MT5 traders.",
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
    <html lang="en" className="dark">
      <body
        className={`${inter.className} ${syne.variable} ${jetbrainsMono.variable} min-h-screen bg-background text-slate-100 antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <RootLayoutChrome>{children}</RootLayoutChrome>
        </div>
      </body>
    </html>
  );
}