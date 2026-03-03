import Link from "next/link";
import {
  LayoutDashboard,
  TrendingUp,
  ShieldAlert,
  FlaskConical,
  Bot,
  PlusCircle,
  CreditCard,
  User,
  Shield,
  Activity,
  Send,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trades", label: "Trades", icon: TrendingUp },
  { href: "/orders", label: "Orders", icon: Send },
  { href: "/rules", label: "Rules and Alerts", icon: ShieldAlert },
  { href: "/simulator", label: "Simulator", icon: FlaskConical },
  { href: "/ai-coach", label: "AI Coach", icon: Bot },
] as const;

const secondaryItems = [
  { href: "/accounts", label: "Manage Accounts", icon: CreditCard },
  { href: "/add-account", label: "Add Account", icon: PlusCircle },
] as const;

const adminNavItems = [
  { href: "/admin", label: "Admin", icon: Shield },
  { href: "/admin/live-monitoring", label: "Live Monitoring", icon: Activity },
] as const;

export function Sidebar({ variant = "default" }: { variant?: "default" | "admin" }) {
  if (variant === "admin") {
    return (
      <aside className="hidden lg:flex flex-col w-56 border-r border-slate-800/60 bg-slate-950/40 px-4 py-6">
        <span className="uppercase tracking-wider text-[11px] text-slate-500 mb-4 font-medium">
          Admin
        </span>
        <nav className="flex flex-col gap-1">
          {adminNavItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition-colors"
            >
              <Icon className="h-4 w-4 flex-shrink-0 text-slate-500" />
              <span className="uppercase tracking-wide">{label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    );
  }

  return (
    <aside className="hidden lg:flex flex-col w-56 border-r border-slate-800/60 bg-slate-950/40 px-4 py-6">
      <span className="uppercase tracking-wider text-[11px] text-slate-500 mb-4 font-medium">
        Menu
      </span>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition-colors"
          >
            <Icon className="h-4 w-4 flex-shrink-0 text-slate-500" />
            <span className="uppercase tracking-wide">{label}</span>
          </Link>
        ))}
        <div className="mt-6 pt-4 border-t border-slate-800/60">
          <span className="uppercase tracking-wider text-[11px] text-slate-600 mb-3 block font-medium">
            Account
          </span>
          {secondaryItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition-colors"
            >
              <Icon className="h-4 w-4 flex-shrink-0 text-slate-500" />
              <span className="uppercase tracking-wide">{label}</span>
            </Link>
          ))}
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition-colors"
          >
            <User className="h-4 w-4 flex-shrink-0 text-slate-500" />
            <span className="uppercase tracking-wide">Profile</span>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
