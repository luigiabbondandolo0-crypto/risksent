"use client";

import Link from "next/link";
import {
  Shield,
  Bell,
  Bot,
  ArrowRight,
  Send,
  BarChart3,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-full">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-10 pb-16 sm:px-6 sm:pt-14 sm:pb-20 lg:px-10 lg:pt-16 lg:pb-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-slate-950 to-emerald-500/5" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-center">
          <div className="w-full space-y-6 text-center lg:w-1/2 lg:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
              Trading risk dashboard for MT4 / MT5
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl sm:leading-tight lg:text-5xl">
              Everything you{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                wish your broker
              </span>{" "}
              told you about risk.
            </h1>
            <p className="mx-auto max-w-xl text-sm text-slate-300 sm:text-base lg:mx-0">
              RiskSent keeps a live journal of your risk: daily loss, exposure,
              revenge trading and over-sized positions. One clean dashboard,
              Telegram alerts when it matters.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-start">
              <Link
                href="/signup"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:shadow-cyan-500/40 sm:w-auto"
              >
                Get started free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-600 bg-slate-900/60 px-6 py-3 text-sm font-medium text-slate-100 transition-colors hover:border-cyan-400/60 hover:bg-slate-900 sm:w-auto"
              >
                View live dashboard
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 lg:justify-start">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Designed for prop traders & manual strategies</span>
              </div>
              <span className="hidden h-3 w-px bg-slate-700 sm:inline-block" />
              <span className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                Live monitoring · Telegram alerts
              </span>
            </div>
          </div>

          {/* Hero preview card */}
          <div className="w-full lg:w-1/2">
            <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-2xl shadow-black/60 backdrop-blur">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
                    Live risk snapshot
                  </p>
                  <p className="text-xs text-slate-500">
                    One view for all your MetaTrader accounts.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                  Connected
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Daily loss
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    -1.8%
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Limit -3.0%
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Exposure
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    4.2%
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Limit 6.0%
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Consecutive losses
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">2</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Threshold 3
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-300">
                    <Shield className="h-3.5 w-3.5 text-cyan-400" />
                    Rules engine
                  </span>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                    Auto-checked every minute
                  </span>
                </div>
                <div className="mt-1 space-y-1.5 text-[11px] text-slate-400">
                  <p>• Stop trading today if daily loss &gt; 3%</p>
                  <p>• Max risk per trade 1% of equity</p>
                  <p>• Telegram ping only on high severity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof / metrics */}
      <section className="border-y border-slate-800 bg-slate-950/80 px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
              Built for traders, not spreadsheets
            </p>
            <p className="text-sm text-slate-300">
              Replace manual risk tracking with a live dashboard and Telegram
              alerts.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-4 text-center sm:w-auto sm:grid-cols-3">
            <div>
              <p className="text-lg font-semibold text-white sm:text-xl">
                &lt; 2 min
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Setup per account
              </p>
            </div>
            <div>
              <p className="text-lg font-semibold text-white sm:text-xl">
                4 rules
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Cover 90% of risk
              </p>
            </div>
            <div>
              <p className="text-lg font-semibold text-white sm:text-xl">
                1 feed
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                All accounts, one view
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partners slider */}
      <section className="px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            PARTNERS & INTEGRATIONS
          </p>
          <div className="mt-4 overflow-hidden pb-2">
            <div className="partners-marquee">
              {[0, 1].map((row) => (
                <div key={row} className="flex items-center gap-6">
                  <div className="flex h-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/70 px-4">
                    <img
                      src="/partners/avantgarde-fx.png"
                      alt="Avantgarde FX"
                      className="h-8 w-auto object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="px-4 py-14 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Your trading journal for{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                risk
              </span>
              , not screenshots.
            </h2>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">
              TradeZella tracks every execution detail. RiskSent tracks whether
              those trades respect your risk plan: loss, exposure and behaviour,
              so you know when risk is drifting out of bounds.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "Rule-based risk",
                desc: "Daily loss, max risk per trade, max exposure and revenge-trading thresholds in one ruleset.",
              },
              {
                icon: Bell,
                title: "Clean alerts",
                desc: "Problem + solution format, sent to Telegram only when a rule is actually breached or approached.",
              },
              {
                icon: BarChart3,
                title: "Equity & stats",
                desc: "Minimal equity curve, drawdown and win-rate context so you see the story behind each alert.",
              },
              {
                icon: Bot,
                title: "AI Coach (soon)",
                desc: "Surface patterns like over-sizing after losses or breaking rules around news events.",
              },
              {
                icon: Shield,
                title: "Multi-account ready",
                desc: "Connect multiple MetaTrader accounts and see their risk profile in one place.",
              },
              {
                icon: Bell,
                title: "Cron-based automation",
                desc: "Background checks every minute so alerts show up while you are focused on execution.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 ring-1 ring-slate-700/80">
                  <item.icon className="h-4 w-4 text-cyan-300" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs text-slate-300 sm:text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Separator between features and flow */}
      <section className="px-4 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 pb-14 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <div className="lg:w-2/5">
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                From account to alert
                <br />
                in three steps.
              </h2>
              <p className="mt-3 text-sm text-slate-300 sm:text-base">
                No spreadsheets, no manual screenshots. RiskSent turns your
                MetaTrader feed into a structured risk journal you can actually
                act on.
              </p>
            </div>
            <div className="space-y-4 lg:w-3/5">
              {[
                {
                  step: "01",
                  title: "Connect MetaTrader",
                  body: "Add your MT4/MT5 account once. We fetch account summary, closed trades and open positions via MetaTrader API.",
                },
                {
                  step: "02",
                  title: "Set your rules",
                  body: "Define daily loss, max risk per trade, max exposure and revenge-trading thresholds in the Rules screen.",
                },
                {
                  step: "03",
                  title: "Let alerts do the shouting",
                  body: "RiskSent checks your account on a schedule. When a rule is hit or approached, you get one clean Telegram alert.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-slate-200">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 pb-14 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Traders who treat risk as a{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                first-class metric
              </span>
              .
            </h2>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">
              RiskSent is built for discretionary traders and prop accounts that
              want less noise and more accountability.
            </p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Luca, FTMO trader",
                text: "“I finally stopped checking five different dashboards. One glance at RiskSent tells me if I can keep trading or not.”",
              },
              {
                name: "Sara, swing trader",
                text: "“The Telegram alerts are simple and precise. When daily loss is near the limit, I get a ping and walk away.”",
              },
              {
                name: "Marco, prop firm coach",
                text: "“Monitoring multiple traders is easier: I only react when someone is breaking basic risk rules.”",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="flex h-full flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-5"
              >
                <p className="text-sm text-slate-100">{t.text}</p>
                <p className="mt-4 text-xs font-medium text-slate-400">
                  {t.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/15 via-slate-950 to-emerald-500/15 p-7 text-center sm:p-10">
            <div className="pointer-events-none absolute -right-24 -top-24 h-52 w-52 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-52 w-52 rounded-full bg-emerald-500/20 blur-3xl" />
            <h2 className="relative text-2xl font-semibold text-white sm:text-3xl">
              Start trading with a{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                hard risk ceiling
              </span>
              .
            </h2>
            <p className="relative mt-2 text-sm text-slate-200 sm:text-base">
              Create your account, connect MetaTrader and set rules in under 5
              minutes. Let RiskSent watch your exposure while you focus on
              execution.
            </p>
            <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
              >
                Get started
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300/50 bg-transparent px-6 py-3 text-sm font-medium text-slate-100 transition-colors hover:border-cyan-400/60"
              >
                Already have an account?
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="px-4 pb-10 sm:px-6 lg:px-10" id="contact">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-xl font-semibold text-white sm:text-2xl">
            Need help connecting your account?
          </h2>
          <p className="mt-2 text-center text-sm text-slate-300">
            Tell us which broker and MetaTrader server you use and we&apos;ll
            help you wire it into RiskSent.
          </p>
          <form
            className="mt-6 space-y-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-5 sm:p-7"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-500/40"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-500/40"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="broker"
                className="block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400"
              >
                Broker / Prop firm
              </label>
              <input
                id="broker"
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-500/40"
                placeholder="Broker name, server (optional)"
              />
            </div>
            <div>
              <label
                htmlFor="message"
                className="block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400"
              >
                How can we help?
              </label>
              <textarea
                id="message"
                rows={4}
                className="mt-1 w-full resize-none rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-500/40"
                placeholder="Tell us about your setup, issues or ideas…"
              />
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:opacity-90 sm:w-auto sm:px-6"
            >
              <Send className="h-4 w-4" />
              Send message
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-4 py-7 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} RiskSent. Trading risk dashboard for
            MetaTrader.
          </p>
          <div className="flex gap-5 text-[11px] text-slate-500">
            <Link
              href="/login"
              className="transition-colors hover:text-cyan-400"
            >
              Log in
            </Link>
            <Link
              href="/dashboard"
              className="transition-colors hover:text-cyan-400"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
