"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Database,
  CreditCard,
  MessageSquare,
  BarChart2,
  Clock,
} from "lucide-react";

type ServiceStatus = "operational" | "degraded" | "down" | "loading";

interface ServiceResult {
  name: string;
  status: ServiceStatus;
  ms: number | null;
  checkedAt: string | null;
}

const SERVICES = [
  { key: "supabase", name: "Database", icon: Database, endpoint: "/api/health/supabase" },
  { key: "stripe", name: "Payments", icon: CreditCard, endpoint: "/api/health/stripe" },
  { key: "telegram", name: "Telegram Alerts", icon: MessageSquare, endpoint: "/api/health/telegram" },
  { key: "twelvedata", name: "Market Data", icon: BarChart2, endpoint: "/api/health/twelvedata" },
];

const REFRESH_INTERVAL = 30;

function latencyToStatus(ok: boolean, ms: number): ServiceStatus {
  if (!ok) return "down";
  if (ms > 2000) return "degraded";
  return "operational";
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  const config = {
    operational: { label: "Operational", color: "#00e676", bg: "rgba(0,230,118,0.08)", icon: CheckCircle2 },
    degraded: { label: "Degraded", color: "#ff8c00", bg: "rgba(255,140,0,0.08)", icon: AlertCircle },
    down: { label: "Down", color: "#ff3c3c", bg: "rgba(255,60,60,0.08)", icon: XCircle },
    loading: { label: "Checking…", color: "#64748b", bg: "rgba(100,116,139,0.08)", icon: RefreshCw },
  }[status];
  const Icon = config.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ color: config.color, background: config.bg }}
    >
      <Icon className={`h-3 w-3 ${status === "loading" ? "animate-spin" : ""}`} />
      {config.label}
    </span>
  );
}

function OverallBanner({ services }: { services: ServiceResult[] }) {
  const loading = services.some(s => s.status === "loading");
  const anyDown = services.some(s => s.status === "down");
  const anyDegraded = services.some(s => s.status === "degraded");

  if (loading) return null;

  if (anyDown) {
    return (
      <div
        className="rounded-xl border px-5 py-4 text-center"
        style={{ borderColor: "rgba(255,60,60,0.25)", background: "rgba(255,60,60,0.06)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "#ff3c3c" }}>
          Some services are experiencing issues
        </p>
      </div>
    );
  }
  if (anyDegraded) {
    return (
      <div
        className="rounded-xl border px-5 py-4 text-center"
        style={{ borderColor: "rgba(255,140,0,0.25)", background: "rgba(255,140,0,0.06)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "#ff8c00" }}>
          Some services are running slower than usual
        </p>
      </div>
    );
  }
  return (
    <div
      className="rounded-xl border px-5 py-4 text-center"
      style={{ borderColor: "rgba(0,230,118,0.2)", background: "rgba(0,230,118,0.05)" }}
    >
      <p className="text-sm font-semibold" style={{ color: "#00e676" }}>
        All systems operational
      </p>
    </div>
  );
}

export default function StatusPage() {
  const [services, setServices] = useState<ServiceResult[]>(
    SERVICES.map(s => ({ name: s.name, status: "loading" as ServiceStatus, ms: null, checkedAt: null }))
  );
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    setServices(SERVICES.map(s => ({ name: s.name, status: "loading", ms: null, checkedAt: null })));
    const results = await Promise.all(
      SERVICES.map(async (svc, i) => {
        try {
          const res = await fetch(svc.endpoint);
          const data = await res.json();
          return {
            name: svc.name,
            status: latencyToStatus(data.ok, data.ms ?? 9999),
            ms: data.ms ?? null,
            checkedAt: data.checkedAt ?? null,
          };
        } catch {
          return { name: SERVICES[i].name, status: "down" as ServiceStatus, ms: null, checkedAt: new Date().toISOString() };
        }
      })
    );
    setServices(results);
    setLastRefresh(new Date());
    setCountdown(REFRESH_INTERVAL);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchAll();
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return (
    <div
      className="min-h-screen px-4 py-16 sm:px-6 lg:px-8"
      style={{ background: "#080809" }}
    >
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10 text-center"
        >
          <h1 className="mb-2 text-3xl font-black tracking-tight text-white">
            System Status
          </h1>
          <p className="text-sm text-slate-500">
            Real-time health of all RiskSent services
          </p>
        </motion.div>

        {/* Overall banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="mb-6"
        >
          <OverallBanner services={services} />
        </motion.div>

        {/* Service cards */}
        <div className="flex flex-col gap-3">
          {SERVICES.map((svc, i) => {
            const result = services[i];
            const Icon = svc.icon;
            return (
              <motion.div
                key={svc.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06, duration: 0.35 }}
                className="flex items-center justify-between rounded-xl border px-5 py-4"
                style={{
                  borderColor: "rgba(255,255,255,0.07)",
                  background: "rgba(14,14,18,0.85)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <Icon className="h-4 w-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{svc.name}</p>
                    {result.ms != null && (
                      <p className="text-xs text-slate-600">{result.ms}ms response</p>
                    )}
                  </div>
                </div>
                <StatusBadge status={result.status} />
              </motion.div>
            );
          })}
        </div>

        {/* Footer: last check + auto-refresh */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-6 flex items-center justify-between text-xs text-slate-600"
        >
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {lastRefresh
              ? `Last checked ${lastRefresh.toLocaleTimeString()}`
              : "Checking…"}
          </span>
          <button
            onClick={fetchAll}
            className="flex items-center gap-1.5 transition-colors hover:text-slate-400"
          >
            <RefreshCw className="h-3 w-3" />
            Auto-refresh in {countdown}s
          </button>
        </motion.div>

        {/* Incident history placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="mt-10 rounded-xl border px-5 py-6"
          style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(14,14,18,0.6)" }}
        >
          <h2 className="mb-4 text-sm font-semibold text-slate-300">Incident History</h2>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#00e676" }} />
            No incidents in the last 90 days
          </div>
        </motion.div>
      </div>
    </div>
  );
}
