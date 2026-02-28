"use client";

import { useEffect, useState, useCallback } from "react";

type StatusLog = {
  time: string;
  source: string;
  ok: boolean;
  message: string;
  detail?: string;
};

type StatusRes = {
  ok: boolean;
  timestamp: string;
  logs: StatusLog[];
  summary: { supabase: string; metaapi: string };
};

type LiveEvent = {
  title: string;
  human: string;
  technical: string;
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

const STATUS_POLL_MS = 10_000;

export default function LiveMonitoringPage() {
  const [status, setStatus] = useState<StatusRes | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [liveCheck, setLiveCheck] = useState<LiveCheckRes | null>(null);
  const [liveCheckLoading, setLiveCheckLoading] = useState(false);
  const [liveCheckError, setLiveCheckError] = useState<string | null>(null);

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
    fetchStatus();
    const id = setInterval(fetchStatus, STATUS_POLL_MS);
    return () => clearInterval(id);
  }, [fetchStatus]);

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

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-slate-50">Live monitoring</h1>
        <p className="text-sm text-slate-400 mt-1">
          Connection status and live risk-check data. Use this to verify API/DB and what the bot is tracking.
        </p>
      </header>

      {/* Connection status */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="text-sm font-medium text-slate-300 uppercase tracking-wide mb-3">Connection status</h2>
        <p className="text-xs text-slate-500 mb-3">
          Auto-refresh every {STATUS_POLL_MS / 1000}s. Last: {status?.timestamp ?? "—"}
        </p>
        {statusLoading && !status ? (
          <p className="text-slate-400">Loading…</p>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-4 text-sm">
              <span>
                Supabase: <span className={status?.summary?.supabase === "connected" ? "text-emerald-400" : "text-red-400"}>{status?.summary?.supabase ?? "—"}</span>
              </span>
              <span>
                MetaAPI: <span className={status?.summary?.metaapi === "connected" ? "text-emerald-400" : status?.summary?.metaapi === "no_key" ? "text-amber-400" : "text-red-400"}>{status?.summary?.metaapi ?? "—"}</span>
              </span>
            </div>
            <ul className="border border-slate-700 rounded-lg divide-y divide-slate-700 max-h-48 overflow-y-auto">
              {status?.logs?.map((log, i) => (
                <li key={i} className="px-3 py-2 text-xs font-mono flex flex-wrap items-center gap-2">
                  <span className="text-slate-500">{log.time}</span>
                  <span className="font-semibold text-slate-400">{log.source}</span>
                  <span className={log.ok ? "text-emerald-400" : "text-red-400"}>{log.ok ? "OK" : "FAIL"}</span>
                  <span className="text-slate-300">{log.message}</span>
                  {log.detail && <span className="text-slate-500 truncate max-w-md">{log.detail}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Live check */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="text-sm font-medium text-slate-300 uppercase tracking-wide mb-3">What we track (live check)</h2>
        <p className="text-xs text-slate-500 mb-3">
          Runs the same logic as the cron/check-risk: AccountSummary, ClosedOrders, OpenOrders, then risk findings. No alerts or Telegram are sent.
        </p>
        <button
          type="button"
          onClick={runLiveCheck}
          disabled={liveCheckLoading}
          className="rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white"
        >
          {liveCheckLoading ? "Running…" : "Run live check"}
        </button>
        {liveCheckError && <p className="mt-2 text-sm text-red-400">{liveCheckError}</p>}

        {liveCheck && (
          <div className="mt-6 space-y-6">
            <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
              <h3 className="text-xs font-medium text-slate-500 uppercase mb-2">Human summary</h3>
              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">{liveCheck.humanSummary}</pre>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-medium text-slate-500 uppercase">Events (human + technical)</h3>
              {liveCheck.humanEvents?.map((ev, i) => (
                <div key={i} className="rounded-lg border border-slate-700 bg-slate-950/50 overflow-hidden">
                  <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700 font-medium text-slate-300">
                    {ev.title}
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <span className="text-xs text-slate-500 uppercase">Human</span>
                      <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">{ev.human}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 uppercase">Technical (copy for bot setup)</span>
                        <button
                          type="button"
                          onClick={() => copyTechnical(ev.technical)}
                          className="text-xs text-cyan-400 hover:text-cyan-300"
                        >
                          Copy
                        </button>
                      </div>
                      <pre className="mt-1 text-xs text-slate-400 overflow-x-auto bg-slate-900/50 p-3 rounded border border-slate-800 max-h-40 overflow-y-auto">
                        {ev.technical}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
              <h3 className="text-xs font-medium text-slate-500 uppercase mb-2">Full technical payload (copy all)</h3>
              <button
                type="button"
                onClick={() => copyTechnical(JSON.stringify(liveCheck.technical, null, 2))}
                className="text-xs text-cyan-400 hover:text-cyan-300 mb-2"
              >
                Copy full JSON
              </button>
              <pre className="text-xs text-slate-400 overflow-x-auto bg-slate-900/50 p-3 rounded border border-slate-800 max-h-64 overflow-y-auto">
                {JSON.stringify(liveCheck.technical, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
