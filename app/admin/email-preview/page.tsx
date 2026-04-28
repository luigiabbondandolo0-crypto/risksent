"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Mail, RefreshCw, ExternalLink, ChevronRight } from "lucide-react";

type EmailType =
  | "marketing"
  | "promo"
  | "onboarding-1"
  | "onboarding-2"
  | "onboarding-3"
  | "weekly-insight";

const EMAIL_TYPES: Array<{ id: EmailType; label: string; badge: string; color: string }> = [
  { id: "marketing", label: "Marketing broadcast", badge: "Broadcast", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25" },
  { id: "promo", label: "Promotional offer", badge: "Promo", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25" },
  { id: "onboarding-1", label: "Onboarding tip — Day 1", badge: "D+1", color: "text-violet-400 bg-violet-500/10 border-violet-500/25" },
  { id: "onboarding-2", label: "Onboarding tip — Day 3", badge: "D+3", color: "text-violet-400 bg-violet-500/10 border-violet-500/25" },
  { id: "onboarding-3", label: "Onboarding tip — Day 7", badge: "D+7", color: "text-violet-400 bg-violet-500/10 border-violet-500/25" },
  { id: "weekly-insight", label: "Weekly insight", badge: "Newsletter", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" },
];

export default function EmailPreviewPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<EmailType>("marketing");
  const [iframeKey, setIframeKey] = useState(0);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/check-role");
      if (!res.ok) { router.push("/admin"); return; }
      const data = await res.json();
      if (!data.isAdmin) { router.push("/admin"); return; }
      setIsAdmin(true);
    })();
  }, [router]);

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
            Visual preview of all automated email templates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
            {(["desktop", "mobile"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === m
                    ? "bg-indigo-600/50 text-white"
                    : "text-slate-400 hover:text-slate-300"
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
                <span
                  className={`rounded-full border px-1.5 py-px font-mono text-[10px] font-semibold ${t.color}`}
                >
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
