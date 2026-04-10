import Link from "next/link";
import {
  LayoutDashboard,
  TrendingUp,
  ShieldAlert,
  FlaskConical,
  ArrowRight,
} from "lucide-react";

const cards = [
  { href: "/mock/dashboard", title: "Dashboard", desc: "Overview completa del conto e KPI.", icon: LayoutDashboard },
  { href: "/mock/simulator", title: "Backtesting", desc: "Esperienza stile FX Replay: replay e scenari.", icon: FlaskConical },
  { href: "/mock/trades", title: "Journal", desc: "Trading journal completo in stile TradeZella.", icon: TrendingUp },
  { href: "/mock/rules", title: "Risk Sentinel", desc: "Live monitoring e live alerts sul rischio.", icon: ShieldAlert },
] as const;

export default function MockHubPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="rs-page-title">Mock preview</h1>
        <p className="rs-page-sub">
          Versione demo con le stesse 4 sezioni della live: Dashboard, Backtesting, Journal e Risk Sentinel.
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
