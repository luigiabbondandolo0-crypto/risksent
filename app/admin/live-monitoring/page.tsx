"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Activity, AlertCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type StatusRes = {
  ok: boolean;
  timestamp: string;
  logs: Array<{ time: string; source: string; ok: boolean; message: string; detail?: string }>;
  summary: { supabase: string; metaapi: string };
};

type LiveCheckRes = {
  ok: boolean;
  error?: string;
  timestamp: string;
  uuid: string;
  connection: {
    accountSummary: { ok: boolean; status?: number; error?: string };
    closedOrders: { ok: boolean; status?: number; error?: string };
    openOrders: { ok: boolean; status?: number; error?: string };
  };
  humanSummary: string;
  humanEvents: LiveEvent[];
  technical: unknown;
};

type LiveEvent = {
  title: string;
  human: string;
  technical: string;
};

const STATUS_POLL_MS = 10_000;

export default function AdminLiveMonitoringPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [status, setStatus] = useState<StatusRes | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [liveCheck, setLiveCheck] = useState<LiveCheckRes | null>(null);
  const [liveCheckLoading, setLiveCheckLoading] = useState(false);
  const [liveCheckError, setLiveCheckError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login?redirectedFrom=/admin/live-monitoring");
        return;
      }

      const res = await fetch("/api/admin/check-role");
      if (res.ok) {
        const data = await res.json();
        if (!data.isAdmin) {
          router.push("/dashboard");
          return;
        }
        setIsAdmin(true);
      } else {
        router.push("/dashboard");
      }
    };
    checkAdmin();
  }, [router]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/monitoring/status");
      const data = await res.json();
      if (res.ok) setStatus(data);
      else setStatus({ ok: false, timestamp: new Date().toISOString(), logs: [], summary: { supabase: "error", metaapi: "error" } });
    } catch {
      setStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin === null) return;
    fetchStatus();
    const id = setInterval(fetchStatus, STATUS_POLL_MS);
    return () => clearInterval(id);
  }, [fetchStatus, isAdmin]);

  const runLiveCheck = async () => {
    setLiveCheckLoading(true);
    setLiveCheckError(null);
    setLiveCheck(null);
    try {
      const res = await fetch("/api/monitoring/live-check");
      const data = await res.json();
      if (!res.ok) {
        setLiveCheckError(data.error ?? data.detail ?? res.statusText);
        return;
      }
      setLiveCheck(data);
    } catch (e) {
      setLiveCheckError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLiveCheckLoading(false);
    }
  };

  const copyTechnical = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-slate-500">Checking permissions...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-slate-50 flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          Admin Live Monitoring
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Admin-only monitoring dashboard for connection status and live risk-check data.
        </p>
      </header>

      <div className="rounded-xl border border-slate-800 bg-surface p-6">
        <h2 className="text-lg font-semibold text-slate-50 mb-4">Connection Status</h2>
        {statusLoading ? (
          <p className="text-slate-500">Loading...</p>
        ) : status ? (
          <div className="space-y-3">
            <div className="text-xs text-slate-400">
              Auto-refresh every 10s. Last: {new Date(status.timestamp).toLocaleString()}
            </div>
            <div className="text-sm">
              <span className="text-slate-300">Supabase: </span>
              <span className={status.summary.supabase === "connected" ? "text-emerald-400" : "text-red-400"}>
                {status.summary.supabase}
              </span>
              {" "}
              <span className="text-slate-300">MetaAPI: </span>
              <span className={status.summary.metaapi === "connected" ? "text-emerald-400" : "text-red-400"}>
                {status.summary.metaapi}
              </span>
            </div>
            <div className="space-y-1 text-xs font-mono">
              {status.logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-slate-500">{log.time}</span>
                  <span className={log.ok ? "text-emerald-400" : "text-red-400"}>
                    {log.ok ? "OK" : "FAIL"}
                  </span>
                  <span className="text-slate-300">{log.source}</span>
                  <span className="text-slate-400">{log.message}</span>
                  {log.detail && <span className="text-slate-500">({log.detail})</span>}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-slate-500">Failed to load status</p>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-surface p-6">
        <h2 className="text-lg font-semibold text-slate-50 mb-4">What We Track (Live Check)</h2>
        <p className="text-xs text-slate-400 mb-4">
          Runs the same logic as the cron/check-risk: AccountSummary, ClosedOrders, OpenOrders, then risk findings. No alerts or Telegram are sent.
        </p>
        <button
          onClick={runLiveCheck}
          disabled={liveCheckLoading}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {liveCheckLoading ? "Running..." : "Run live check"}
        </button>

        {liveCheckError && (
          <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-sm text-red-400">{liveCheckError}</p>
          </div>
        )}

        {liveCheck && (
          <div className="mt-6 space-y-4">
            <div className="rounded-md border border-slate-800 bg-black/40 p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Summary</h3>
              <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono">
                {liveCheck.humanSummary}
              </pre>
            </div>

            <div className="space-y-3">
              {liveCheck.humanEvents.map((event, i) => (
                <div key={i} className="rounded-md border border-slate-800 bg-black/40 p-4">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">{event.title}</h3>
                  <p className="text-xs text-slate-400 mb-2">{event.human}</p>
                  <details className="mt-2">
                    <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                      Technical details
                    </summary>
                    <div className="mt-2 flex items-start gap-2">
                      <pre className="flex-1 text-xs text-slate-500 font-mono overflow-x-auto">
                        {event.technical}
                      </pre>
                      <button
                        onClick={() => copyTechnical(event.technical)}
                        className="text-xs text-slate-400 hover:text-slate-300"
                      >
                        Copy
                      </button>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
