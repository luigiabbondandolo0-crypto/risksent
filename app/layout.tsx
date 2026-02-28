import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Topbar } from "@/components/Topbar";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RiskSent – Trading Risk Dashboard",
  description: "Ultra-clean dark fintech dashboard for MT4/MT5 traders."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-background text-slate-100 min-h-screen`}
      >
        <div className="min-h-screen flex flex-col">
          <Topbar />
          <div className="flex flex-1 w-full">
            <Sidebar />
            <main className="flex-1 w-full min-w-0 px-6 py-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
