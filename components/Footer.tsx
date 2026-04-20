"use client";

import Link from "next/link";
import { ArrowUpRight, Instagram, Shield } from "lucide-react";

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
  { href: "https://status.risksent.com", label: "System status", external: true },
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

function FooterColumn({ title, links }: { title: string; links: LinkItem[] }) {
  return (
    <div className="min-w-0">
      <h3 className="mb-4 text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-slate-500">
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
                className="group inline-flex items-center gap-1.5 text-[13px] text-slate-400 transition-colors hover:text-white"
              >
                <span className="truncate">{l.label}</span>
                {!l.href.startsWith("mailto:") && (
                  <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </a>
            ) : (
              <Link
                href={l.href}
                className="inline-block text-[13px] text-slate-400 transition-colors hover:text-white"
              >
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RiskDisclaimer() {
  return (
    <div
      className="flex gap-3 rounded-2xl border px-4 py-4 sm:px-5 sm:py-5"
      style={{
        borderColor: "rgba(255,60,60,0.18)",
        background:
          "linear-gradient(135deg, rgba(255,60,60,0.06), rgba(255,140,0,0.04))",
      }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
        style={{
          borderColor: "rgba(255,60,60,0.35)",
          background: "rgba(255,60,60,0.08)",
        }}
      >
        <Shield className="h-4 w-4 text-[#ff6b6b]" />
      </div>
      <p className="text-[11.5px] leading-relaxed text-slate-400 font-mono">
        <span className="font-semibold text-slate-200">Risk warning. </span>
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

  return (
    <footer
      role="contentinfo"
      className="relative mt-16 border-t"
      style={{
        zIndex: 1,
        borderColor: "rgba(255,255,255,0.06)",
        background: "rgba(8,8,9,0.96)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Soft orange/red accent line under top border */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,60,60,0.35) 20%, rgba(255,140,0,0.35) 80%, transparent 100%)",
        }}
      />

      <div
        className={`mx-auto w-full ${
          isApp ? "max-w-[1600px] px-4 sm:px-6 lg:px-8" : "max-w-7xl px-6 lg:px-16"
        } py-12 lg:py-16`}
      >
        {/* Top grid */}
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-12 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-black text-white"
                style={{
                  background: "linear-gradient(135deg, #ff3c3c, #ff8c00)",
                }}
              >
                RS
              </span>
              <span
                className="text-lg font-extrabold tracking-tight text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                RiskSent
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-slate-400">
              The all-in-one trading platform: backtest strategies, journal
              every trade and enforce your risk rules with live alerts — one
              subscription, zero chaos.
            </p>

            <div className="mt-6 flex items-center gap-2">
              <a
                href="https://x.com/risksent"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="RiskSent on X"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-slate-400 transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              >
                <XLogo className="h-[14px] w-[14px]" />
              </a>
              <a
                href="https://instagram.com/risksent"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="RiskSent on Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-slate-400 transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              >
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
        <div
          className="my-8 h-px w-full"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />

        {/* Bottom strip */}
        <div className="flex flex-col gap-4 text-[11px] font-mono text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} RiskSent · All rights reserved. Built for disciplined
            traders.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              href="/terms"
              className="transition-colors hover:text-slate-300"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-slate-300"
            >
              Privacy
            </Link>
            <Link
              href="/cookies"
              className="transition-colors hover:text-slate-300"
            >
              Cookies
            </Link>
            <Link
              href="/risk-disclosure"
              className="transition-colors hover:text-slate-300"
            >
              Risk
            </Link>
            <Link
              href="/support"
              className="transition-colors hover:text-slate-300"
            >
              Support
            </Link>
            <span className="hidden text-slate-700 sm:inline">·</span>
            <span className="text-slate-600">v1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
