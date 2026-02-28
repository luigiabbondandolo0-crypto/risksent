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
      <section className="relative overflow-hidden px-4 pt-12 pb-20 sm:px-6 sm:pt-20 sm:pb-28 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
        <div className="relative mx-auto max-w-4xl text-center">
          <p
            className="animate-fade-in text-xs font-medium uppercase tracking-widest text-cyan-400/90"
            style={{ opacity: 0 }}
          >
            Risk-first for MT4 & MT5
          </p>
          <h1
            className="animate-fade-in-up mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
            style={{ opacity: 0, animationDelay: "100ms" }}
          >
            Trade with{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              brutal clarity
            </span>
          </h1>
          <p
            className="animate-fade-in-up mx-auto mt-5 max-w-2xl text-base text-slate-400 sm:text-lg"
            style={{ opacity: 0, animationDelay: "200ms" }}
          >
            RiskSent is a minimal fintech dashboard for serious traders. Set
            rules, get alerts, and keep your edge without the noise.
          </p>
          <div
            className="animate-fade-in-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ opacity: 0, animationDelay: "300ms" }}
          >
            <Link
              href="/dashboard"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:shadow-cyan-500/30 hover:scale-[1.02] sm:w-auto"
            >
              Open Dashboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-600 bg-slate-800/40 px-6 py-3 text-sm font-medium text-slate-200 transition-all duration-200 hover:border-cyan-500/50 hover:bg-slate-800/60 sm:w-auto"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2
            className="text-center text-2xl font-bold text-white sm:text-3xl"
            style={{ opacity: 0 }}
          >
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-slate-400">
            Rules, alerts, equity, and AI insights in one place.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Shield,
                title: "Risk rules",
                desc: "Daily loss caps, max risk per trade, exposure and revenge filters.",
                iconClass: "bg-cyan-500/10 text-cyan-400 ring-cyan-500/20"
              },
              {
                icon: Bell,
                title: "Alerts center",
                desc: "Clean alerts with problem + solution. Telegram when you want.",
                iconClass: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
              },
              {
                icon: BarChart3,
                title: "Equity & trades",
                desc: "Minimal equity curve, WR %, DD %, sanity score per trade.",
                iconClass: "bg-amber-500/10 text-amber-400 ring-amber-500/20"
              },
              {
                icon: Bot,
                title: "AI Coach",
                desc: "Revenge patterns, sizing errors, personalized weekly insights.",
                iconClass: "bg-violet-500/10 text-violet-400 ring-violet-500/20"
              }
            ].map((item, i) => (
              <div
                key={item.title}
                className="group relative rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-cyan-500/5"
                style={{
                  animation: "fade-in-up 0.5s ease-out forwards",
                  opacity: 0,
                  animationDelay: `${400 + i * 80}ms`
                }}
              >
                <div
                  className={`inline-flex rounded-lg p-2.5 ring-1 ${item.iconClass}`}
                >
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-slate-900/80 to-emerald-500/10 p-8 text-center sm:p-12">
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
            <h2 className="relative text-2xl font-bold text-white sm:text-3xl">
              Ready to tighten your edge?
            </h2>
            <p className="relative mt-2 text-slate-400">
              Connect your MT4/MT5 account and start in minutes.
            </p>
            <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-all hover:bg-slate-100"
              >
                Get started
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-6 py-3 text-sm font-medium text-slate-200 transition-all hover:border-cyan-500/50 hover:text-cyan-200"
              >
                View demo dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="px-4 py-16 sm:px-6 lg:px-8" id="contact">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold text-white">
            Get in touch
          </h2>
          <p className="mt-2 text-center text-slate-400">
            Questions or feedback? Drop us a line.
          </p>
          <form
            className="mt-8 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-medium text-slate-400"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-slate-400"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="message"
                className="block text-xs font-medium text-slate-400"
              >
                Message
              </label>
              <textarea
                id="message"
                rows={4}
                className="mt-1 w-full resize-none rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                placeholder="Your message..."
              />
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-black transition-all hover:opacity-90 sm:w-auto sm:px-6"
            >
              <Send className="h-4 w-4" />
              Send message
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} RiskSent. Trading risk dashboard.
          </p>
          <div className="flex gap-6 text-xs text-slate-500">
            <Link href="/login" className="hover:text-cyan-400 transition-colors">
              Log in
            </Link>
            <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
