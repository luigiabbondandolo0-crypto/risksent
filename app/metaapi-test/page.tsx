"use client";

import { useState } from "react";

type LogEntry = {
  ts: string;
  level: "info" | "warn" | "error";
  message: string;
  data?: unknown;
};

export default function MetaApiTestPage() {
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
      const res = await fetch("/api/metaapi-test");
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
          MetaApi connection test
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Test the MetaApi provisioning API using METATRADER_API_KEY from Vercel.
          Logs are shown below.
        </p>
      </header>

      <div className="rounded-xl border border-slate-800 bg-surface p-6">
        <button
          onClick={runTest}
          disabled={loading}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Testing..." : "Run MetaApi test"}
        </button>

        {result && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${
                  result.ok ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {result.ok ? "SUCCESS" : "FAILED"}
              </span>
              {result.status && (
                <span className="text-xs text-slate-500">
                  HTTP {result.status}
                </span>
              )}
            </div>
            {result.error && (
              <p className="text-sm text-red-400">{result.error}</p>
            )}
            {result.body && (
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
                Click &quot;Run MetaApi test&quot; to see logs.
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
                  {log.data && (
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
