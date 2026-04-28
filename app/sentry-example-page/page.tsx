"use client";

import * as Sentry from "@sentry/nextjs";

export default function SentryExamplePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#080810] p-6 text-center">
      <h1 className="text-2xl font-bold text-white">Sentry Test</h1>
      <div className="flex gap-3">
        <button
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm text-slate-300 hover:bg-white/10"
          onClick={() => {
            throw new Error("Sentry client test error");
          }}
        >
          Trigger client error
        </button>
        <button
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm text-slate-300 hover:bg-white/10"
          onClick={async () => {
            await fetch("/api/sentry-example-api");
          }}
        >
          Trigger server error
        </button>
        <button
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm text-slate-300 hover:bg-white/10"
          onClick={() => {
            Sentry.captureMessage("Sentry manual test — setup OK", "info");
            alert("Sent to Sentry — check Issues dashboard");
          }}
        >
          Send test event
        </button>
      </div>
      <p className="text-xs text-slate-600">Remove this page before going live.</p>
    </div>
  );
}
