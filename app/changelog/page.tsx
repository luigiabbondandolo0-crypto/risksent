"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Zap, Shield, BarChart2, BookOpen, Brain, Bell, Wrench, AlertTriangle } from "lucide-react";

const ACCENT = "#6366F1";

type EntryType = "feature" | "improvement" | "fix" | "breaking";

interface ChangelogEntry {
  version: string;
  date: string;
  items: { type: EntryType; text: string }[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.6.0",
    date: "April 28, 2026",
    items: [
      { type: "feature",     text: "Sentry error tracking — client, server, and edge runtime errors captured with source maps for readable production stack traces" },
      { type: "feature",     text: "Plausible Analytics — cookieless, GDPR-friendly visit tracking" },
      { type: "improvement", text: "Server-side subscription gating on AI Coach and Risk Manager API routes — plan enforcement no longer bypassable via direct API calls" },
      { type: "improvement", text: "Content Security Policy header — restricts script, style, connect, and frame sources across all pages" },
      { type: "improvement", text: "AI Coach prompt caching — system prompt cached on Anthropic API, significantly reduces cost per report and chat message" },
      { type: "improvement", text: "Custom 500 error pages (error.tsx and global-error.tsx) — replaces Next.js default error UI" },
      { type: "improvement", text: "robots.txt and sitemap.xml — dynamic Next.js routes, blocks /app /api /admin from indexing" },
    ],
  },
  {
    version: "1.5.0",
    date: "April 16, 2026",
    items: [
      { type: "feature",     text: "AI Coach feature section added to landing page — inline chat mockup preview with animated message bubbles and typing indicator" },
      { type: "feature",     text: "AI Coach card added to modules grid — landing page now shows all 5 platform pillars" },
      { type: "improvement", text: "Risk Sentinel renamed to Risk Manager across landing page feature list and modules grid" },
      { type: "improvement", text: "Testimonials section fully redesigned — star ratings, verified trader badges, quantified metrics, featured quote card" },
      { type: "improvement", text: "Hero description updated to include AI Coach in the feature list" },
      { type: "improvement", text: "Modules grid expanded from 4 to 5 columns — responsive xl:grid-cols-5 layout" },
      { type: "improvement", text: "Journaling dashboard preview: staggered calendar cell animations, animated trade dot pulses, hover scale on cells" },
      { type: "improvement", text: "Journaling dashboard preview: mini stat pills row (Win rate, Profit factor, Best setup) with entrance animations" },
      { type: "improvement", text: "Journaling dashboard: responsive trade rows with progressive disclosure — tag/date columns appear at md/lg breakpoints" },
    ],
  },
  {
    version: "1.4.1",
    date: "April 15, 2026",
    items: [
      { type: "improvement", text: "Sidebar nav links updated — Risk Sentinel route renamed to Risk Manager" },
      { type: "improvement", text: "AppHeaderBar: active route indicator uses route prefix matching for nested pages" },
      { type: "improvement", text: "Mobile: hero equity card hidden below lg breakpoint to reduce layout shift on small screens" },
      { type: "fix",         text: "ScrollTrigger.refresh() called after font load — fixes animation offset on first visit" },
      { type: "fix",         text: "Marquee overflow clipped correctly on iOS Safari — added overflow-x: hidden to wrapper" },
      { type: "fix",         text: "Risk Manager page: DrawdownGauge SVG arc length calculation corrected for values > 80%" },
    ],
  },
  {
    version: "1.4.0",
    date: "April 2026",
    items: [
      { type: "feature",     text: "Command palette (⌘K) — search pages and navigate from anywhere" },
      { type: "feature",     text: "Global toast notification system — action feedback across all pages" },
      { type: "feature",     text: "Loading skeleton states on dashboard and data-heavy pages" },
      { type: "feature",     text: "Animated empty states for journal, backtesting, and rules sections" },
      { type: "improvement", text: "New font: Outfit replaces Syne — cleaner at all sizes" },
      { type: "improvement", text: "Electric indigo colour palette — more minimal, more impactful" },
      { type: "improvement", text: "Full-scroll GSAP animations — continuous parallax from hero to footer" },
      { type: "improvement", text: "Landing page SEO: full OG/Twitter metadata, JSON-LD structured data" },
      { type: "improvement", text: "Mountain canvas: brighter silhouettes, glowing ridge lines, deeper camera flight" },
    ],
  },
  {
    version: "1.3.0",
    date: "March 2026",
    items: [
      { type: "feature",     text: "AI Coach page — chat interface with trading psychology analysis" },
      { type: "feature",     text: "Cinematic restyling across all 7 public marketing pages" },
      { type: "feature",     text: "Three.js horizon canvas — starfield, nebula, market-volatility mountains" },
      { type: "feature",     text: "Scroll-driven camera flight (GSAP + ScrollTrigger)" },
      { type: "improvement", text: "Scan-card hover effect, animated gradient borders, CRT overlay" },
      { type: "improvement", text: "DrawdownGauge SVG animation on risk manager page" },
      { type: "improvement", text: "AlertsDemo with staggered Telegram-style notification pop" },
      { type: "fix",         text: "Resolved framer-motion v12 yPercent incompatibility" },
    ],
  },
  {
    version: "1.2.0",
    date: "February 2026",
    items: [
      { type: "feature",     text: "Live Alerts page with HomeLiveAlertsPhone component" },
      { type: "feature",     text: "Risk Manager page with hard-block modal demo" },
      { type: "feature",     text: "Pricing page with Stripe integration — plans, toggle, FAQ" },
      { type: "improvement", text: "Backtesting page: AnimatedCounter stats, TerminalList typewriter" },
      { type: "improvement", text: "Journaling page: animated trade rows, timeline section" },
      { type: "fix",         text: "Candlestick SVG uses deterministic math — no hydration mismatch" },
    ],
  },
  {
    version: "1.1.0",
    date: "January 2026",
    items: [
      { type: "feature",     text: "Mock dashboard with real data structure and demo accounts" },
      { type: "feature",     text: "Backtesting lab: session replay, strategy comparison" },
      { type: "feature",     text: "Trading journal: trade log, tag system, pattern detection" },
      { type: "improvement", text: "AppShell + sidebar navigation for authenticated routes" },
      { type: "improvement", text: "Supabase auth with onboarding flow" },
      { type: "fix",         text: "Fixed ScrollToTop not triggering on route changes" },
    ],
  },
  {
    version: "1.0.0",
    date: "December 2025",
    items: [
      { type: "feature",     text: "Initial release of RiskSent" },
      { type: "feature",     text: "Real-time risk monitoring with rule-based hard blocks" },
      { type: "feature",     text: "Telegram alert delivery — sub-1s latency" },
      { type: "feature",     text: "Account management with MetaTrader API integration" },
      { type: "feature",     text: "Landing page with GSAP hero animations" },
    ],
  },
];

const TYPE_CONFIG: Record<EntryType, { label: string; color: string; icon: React.ElementType }> = {
  feature:     { label: "New",         color: "#6366F1", icon: Zap },
  improvement: { label: "Improved",    color: "#4ADE80", icon: Wrench },
  fix:         { label: "Fix",         color: "#FB923C", icon: Shield },
  breaking:    { label: "Breaking",    color: "#F87171", icon: AlertTriangle },
};

export default function ChangelogPage() {
  return (
    <div className="min-h-full overflow-x-hidden" style={{ background: "#070710" }}>

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[40vh] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.10) 0%, transparent 70%)" }} />
      </div>

      <div className="relative px-6 pt-24 pb-32 lg:px-16" style={{ zIndex: 1 }}>
        <div className="max-w-3xl mx-auto">

          {/* Back */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-12"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to home
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em] mb-5"
              style={{ color: ACCENT, borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.08)" }}
            >
              Changelog
            </span>
            <h1
              className="text-[clamp(40px,7vw,80px)] font-black leading-[0.95] tracking-[-0.04em] text-white mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              What&apos;s new
            </h1>
            <p className="text-slate-500 text-sm" style={{ fontFamily: "var(--font-mono), monospace" }}>
              All notable changes to RiskSent — features, improvements, and fixes.
            </p>
          </motion.div>

          {/* Entries */}
          <div className="relative">
            {/* Timeline line */}
            <div
              className="absolute left-0 top-0 bottom-0 w-px"
              style={{ background: "linear-gradient(to bottom, rgba(99,102,241,0.4), rgba(99,102,241,0.05))" }}
            />

            <div className="space-y-16 pl-8">
              {CHANGELOG.map((release, ri) => (
                <motion.div
                  key={release.version}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: ri * 0.05, ease: "easeOut" }}
                >
                  {/* Version dot */}
                  <div
                    className="absolute left-[-4px] flex h-2 w-2 items-center justify-center rounded-full"
                    style={{ background: ACCENT, boxShadow: `0 0 12px ${ACCENT}80`, marginTop: "6px" }}
                  />

                  {/* Version header */}
                  <div className="flex items-baseline gap-4 mb-6">
                    <span
                      className="text-xl font-black tracking-tight"
                      style={{ fontFamily: "var(--font-display)", color: "#E8E9F5" }}
                    >
                      v{release.version}
                    </span>
                    <span className="text-xs font-mono text-slate-600">{release.date}</span>
                  </div>

                  {/* Items */}
                  <ul className="space-y-3">
                    {release.items.map((item, ii) => {
                      const cfg = TYPE_CONFIG[item.type];
                      const Icon = cfg.icon;
                      return (
                        <motion.li
                          key={ii}
                          initial={{ opacity: 0, x: -8 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.35, delay: ii * 0.04 }}
                          className="flex items-start gap-3"
                        >
                          <span
                            className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em]"
                            style={{
                              color: cfg.color,
                              borderColor: `${cfg.color}30`,
                              background: `${cfg.color}10`,
                              fontFamily: "var(--font-mono), monospace",
                              minWidth: "60px",
                              justifyContent: "center",
                            }}
                          >
                            <Icon className="h-2.5 w-2.5" />
                            {cfg.label}
                          </span>
                          <span
                            className="text-sm text-slate-400 leading-relaxed"
                            style={{ fontFamily: "var(--font-mono), monospace" }}
                          >
                            {item.text}
                          </span>
                        </motion.li>
                      );
                    })}
                  </ul>

                  {/* Divider */}
                  {ri < CHANGELOG.length - 1 && (
                    <div className="mt-12 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-24 text-center"
          >
            <p className="text-slate-600 text-xs font-mono mb-6">
              More updates coming soon — follow us for releases.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold text-white transition-all hover:scale-[1.03]"
              style={{
                background: "linear-gradient(135deg, #6366F1, #A78BFA)",
                boxShadow: "0 0 40px rgba(99,102,241,0.3)",
              }}
            >
              Start for free <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
