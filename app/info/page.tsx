"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Shield,
  Cookie,
  AlertTriangle,
  Compass,
  HelpCircle,
  Mail,
  Activity,
  ArrowRight,
} from "lucide-react";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const CARDS = [
  {
    href: "/terms",
    icon: FileText,
    title: "Terms of Service",
    desc: "Your rights and responsibilities when using RiskSent.",
    color: "#818cf8",
  },
  {
    href: "/privacy",
    icon: Shield,
    title: "Privacy Policy",
    desc: "How we collect, use, and protect your personal data under GDPR.",
    color: "#34d399",
  },
  {
    href: "/cookies",
    icon: Cookie,
    title: "Cookie Policy",
    desc: "What cookies we set, why, and how to manage your preferences.",
    color: "#fb923c",
  },
  {
    href: "/risk-disclosure",
    icon: AlertTriangle,
    title: "Risk Disclosure",
    desc: "Important trading risk warnings. Please read before using the platform.",
    color: "#f87171",
  },
  {
    href: "/mission",
    icon: Compass,
    title: "Mission",
    desc: "Who we are, why we built RiskSent, and where we're going.",
    color: "#a78bfa",
  },
  {
    href: "/support",
    icon: HelpCircle,
    title: "Help Center",
    desc: "FAQs, guides, and answers to everything about using the platform.",
    color: "#38bdf8",
  },
  {
    href: "/contact",
    icon: Mail,
    title: "Contact",
    desc: "Reach our team directly. We typically respond within 24 hours.",
    color: "#4ade80",
  },
  {
    href: "/status",
    icon: Activity,
    title: "System Status",
    desc: "Live uptime, response times, and incident history for all services.",
    color: "#00e676",
  },
];

export default function InfoPage() {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        background:
          "radial-gradient(900px 400px at 50% -5%, rgba(255,60,60,0.07), transparent 60%), #080809",
      }}
    >
      <div className="mx-auto max-w-5xl px-6 pb-32 pt-20 lg:px-8">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 text-center"
        >
          <p className="mb-4 text-[11px] font-mono uppercase tracking-[0.28em] text-slate-500">
            RiskSent · Info
          </p>
          <h1
            className="text-[clamp(32px,5vw,64px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
            style={{ fontFamily: "'Syne', var(--font-display, sans-serif)" }}
          >
            Everything you need to know
            <br />
            <span className="text-slate-500">about RiskSent.</span>
          </h1>
          <p
            className="mx-auto mt-5 max-w-md text-slate-400"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}
          >
            Legal, company, and support pages — all in one place.
          </p>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.href} variants={item}>
                <Link
                  href={card.href}
                  className="group flex h-full flex-col rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: "rgba(14,14,18,0.85)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backdropFilter: "blur(16px)",
                  }}
                >
                  {/* Icon */}
                  <div
                    className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      background: `${card.color}14`,
                      border: `1px solid ${card.color}28`,
                    }}
                  >
                    <Icon className="h-4.5 w-4.5" style={{ color: card.color }} size={18} />
                  </div>

                  {/* Text */}
                  <p
                    className="mb-1.5 text-sm font-bold text-white"
                    style={{ fontFamily: "'Syne', var(--font-display, sans-serif)" }}
                  >
                    {card.title}
                  </p>
                  <p
                    className="flex-1 text-[12px] leading-relaxed text-slate-500 group-hover:text-slate-400 transition-colors"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {card.desc}
                  </p>

                  {/* Arrow */}
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-mono"
                    style={{ color: card.color }}>
                    <span>View</span>
                    <ArrowRight
                      className="h-3 w-3 transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center text-[12px] font-mono text-slate-600"
        >
          Can't find what you're looking for?{" "}
          <Link href="/contact" className="text-slate-400 underline underline-offset-4 hover:text-white transition-colors">
            Contact us
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
