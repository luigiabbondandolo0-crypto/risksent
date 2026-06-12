"use client";

import Link from "next/link";
import { ArrowUpRight, Instagram, Shield } from "lucide-react";
import { openCookiePreferences } from "@/components/CookieConsent";

function XLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export type FooterVariant = "marketing" | "app" | "mock";

type LinkItem = { href: string; label: string; external?: boolean };

const PRODUCT_LINKS: LinkItem[] = [
  { href: "/backtest", label: "Backtesting" },
  { href: "/journaling", label: "Journaling" },
  { href: "/risk-manager", label: "Risk Manager" },
  { href: "/live-alerts", label: "Live Alerts" },
  { href: "/ai-coach", label: "AI Coach" },
  { href: "/pricing", label: "Pricing" },
];

const RESOURCES_LINKS: LinkItem[] = [
  { href: "/support", label: "Help center" },
  { href: "/contact", label: "Contact us" },
  { href: "/changelog", label: "Changelog" },
  { href: "/support#faq", label: "FAQ" },
  { href: "/status", label: "System status" },
];

const COMPANY_LINKS: LinkItem[] = [
  { href: "/mission", label: "Mission" },
  { href: "/pricing", label: "Plans" },
  { href: "/changelog", label: "What’s new" },
  { href: "mailto:support@risksent.com", label: "support@risksent.com", external: true },
];

const LEGAL_LINKS: LinkItem[] = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/risk-disclosure", label: "Risk Disclosure" },
];

function FooterColumn({ title, links, isApp }: { title: string; links: LinkItem[]; isApp?: boolean }) {
  const labelClass = isApp ? "text-slate-400" : "text-slate-500";
  const linkClass = isApp
    ? "inline-block text-[13px] text-slate-400 transition-colors hover:text-slate-700"
    : "inline-block text-[13px] text-slate-400 transition-colors hover:text-white";
  const externalLinkClass = isApp
    ? "group inline-flex items-center gap-1.5 text-[13px] text-slate-400 transition-colors hover:text-slate-700"
    : "group inline-flex items-center gap-1.5 text-[13px] text-slate-400 transition-colors hover:text-white";

  return (
    <div className="min-w-0">
      <h3 className={`mb-4 text-[11px] font-mono font-semibold uppercase tracking-[0.16em] ${labelClass}`}>
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={`${l.href}-${l.label}`}>
            {l.external ? (
              <a
                href={l.href}
                target={l.href.startsWith("mailto:") ? undefined : "_blank"}
                rel={l.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                className={externalLinkClass}
              >
                <span className="truncate">{l.label}</span>
                {!l.href.startsWith("mailto:") && (
                  <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </a>
            ) : (
              <Link href={l.href} className={linkClass}>
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RiskDisclaimer({ isApp }: { isApp?: boolean }) {
  return (
    <div
      className="flex gap-3 rounded-2xl border px-4 py-4 sm:px-5 sm:py-5"
      style={
        isApp
          ? {
              borderColor: "rgba(239,68,68,0.15)",
              background: "rgba(239,68,68,0.04)",
            }
          : {
              borderColor: "rgba(255,60,60,0.18)",
              background:
                "linear-gradient(135deg, rgba(255,60,60,0.06), rgba(255,140,0,0.04))",
            }
      }
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
        style={
          isApp
            ? { borderColor: "rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.07)" }
            : { borderColor: "rgba(255,60,60,0.35)", background: "rgba(255,60,60,0.08)" }
        }
      >
        <Shield className={`h-4 w-4 ${isApp ? "text-red-400" : "text-[#ff6b6b]"}`} />
      </div>
      <p className={`text-[11.5px] leading-relaxed font-mono ${isApp ? "text-slate-500" : "text-slate-400"}`}>
        <span className={`font-semibold ${isApp ? "text-slate-700" : "text-slate-200"}`}>Risk warning. </span>
        Trading financial instruments — including forex, CFDs, futures, crypto
        and stocks — involves substantial risk and may not be suitable for every
        investor. Past performance, backtests and simulated results do not
        guarantee future returns. RiskSent is a software platform for analysis,
        journaling and risk management; it does not provide investment advice,
        brokerage or asset custody. Make sure you fully understand the risks
        involved and seek independent financial advice if needed.
      </p>
    </div>
  );
}

export function Footer({ variant = "marketing" }: { variant?: FooterVariant }) {
  const year = new Date().getFullYear();
  const isApp = variant === "app" || variant === "mock";

  const footerStyle = isApp
    ? {
        zIndex: 1,
        borderColor: "rgba(0,0,0,0.06)",
        background: "#F1F5F9",
      }
    : {
        zIndex: 1,
        borderColor: "rgba(255,255,255,0.06)",
        background: "rgba(8,8,9,0.96)",
        backdropFilter: "blur(20px)",
      };

  return (
    <footer
      role="contentinfo"
      className="relative mt-16 border-t"
      style={footerStyle}
    >
      {/* Soft accent line under top border */}
      {!isApp && (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,60,60,0.35) 20%, rgba(255,140,0,0.35) 80%, transparent 100%)",
        }}
      />
      )}

      <div
        className={`mx-auto w-full ${
          isApp ? "max-w-[1600px] px-4 sm:px-6 lg:px-8" : "max-w-7xl px-6 lg:px-16"
        } ${isApp ? "py-8" : "py-12 lg:py-16"}`}
      >
        {isApp ? (
          /* ── App footer: minimal ── */
          <>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              {/* Brand + social */}
              <div>
                <Link href="/dashboard" className="inline-flex items-center">
                  <span className="text-lg font-black tracking-tight text-slate-900" style={{ fontFamily: "'Syne', var(--font-display, sans-serif)" }}>
                    RiskSent
                  </span>
                </Link>
                <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-slate-500">
                  Backtest, journal and enforce your risk rules — one platform for disciplined traders.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <a href="https://x.com/risksent" target="_blank" rel="noopener noreferrer" aria-label="RiskSent on X"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-700 transition-all">
                    <XLogo className="h-[13px] w-[13px]" />
                  </a>
                  <a href="https://instagram.com/risksent" target="_blank" rel="noopener noreferrer" aria-label="RiskSent on Instagram"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-700 transition-all">
                    <Instagram className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Risk warning */}
            <div className="mt-6">
              <RiskDisclaimer isApp />
            </div>

            {/* Divider */}
            <div className="my-5 h-px w-full" style={{ background: "rgba(0,0,0,0.06)" }} />

            {/* Bottom strip */}
            <div className="flex flex-col gap-3 text-[11px] font-mono text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <p>© {year} RiskSent · All rights reserved.</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {[
                  { href: "/terms", label: "Terms" },
                  { href: "/privacy", label: "Privacy" },
                  { href: "/cookies", label: "Cookies" },
                  { href: "/risk-disclosure", label: "Risk" },
                  { href: "/support", label: "Support" },
                ].map((l) => (
                  <Link key={l.href} href={l.href} className="transition-colors hover:text-slate-700">
                    {l.label}
                  </Link>
                ))}
                <button type="button" onClick={() => openCookiePreferences()} className="transition-colors hover:text-slate-700">
                  Cookie preferences
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ── Marketing footer: full ── */
          <>
            {/* Top grid */}
            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-12 lg:gap-12">
              {/* Brand */}
              <div className="col-span-2 sm:col-span-3 lg:col-span-4">
                <Link href="/" className="inline-flex items-center">
                  <span className="text-xl font-black tracking-tight text-white" style={{ fontFamily: "'Syne', var(--font-display, sans-serif)" }}>
                    RiskSent
                  </span>
                </Link>
                <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-slate-400">
                  The all-in-one trading platform: backtest strategies, journal
                  every trade and enforce your risk rules with live alerts — one
                  subscription, zero chaos.
                </p>
                <div className="mt-6 flex items-center gap-2">
                  <a href="https://x.com/risksent" target="_blank" rel="noopener noreferrer" aria-label="RiskSent on X"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/20 hover:bg-white/[0.06] hover:text-white transition-all">
                    <XLogo className="h-[14px] w-[14px]" />
                  </a>
                  <a href="https://instagram.com/risksent" target="_blank" rel="noopener noreferrer" aria-label="RiskSent on Instagram"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/20 hover:bg-white/[0.06] hover:text-white transition-all">
                    <Instagram className="h-4 w-4" />
                  </a>
                </div>
              </div>
              {/* Link columns */}
              <div className="lg:col-span-2">
                <FooterColumn title="Product" links={PRODUCT_LINKS} />
              </div>
              <div className="lg:col-span-2">
                <FooterColumn title="Resources" links={RESOURCES_LINKS} />
              </div>
              <div className="lg:col-span-2">
                <FooterColumn title="Company" links={COMPANY_LINKS} />
              </div>
              <div className="lg:col-span-2">
                <FooterColumn title="Legal" links={LEGAL_LINKS} />
              </div>
            </div>

            {/* Risk disclaimer */}
            <div className="mt-12">
              <RiskDisclaimer />
            </div>

            {/* Divider */}
            <div className="my-8 h-px w-full" style={{ background: "rgba(255,255,255,0.06)" }} />

            {/* Bottom strip */}
            <div className="flex flex-col gap-4 text-[11px] font-mono text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>© {year} RiskSent · All rights reserved. Built for disciplined traders.</p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {[
                  { href: "/terms", label: "Terms" },
                  { href: "/privacy", label: "Privacy" },
                  { href: "/cookies", label: "Cookies" },
                  { href: "/risk-disclosure", label: "Risk" },
                  { href: "/support", label: "Support" },
                ].map((l) => (
                  <Link key={l.href} href={l.href} className="transition-colors hover:text-slate-300">
                    {l.label}
                  </Link>
                ))}
                <button type="button" onClick={() => openCookiePreferences()} className="transition-colors hover:text-slate-300">
                  Cookie preferences
                </button>
                <span className="hidden sm:inline text-slate-700">·</span>
                <span className="text-slate-600">v1.0</span>
              </div>
            </div>
          </>
        )}
      </div>
    </footer>
  );
}

export default Footer;
