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
              All-in-one trading platform for MT4 / MT5
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl sm:leading-tight lg:text-5xl">
              The{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                one platform
              </span>{" "}
              for your entire trading workflow.
            </h1>
            <p className="mx-auto max-w-xl text-sm text-slate-300 sm:text-base lg:mx-0">
              Stop paying 4 subscriptions for 4 different tools. RiskSent now
              combines Backtesting, Journaling, and Risk Monitoring with live
              alerts in one clean workspace.
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
                Explore the platform
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 lg:justify-start">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Built for prop traders and independent traders</span>
              </div>
              <span className="hidden h-3 w-px bg-slate-700 sm:inline-block" />
              <span className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                Backtesting · Journaling · Live alerts
              </span>
            </div>
          </div>

          {/* Hero preview card */}
          <div className="w-full lg:w-1/2">
            <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-2xl shadow-black/60 backdrop-blur">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
                    Unified trading snapshot
                  </p>
                  <p className="text-xs text-slate-500">
                    Backtest, journal, and manage risk in one view.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                  Connected
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Backtesting
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    278 tests
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Last strategy updated today
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Journaling
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    346 trades
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Tagged and review-ready
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Risk status
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    Live monitoring
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Alerts active on Telegram
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-300">
                    <Shield className="h-3.5 w-3.5 text-cyan-400" />
                    Platform engine
                  </span>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                    All modules in sync
                  </span>
                </div>
                <div className="mt-1 space-y-1.5 text-[11px] text-slate-400">
                  <p>• Backtesting validates ideas before live execution</p>
                  <p>• Journaling tracks execution quality and discipline</p>
                  <p>• Risk module sends live alerts when limits are near</p>
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
              One subscription, full trading stack
            </p>
            <p className="text-sm text-slate-300">
              Replace fragmented tools with Backtesting, Journaling and Risk
              alerts inside one platform.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-4 text-center sm:w-auto sm:grid-cols-3">
            <div>
              <p className="text-lg font-semibold text-white sm:text-xl">
                1 plan
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                One subscription
              </p>
            </div>
            <div>
              <p className="text-lg font-semibold text-white sm:text-xl">
                3 modules
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Backtesting, Journaling, Risk
              </p>
            </div>
            <div>
              <p className="text-lg font-semibold text-white sm:text-xl">
                1 workflow
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                One place, one process
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partners slider */}
      <section className="px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            PARTNERS & INTEGRATIONS
          </p>
          <div className="mt-4 overflow-hidden pb-2">
            <div className="partners-marquee">
              {[0, 1].map((row) => (
                <div key={row} className="flex items-center gap-8">
                  <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl border border-slate-700/70 bg-transparent p-4">
                    <img
                      src="/partners/avantgarde-fx.png"
                      alt="Avantgarde FX"
                      className="h-full w-full object-contain"
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
              The complete suite for{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                modern traders
              </span>
              , not tool chaos.
            </h2>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">
              RiskSent is now your operating system for trading: validate ideas
              with Backtesting, track behavior with Journaling, and protect your
              capital with the risk engine and live alerts.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "Backtesting lab",
                desc: "Test strategy ideas across historical data before you put capital at risk.",
              },
              {
                icon: Bell,
                title: "Live risk alerts",
                desc: "Get actionable Telegram alerts when daily loss, exposure or behavior thresholds are reached.",
              },
              {
                icon: BarChart3,
                title: "Journaling workspace",
                desc: "Store trades, tag setups, review execution quality and identify recurring mistakes.",
              },
              {
                icon: Bot,
                title: "Cross-module insights",
                desc: "Connect what worked in backtests with what actually happens in live execution.",
              },
              {
                icon: Shield,
                title: "Single account, single fee",
                desc: "One subscription unlocks every module instead of paying separate platforms.",
              },
              {
                icon: Bell,
                title: "Automation built-in",
                desc: "Background checks keep your risk state updated while you focus on decisions.",
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
                From idea to execution
                <br />
                in three steps.
              </h2>
              <p className="mt-3 text-sm text-slate-300 sm:text-base">
                One platform from research to execution control. RiskSent removes
                context switching between disconnected tools.
              </p>
            </div>
            <div className="space-y-4 lg:w-3/5">
              {[
                {
                  step: "01",
                  title: "Backtest your strategy",
                  body: "Validate your strategy logic first, so your first live trade is already based on data.",
                },
                {
                  step: "02",
                  title: "Journal every execution",
                  body: "Track trades, tag setups, and review behavior with a structured journaling flow.",
                },
                {
                  step: "03",
                  title: "Protect capital with alerts",
                  body: "RiskSent monitors your live account. When limits are near or broken, you get one clear alert.",
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
              Traders who wanted{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                one platform
              </span>
              finally have it.
            </h2>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">
              Backtesting, journaling and risk alerts now live under one
              subscription, one login and one workflow.
            </p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Luca, FTMO trader",
                text: "“I dropped 3 tools after moving to RiskSent. Backtesting and journaling now feed directly into my risk decisions.”",
              },
              {
                name: "Sara, swing trader",
                text: "“One subscription, one dashboard. I can test, journal and control risk without switching apps all day.”",
              },
              {
                name: "Marco, prop firm coach",
                text: "“The live alerts plus journaling history make coaching much faster. The full process is finally in one place.”",
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

      {/* Mock preview — AI Coach */}
      <section className="px-4 pb-14 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/50 via-slate-950 to-slate-950 p-7 sm:p-10">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/90">
                  AI Coach · Versione mock
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                  Try the full platform without an account
                </h2>
                <p className="mt-2 text-sm text-slate-300 sm:text-base">
                  Explore Backtesting, Journaling, Risk rules and dashboard with
                  demo data. Isolated from the real environment: no MetaTrader
                  API and no database writes.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/mock"
                  className="inline-flex items-center justify-center rounded-xl bg-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-colors hover:bg-violet-400"
                >
                  Open demo platform
                </Link>
                <Link
                  href="/mock/ai-coach"
                  className="inline-flex items-center justify-center rounded-xl border border-violet-500/40 px-6 py-3 text-sm font-medium text-violet-100 transition-colors hover:bg-violet-500/10"
                >
                  AI Coach (demo)
                </Link>
              </div>
            </div>
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
              Run your trading with{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                one complete platform
              </span>
              .
            </h2>
            <p className="relative mt-2 text-sm text-slate-200 sm:text-base">
              Start with one subscription and unlock Backtesting, Journaling and
              live Risk Alerts. One stack, one process, no fragmented tools.
            </p>
            <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
              >
                Start now
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300/50 bg-transparent px-6 py-3 text-sm font-medium text-slate-100 transition-colors hover:border-cyan-400/60"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="px-4 pb-10 sm:px-6 lg:px-10" id="contact">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-xl font-semibold text-white sm:text-2xl">
            Need help setting up your workflow?
          </h2>
          <p className="mt-2 text-center text-sm text-slate-300">
            Tell us your trading style and we&apos;ll help you configure
            Backtesting, Journaling and the Risk module in RiskSent.
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
            © {new Date().getFullYear()} RiskSent. All-in-one trading platform
            for MetaTrader.
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
              Platform
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
