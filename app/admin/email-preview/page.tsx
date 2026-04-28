"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Mail, RefreshCw, ExternalLink, ChevronRight, Send, CheckCircle2, Loader2 } from "lucide-react";

type EmailType =
  | "onboarding-mastermail"
  | "marketing-drip-1"
  | "marketing-drip-6"
  | "marketing-drip-10"
  | "weekly-insight-1"
  | "weekly-insight-2"
  | "weekly-insight-3"
  | "weekly-insight-4"
  | "marketing"
  | "promo";

const EMAIL_TYPES: Array<{ id: EmailType; label: string; badge: string; color: string; group?: string }> = [
  { id: "onboarding-mastermail", label: "Onboarding mastermail", badge: "Once", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25", group: "Onboarding" },
  { id: "marketing-drip-1", label: "Drip — Day 1 (Dashboard)", badge: "D+1", color: "text-violet-400 bg-violet-500/10 border-violet-500/25", group: "Marketing drip" },
  { id: "marketing-drip-6", label: "Drip — Day 6 (AI Coach)", badge: "D+6", color: "text-violet-400 bg-violet-500/10 border-violet-500/25", group: "Marketing drip" },
  { id: "marketing-drip-10", label: "Drip — Day 10 (Affiliate)", badge: "D+10", color: "text-violet-400 bg-violet-500/10 border-violet-500/25", group: "Marketing drip" },
  { id: "weekly-insight-1", label: "Weekly #1 — Daily loss", badge: "W1", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25", group: "Weekly insight" },
  { id: "weekly-insight-2", label: "Weekly #2 — FTMO", badge: "W2", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25", group: "Weekly insight" },
  { id: "weekly-insight-3", label: "Weekly #3 — Hidden pattern", badge: "W3", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25", group: "Weekly insight" },
  { id: "weekly-insight-4", label: "Weekly #4 — Journal habit", badge: "W4", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25", group: "Weekly insight" },
  { id: "marketing", label: "Marketing broadcast", badge: "Broadcast", color: "text-slate-400 bg-slate-500/10 border-slate-500/25", group: "Other" },
  { id: "promo", label: "Promotional offer", badge: "Promo", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25", group: "Other" },
];

type SendState = "idle" | "sending" | "done" | "error";

export default function EmailPreviewPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<EmailType>("onboarding-mastermail");
  const [iframeKey, setIframeKey] = useState(0);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  // Send-test state
  const [testEmail, setTestEmail] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendMode, setSendMode] = useState<"current" | "all">("current");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/check-role");
      if (!res.ok) { router.push("/admin"); return; }
      const data = await res.json();
      if (!data.isAdmin) { router.push("/admin"); return; }
      setIsAdmin(true);
    })();
  }, [router]);

  const handleSendTest = async () => {
    if (!testEmail.trim() || sendState === "sending") return;
    setSendState("sending");
    setSendResult(null);
    setSendError(null);
    try {
      const res = await fetch("/api/admin/email/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testEmail.trim(),
          types: sendMode === "current" ? [selected] : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error ?? `Error ${res.status}`);
        setSendState("error");
        return;
      }
      setSendResult({ sent: data.sent, failed: data.failed });
      setSendState("done");
      setTimeout(() => setSendState("idle"), 5000);
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Request failed");
      setSendState("error");
    }
  };

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
        <p className="text-sm text-slate-400">Access denied.</p>
      </div>
    );
  }

  const previewUrl = `/api/admin/email/preview?type=${selected}`;

  return (
    <div className="space-y-6 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl font-bold text-white">
            <Mail className="h-6 w-6 text-indigo-400" />
            Email Preview
          </h1>
          <p className="mt-1 font-mono text-sm text-slate-500">
            Visual preview + send test emails.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
            {(["desktop", "mobile"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === m ? "bg-indigo-600/50 text-white" : "text-slate-400 hover:text-slate-300"
                }`}
              >
                {m === "desktop" ? "Desktop" : "Mobile"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIframeKey((k) => k + 1)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload
          </button>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open raw
          </a>
        </div>
      </header>

      {/* Send test panel */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <p className="mb-3 text-sm font-semibold text-white">Send test email</p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-64 rounded-xl border border-white/[0.1] bg-[#0e0e12] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500/50"
          />
          <div className="flex rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
            {(["current", "all"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSendMode(m)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  sendMode === m ? "bg-indigo-600/50 text-white" : "text-slate-400 hover:text-slate-300"
                }`}
              >
                {m === "current" ? "This email" : `All ${EMAIL_TYPES.length}`}
              </button>
            ))}
          </div>
          <button
            onClick={handleSendTest}
            disabled={!testEmail.trim() || sendState === "sending"}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600/20 px-4 py-2 text-sm font-semibold text-indigo-200 transition-colors hover:bg-indigo-600/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sendState === "sending" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : sendState === "done" ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {sendState === "sending" ? "Sending…" : sendState === "done" ? "Sent!" : "Send"}
          </button>
        </div>
        {sendState === "done" && sendResult && (
          <p className="mt-2 font-mono text-xs text-emerald-400">
            {sendResult.sent} sent{sendResult.failed > 0 ? `, ${sendResult.failed} failed` : ""}
          </p>
        )}
        {sendState === "error" && sendError && (
          <p className="mt-2 font-mono text-xs text-red-400">{sendError}</p>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <nav className="w-56 shrink-0 space-y-1">
          {EMAIL_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                selected === t.id
                  ? "border-indigo-500/40 bg-indigo-600/15 text-white"
                  : "border-transparent text-slate-400 hover:border-white/[0.06] hover:bg-white/[0.03] hover:text-slate-300"
              }`}
            >
              <span className="font-medium leading-tight">{t.label}</span>
              <span className="flex items-center gap-1">
                <span className={`rounded-full border px-1.5 py-px font-mono text-[10px] font-semibold ${t.color}`}>
                  {t.badge}
                </span>
                {selected === t.id && <ChevronRight className="h-3 w-3 text-indigo-400" />}
              </span>
            </button>
          ))}
        </nav>

        {/* Preview pane */}
        <div className="flex-1 min-w-0">
          <div
            className={`overflow-hidden rounded-2xl border border-white/[0.08] bg-[#070710] transition-all ${
              viewMode === "mobile" ? "mx-auto max-w-[390px]" : "w-full"
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
              </div>
              <span className="font-mono text-[10px] text-slate-600">{previewUrl}</span>
              <span />
            </div>
            <iframe
              key={iframeKey}
              src={previewUrl}
              title={`Email preview: ${selected}`}
              className="w-full border-0"
              style={{ height: viewMode === "mobile" ? "700px" : "780px" }}
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
