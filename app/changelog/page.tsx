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
      { type: "improvement", text: "Faster AI Coach responses — reports and chat replies load noticeably quicker" },
      { type: "improvement", text: "Friendlier error pages — if something breaks, you now see a clear message with a support link instead of a blank screen" },
      { type: "improvement", text: "Improved site security — stronger browser-level protections across all pages" },
    ],
  },
  {
    version: "1.5.0",
    date: "April 16, 2026",
    items: [
      { type: "feature",     text: "AI Coach now featured on the homepage — see what it can do before signing up" },
      { type: "improvement", text: "Testimonials redesigned — real metrics, verified trader badges, featured quote" },
      { type: "improvement", text: "Homepage now shows all 5 platform modules in one view" },
      { type: "improvement", text: "Journal calendar preview: smoother animations and more trade stats at a glance" },
    ],
  },
  {
    version: "1.4.1",
    date: "April 15, 2026",
    items: [
      { type: "improvement", text: "Navigation highlight now follows nested pages correctly" },
      { type: "fix",         text: "Homepage animations no longer start offset on first visit" },
      { type: "fix",         text: "Scrolling banner clipped correctly on iOS Safari" },
      { type: "fix",         text: "Drawdown gauge renders correctly at high percentages" },
    ],
  },
  {
    version: "1.4.0",
    date: "April 2026",
    items: [
      { type: "feature",     text: "Quick navigation (⌘K) — jump to any page from anywhere" },
      { type: "feature",     text: "Action feedback toasts — confirmation messages after saving, connecting, and more" },
      { type: "feature",     text: "Loading skeletons — no more blank screens while data loads" },
      { type: "feature",     text: "Empty states — helpful prompts when a section has no data yet" },
      { type: "improvement", text: "Refreshed visual design — new font, indigo palette, cleaner layout" },
      { type: "improvement", text: "Homepage scroll animations overhauled — smoother, more cinematic" },
    ],
  },
  {
    version: "1.3.0",
    date: "March 2026",
    items: [
      { type: "feature",     text: "AI Coach — chat with your trading data, get personalised psychology insights" },
      { type: "feature",     text: "Homepage fully redesigned — animated 3D background, new sections for every feature" },
      { type: "improvement", text: "Risk Manager gauge animates on page load" },
      { type: "improvement", text: "Live alerts demo shows real-time Telegram notification flow" },
    ],
  },
  {
    version: "1.2.0",
    date: "February 2026",
    items: [
      { type: "feature",     text: "Live Alerts page — see how Telegram notifications work in real time" },
      { type: "feature",     text: "Risk Manager page — hard-block demo when rules are breached" },
      { type: "feature",     text: "Pricing page — plan comparison, FAQ, and direct checkout" },
      { type: "improvement", text: "Backtesting and journaling pages redesigned with animated stats" },
    ],
  },
  {
    version: "1.1.0",
    date: "January 2026",
    items: [
      { type: "feature",     text: "Full dashboard — connect your broker account and see live data" },
      { type: "feature",     text: "Backtesting lab — replay sessions, compare strategies" },
      { type: "feature",     text: "Trading journal — log trades, tag setups, spot patterns" },
      { type: "improvement", text: "Sidebar navigation and account onboarding flow" },
    ],
  },
  {
    version: "1.0.0",
    date: "December 2025",
    items: [
      { type: "feature",     text: "RiskSent launches — real-time risk monitoring for active traders" },
      { type: "feature",     text: "Rule-based hard blocks — stop trading automatically when limits are hit" },
      { type: "feature",     text: "Telegram alerts — get notified in under a second when a rule triggers" },
      { type: "feature",     text: "MetaTrader account integration — connect MT4 and MT5 accounts" },
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
