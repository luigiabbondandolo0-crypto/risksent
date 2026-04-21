import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  ShieldAlert,
  FlaskConical,
  Sparkles,
  CreditCard,
  ArrowRight,
} from "lucide-react";

const cards = [
  { href: "/mock/dashboard", title: "Dashboard", desc: "Complete account overview and KPI metrics.", icon: LayoutDashboard },
  { href: "/mock/backtesting", title: "Backtesting", desc: "FX Replay-style experience: replay and scenarios.", icon: FlaskConical },
  { href: "/mock/journaling", title: "Journal", desc: "Complete trading journal experience in TradeZella style.", icon: BookOpen },
  { href: "/mock/risk-manager", title: "Risk Manager", desc: "Live monitoring and live risk alerts.", icon: ShieldAlert },
  { href: "/mock/ai-coach", title: "AI Coach", desc: "Weekly performance report and coaching chat.", icon: Sparkles },
  { href: "/mock/billing", title: "Billing", desc: "Subscription plans and trial status (demo).", icon: CreditCard },
] as const;

export default function MockHubPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="rs-page-title">Mock preview</h1>
        <p className="rs-page-sub">
          Demo version with the same sections as live: Dashboard, Backtesting, Journal, Risk Manager, AI Coach, Billing.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ href, title, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="rs-card group flex flex-col p-5 shadow-rs-soft transition-colors hover:border-violet-500/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-500/25">
                <Icon className="h-5 w-5 text-violet-300" />
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-400" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-100">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
