import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

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
          <header className="border-b border-border/60 bg-black/40 backdrop-blur-sm">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center text-xs font-semibold text-emerald-300">
                  RS
                </div>
                <span className="text-sm font-semibold tracking-wide text-slate-100">
                  RiskSent
                </span>
              </div>
              <span className="text-xs text-slate-500">
                Trading risk dashboard (mock MVP)
              </span>
            </div>
          </header>
          <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
            <div className="grid gap-6 md:grid-cols-[160px,1fr]">
              <nav className="hidden md:flex flex-col text-xs text-slate-500">
                <span className="uppercase tracking-wide text-[10px] text-slate-600 mb-2">
                  Pages
                </span>
                <Link
                  href="/dashboard"
                  className="py-1.5 hover:text-slate-100"
                >
                  Dashboard
                </Link>
                <Link href="/rules" className="py-1.5 hover:text-slate-100">
                  Risk rules
                </Link>
                <Link
                  href="/add-account"
                  className="py-1.5 hover:text-slate-100"
                >
                  Add account
                </Link>
                <Link href="/login" className="py-1.5 hover:text-slate-100">
                  Login
                </Link>
                <Link href="/signup" className="py-1.5 hover:text-slate-100">
                  Signup
                </Link>
              </nav>
              <section>{children}</section>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}

