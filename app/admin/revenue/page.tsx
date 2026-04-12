"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  DollarSign,
  AlertCircle,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";

type SubRow = {
  id: string;
  user_id: string;
  user_email: string;
  plan: "free" | "new_trader" | "experienced";
  status: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string | null;
};

const PLAN_PRICES: Record<string, number> = { free: 0, new_trader: 25, experienced: 39 };
const PLAN_LABELS: Record<string, string> = { free: "Free", new_trader: "New Trader", experienced: "Experienced" };
const PLAN_COLORS: Record<string, string> = {
  free: "text-slate-400 bg-slate-500/15 border-slate-500/30",
  new_trader: "text-cyan-300 bg-cyan-500/15 border-cyan-500/30",
  experienced: "text-amber-300 bg-amber-500/15 border-amber-500/30",
};
const STATUS_COLORS: Record<string, string> = {
  active: "text-emerald-300 bg-emerald-500/15",
  trialing: "text-cyan-300 bg-cyan-500/15",
  past_due: "text-orange-300 bg-orange-500/15",
  canceled: "text-red-300 bg-red-500/15",
  incomplete: "text-slate-400 bg-slate-500/15",
};

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const dur = 700;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{prefix}{Math.round(display)}{suffix}</span>;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border px-3 py-2 text-xs font-mono" style={{ background: "rgba(12,12,14,0.95)", borderColor: "rgba(255,255,255,0.1)" }}>
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-white">€{p.value} {p.name}</p>
      ))}
    </div>
  );
};

export default function RevenuePage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubRow[]>([]);
  const [mrr, setMrr] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [churnRate, setChurnRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/check-role")
      .then((r) => r.json())
      .then((d: { isAdmin: boolean }) => {
        if (!d.isAdmin) { setIsAdmin(false); router.push("/app/dashboard"); }
        else { setIsAdmin(true); void fetchData(); }
      })
      .catch(() => setIsAdmin(false));
  }, [router]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subscriptions");
      const d = await res.json() as { subscriptions: SubRow[]; mrr: number; activeCount: number; churnRate: number };
      setSubscriptions(d.subscriptions ?? []);
      setMrr(d.mrr ?? 0);
      setActiveCount(d.activeCount ?? 0);
      setChurnRate(d.churnRate ?? 0);
    } finally {
      setLoading(false);
    }
  }

  // Build MRR trend by grouping subscriptions by month created
  const mrrTrend = useMemo(() => {
    const monthMap = new Map<string, number>();
    for (const s of subscriptions) {
      if (!s.created_at) continue;
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, (monthMap.get(key) ?? 0) + (PLAN_PRICES[s.plan] ?? 0));
    }
    const sorted = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    let cum = 0;
    return sorted.map(([month, val]) => {
      cum += val;
      return { month, mrr: cum };
    });
  }, [subscriptions]);

  // Plan distribution
  const planDist = useMemo(() => {
    const counts: Record<string, number> = { free: 0, new_trader: 0, experienced: 0 };
    for (const s of subscriptions) {
      counts[s.plan] = (counts[s.plan] ?? 0) + 1;
    }
    return [
      { name: "Free", count: counts.free ?? 0, fill: "rgba(148,163,184,0.6)" },
      { name: "New Trader", count: counts.new_trader ?? 0, fill: "rgba(34,211,238,0.6)" },
      { name: "Experienced", count: counts.experienced ?? 0, fill: "rgba(245,158,11,0.6)" },
    ];
  }, [subscriptions]);

  if (isAdmin === null) {
    return <div className="flex min-h-[40vh] items-center justify-center"><p className="font-mono text-sm text-slate-500">Loading…</p></div>;
  }
  if (!isAdmin) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
        <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-400" />
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-amber-200">Access denied</h2>
          <p className="mt-1 text-sm text-slate-400">This page is only for administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <header>
        <h1 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl font-bold text-white">
          <DollarSign className="h-6 w-6 text-amber-400" />
          Revenue
        </h1>
        <p className="mt-1 text-sm font-mono text-slate-500">Subscription metrics and revenue analytics.</p>
      </header>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "MRR", value: mrr, prefix: "€", icon: DollarSign, color: "text-emerald-400" },
          { label: "ARR", value: mrr * 12, prefix: "€", icon: TrendingUp, color: "text-cyan-400" },
          { label: "Active subscribers", value: activeCount, prefix: "", icon: Users, color: "text-amber-400" },
          { label: "Churn rate", value: churnRate, prefix: "", suffix: "%", icon: AlertCircle, color: "text-red-400" },
        ].map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
          >
            <div className="flex items-center gap-2 text-slate-500">
              <c.icon className="h-4 w-4" />
              <span className="text-[10px] font-mono uppercase tracking-wider">{c.label}</span>
            </div>
            <p className={`mt-3 font-[family-name:var(--font-display)] text-3xl font-bold ${c.color}`}>
              {loading ? "—" : <AnimatedNumber value={c.value} prefix={c.prefix} suffix={c.suffix} />}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
          <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-white mb-4">MRR trend</h2>
          {mrrTrend.length === 0 ? (
            <p className="text-center text-sm text-slate-500 font-mono py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={mrrTrend}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `€${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="mrr" name="MRR" stroke="#00e676" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
          <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-white mb-4">Plan distribution</h2>
          {planDist.every((p) => p.count === 0) ? (
            <p className="text-center text-sm text-slate-500 font-mono py-8">No subscribers yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={planDist}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Users" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Subscriptions table */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02]">
        <div className="p-5 border-b border-white/[0.06]">
          <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-white">Subscriptions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Next billing</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500 font-mono">Loading…</td></tr>
              ) : subscriptions.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500 font-mono">No subscriptions found.</td></tr>
              ) : (
                subscriptions.map((s) => (
                  <tr key={s.id} className="border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.03]">
                    <td className="max-w-[180px] truncate px-4 py-3 font-mono text-sm text-slate-300">{s.user_email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${PLAN_COLORS[s.plan] ?? ""}`}>
                        {PLAN_LABELS[s.plan] ?? s.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-mono ${STATUS_COLORS[s.status] ?? ""}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">€{PLAN_PRICES[s.plan] ?? 0}/mo</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
