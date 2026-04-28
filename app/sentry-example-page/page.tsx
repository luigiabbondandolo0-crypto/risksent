"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

export default function SentryExamplePage() {
  const [log, setLog] = useState<string[]>([]);
  const [throwRender, setThrowRender] = useState(false);

  const add = (msg: string) => setLog((p) => [...p, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  if (throwRender) throw new Error("Sentry render error — triggers error.tsx boundary");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#080810] p-6 text-center">
      <h1 className="text-2xl font-bold text-white">Sentry Test</h1>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm text-slate-300 hover:bg-white/10"
          onClick={() => {
            try {
              throw new Error("Sentry client test error");
            } catch (e) {
              Sentry.captureException(e);
              add("Client error sent to Sentry ✓");
            }
          }}
        >
          Trigger client error
        </button>
        <button
          className="rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-2 text-sm text-red-300 hover:bg-red-500/10"
          onClick={() => setThrowRender(true)}
        >
          Trigger render error (error.tsx)
        </button>
        <button
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm text-slate-300 hover:bg-white/10"
          onClick={async () => {
            add("Calling server...");
            const res = await fetch("/api/sentry-example-api");
            add(`Server responded: ${res.status} ${res.ok ? "OK" : "ERROR — check Sentry Issues"}`);
          }}
        >
          Trigger server error
        </button>
        <button
          className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 px-5 py-2 text-sm text-indigo-300 hover:bg-indigo-500/10"
          onClick={() => {
            Sentry.captureMessage("Sentry manual test — setup OK", "info");
            add("Test event sent ✓ — check Sentry Issues");
          }}
        >
          Send test event
        </button>
      </div>
      {log.length > 0 && (
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-4 text-left">
          {log.map((l, i) => (
            <p key={i} className="font-mono text-xs text-slate-400">{l}</p>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-600">Remove this page before going live.</p>
    </div>
  );
}
