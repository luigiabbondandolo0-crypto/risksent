"use client";

import { useState } from "react";

type LogEntry = {
  ts: string;
  level: "info" | "warn" | "error";
  message: string;
  data?: unknown;
};

const DEFAULT_UUID = "a1760671-c360-4204-ae53-0589af9e9ae4";

export default function MetatraderApiTestPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<{
    ok: boolean;
    status?: number;
    body?: unknown;
    error?: string;
  } | null>(null);

  const runTest = async () => {
    setLoading(true);
    setLogs([]);
    setResult(null);

    try {
      const res = await fetch("/api/metatraderapi-test");
      const data = await res.json();

      setLogs(data.logs ?? []);
      setResult({
        ok: data.ok,
        status: data.status,
        body: data.body,
        error: data.error
      });
    } catch (err) {
      setLogs([
        {
          ts: new Date().toISOString(),
          level: "error",
          message: "Client fetch failed",
          data: { error: err instanceof Error ? err.message : String(err) }
        }
      ]);
      setResult({ ok: false, error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-50">
          MetatraderApi.dev connection test
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Single Account Plan: <code className="text-slate-400">x-api-key</code>{" "}
          + <code className="text-slate-400">id</code> (account UUID). Set{" "}
          <code className="text-slate-400">METATRADERAPI_API_KEY</code> and{" "}
          <code className="text-slate-400">METATRADERAPI_UUID</code> in Vercel.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Your account UUID: <code className="text-emerald-400/80">{DEFAULT_UUID}</code>
        </p>
      </header>

      <div className="rounded-xl border border-slate-800 bg-surface p-6">
        <button
          onClick={runTest}
          disabled={loading}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Testing..." : "Run MetatraderApi.dev test"}
        </button>

        {result != null && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${
                  result.ok ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {result.ok ? "SUCCESS" : "FAILED"}
              </span>
              {result.status != null && (
                <span className="text-xs text-slate-500">
                  HTTP {result.status}
                </span>
              )}
            </div>
            {result.error != null && (
              <p className="text-sm text-red-400">{result.error}</p>
            )}
            {result.body != null && (
              <pre className="overflow-auto rounded-md border border-slate-800 bg-black/40 p-4 text-xs text-slate-300 max-h-64">
                {JSON.stringify(result.body, null, 2)}
              </pre>
            )}
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-sm font-medium text-slate-300 mb-2">
            Detailed logs
          </h2>
          <div className="rounded-md border border-slate-800 bg-black/40 p-4 font-mono text-xs max-h-96 overflow-auto space-y-2">
            {logs.length === 0 ? (
              <p className="text-slate-500">
                Click &quot;Run MetatraderApi.dev test&quot; to see logs.
              </p>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className={`${
                    log.level === "error"
                      ? "text-red-400"
                      : log.level === "warn"
                        ? "text-amber-400"
                        : "text-slate-300"
                  }`}
                >
                  <span className="text-slate-500">
                    [{log.ts}] [{log.level}]
                  </span>{" "}
                  {log.message}
                  {log.data != null && (
                    <pre className="mt-1 text-amber-100/80 overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
