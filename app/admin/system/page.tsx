"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  Database,
  CreditCard,
  TrendingUp,
  MessageCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";

type HealthResult = {
  ok: boolean;
  ms: number;
  checkedAt: string;
};

type ServiceHealth = {
  name: string;
  key: string;
  endpoint: string;
  icon: React.ComponentType<{ className?: string }>;
  result: HealthResult | null;
  loading: boolean;
};

function statusColor(h: HealthResult | null, loading: boolean) {
  if (loading) return "bg-slate-500";
  if (!h) return "bg-slate-600";
  if (!h.ok) return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
  if (h.ms > 1000) return "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]";
  return "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]";
}

function statusLabel(h: HealthResult | null, loading: boolean) {
  if (loading) return "Checking…";
  if (!h) return "Not checked";
  if (!h.ok) return "Error";
  if (h.ms > 1000) return "Slow";
  return "Operational";
}

const SERVICES = [
  { name: "Supabase", key: "supabase", endpoint: "/api/health/supabase", icon: Database },
  { name: "Stripe", key: "stripe", endpoint: "/api/health/stripe", icon: CreditCard },
  { name: "Twelve Data", key: "twelvedata", endpoint: "/api/health/twelvedata", icon: TrendingUp },
  { name: "Telegram", key: "telegram", endpoint: "/api/health/telegram", icon: MessageCircle },
] as const;

export default function SystemPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [services, setServices] = useState<ServiceHealth[]>(
    SERVICES.map((s) => ({ ...s, result: null, loading: false }))
  );

  useEffect(() => {
    fetch("/api/admin/check-role")
      .then((r) => r.json())
      .then((d: { isAdmin: boolean }) => {
        if (!d.isAdmin) { setIsAdmin(false); router.push("/app/dashboard"); }
        else setIsAdmin(true);
      })
      .catch(() => setIsAdmin(false));
  }, [router]);

  const checkService = useCallback(async (key: string) => {
    setServices((prev) =>
      prev.map((s) => (s.key === key ? { ...s, loading: true } : s))
    );
    const svc = SERVICES.find((s) => s.key === key)!;
    try {
      const res = await fetch(svc.endpoint);
      const data = await res.json() as HealthResult;
      setServices((prev) =>
        prev.map((s) => (s.key === key ? { ...s, result: data, loading: false } : s))
      );
    } catch {
      setServices((prev) =>
        prev.map((s) =>
          s.key === key
            ? { ...s, result: { ok: false, ms: 0, checkedAt: new Date().toISOString() }, loading: false }
            : s
        )
      );
    }
  }, []);

  const checkAll = useCallback(async () => {
    await Promise.all(SERVICES.map((s) => checkService(s.key)));
  }, [checkService]);

  useEffect(() => {
    if (isAdmin === true) void checkAll();
  }, [isAdmin, checkAll]);

  if (isAdmin === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="font-mono text-sm text-slate-500">Loading…</p>
      </div>
    );
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
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl font-bold text-white">
            <Activity className="h-6 w-6 text-amber-400" />
            System Health
          </h1>
          <p className="mt-1 text-sm font-mono text-slate-500">
            Monitor API integrations and service status in real-time.
          </p>
        </div>
        <button
          onClick={() => void checkAll()}
          className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-200 transition-all hover:border-slate-600 hover:bg-white/[0.06]"
        >
          <RefreshCw className="h-4 w-4" />
          Check all
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((svc, i) => {
          const Icon = svc.icon;
          const dotClass = statusColor(svc.result, svc.loading);
          const label = statusLabel(svc.result, svc.loading);

          return (
            <motion.div
              key={svc.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-white">{svc.name}</span>
                </div>
                <span className={`h-2.5 w-2.5 rounded-full transition-all ${dotClass} ${svc.loading ? "animate-pulse" : ""}`} />
              </div>

              <div>
                <p className={`text-lg font-semibold font-mono ${!svc.result ? "text-slate-500" : svc.result.ok ? "text-emerald-400" : "text-red-400"}`}>
                  {label}
                </p>
                {svc.result && (
                  <p className="mt-0.5 text-xs font-mono text-slate-500">
                    {svc.result.ms}ms · {new Date(svc.result.checkedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                {svc.result?.ok ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                ) : svc.result ? (
                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                ) : null}
                {svc.result ? (svc.result.ok ? "Connected" : "Unreachable") : "—"}
              </div>

              <button
                onClick={() => void checkService(svc.key)}
                disabled={svc.loading}
                className="mt-auto flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] py-2 text-xs font-medium text-slate-400 transition-all hover:border-white/20 hover:text-slate-200 disabled:opacity-40"
              >
                <RefreshCw className={`h-3 w-3 ${svc.loading ? "animate-spin" : ""}`} />
                {svc.loading ? "Checking…" : "Check now"}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white mb-4">
          Status summary
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((svc) => {
            const Icon = svc.icon;
            return (
              <div
                key={svc.key}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3"
              >
                <span className="flex items-center gap-2 text-sm text-slate-300">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${statusColor(svc.result, svc.loading)}`} />
                  <Icon className="h-3.5 w-3.5 text-slate-500" />
                  {svc.name}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {svc.result ? `${svc.result.ms}ms` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
