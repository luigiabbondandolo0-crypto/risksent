"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Mail,
  MessageCircle,
  Sparkles,
  HelpCircle,
  CreditCard,
  Shield,
  ArrowRight,
  Send,
  CheckCircle2,
} from "lucide-react";

const TOPICS = [
  { id: "general", label: "General question", icon: HelpCircle },
  { id: "billing", label: "Billing & invoices", icon: CreditCard },
  { id: "technical", label: "Technical issue", icon: MessageCircle },
  { id: "security", label: "Security / data request", icon: Shield },
  { id: "feedback", label: "Feedback / feature request", icon: Sparkles },
];

export default function ContactPage() {
  const [topic, setTopic] = useState<string>("general");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not send. Try again.");
        return;
      }
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="relative w-full"
      style={{
        background:
          "radial-gradient(1200px 500px at 50% -10%, rgba(255,60,60,0.08), transparent 60%), #080809",
      }}
    >
      <div className="mx-auto max-w-5xl px-6 pb-24 pt-16 lg:px-8">
        {/* Header */}
        <header className="mb-12">
          <p className="mb-3 text-[11px] font-mono uppercase tracking-[0.18em] text-[#ff8c00]">
            Contact us
          </p>
          <h1
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Talk to the RiskSent team
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
            Tell us what you’re working on and what’s blocking you. We read
            every message and we reply — usually within one business day.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_minmax(0,320px)]">
          {/* Form */}
          <form
            onSubmit={(ev) => void onSubmit(ev)}
            className="rounded-3xl border p-6 sm:p-8"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            {/* Topic */}
            <fieldset>
              <legend className="mb-3 block text-[12px] font-mono font-semibold uppercase tracking-[0.14em] text-slate-400">
                What’s this about?
              </legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {TOPICS.map(({ id, label, icon: Icon }) => {
                  const active = topic === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTopic(id)}
                      className="group flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14px] transition-all"
                      style={{
                        borderColor: active
                          ? "rgba(255,140,0,0.5)"
                          : "rgba(255,255,255,0.08)",
                        background: active
                          ? "linear-gradient(135deg, rgba(255,60,60,0.08), rgba(255,140,0,0.06))"
                          : "rgba(255,255,255,0.02)",
                        color: active ? "#fff" : "rgb(148,163,184)",
                      }}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          active ? "text-[#ff8c00]" : "text-slate-500"
                        }`}
                      />
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Name + email */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-[12px] font-mono font-semibold uppercase tracking-[0.12em] text-slate-400"
                >
                  Your name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  className="w-full rounded-xl border bg-white/[0.02] px-4 py-2.5 text-[14px] text-white placeholder:text-slate-600 focus:border-[#ff8c00] focus:outline-none focus:ring-2 focus:ring-[#ff8c00]/30"
                  style={{ borderColor: "rgba(255,255,255,0.08)" }}
                  placeholder="Jane Trader"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-[12px] font-mono font-semibold uppercase tracking-[0.12em] text-slate-400"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border bg-white/[0.02] px-4 py-2.5 text-[14px] text-white placeholder:text-slate-600 focus:border-[#ff8c00] focus:outline-none focus:ring-2 focus:ring-[#ff8c00]/30"
                  style={{ borderColor: "rgba(255,255,255,0.08)" }}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Message */}
            <div className="mt-4">
              <label
                htmlFor="message"
                className="mb-1.5 block text-[12px] font-mono font-semibold uppercase tracking-[0.12em] text-slate-400"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                className="w-full resize-y rounded-xl border bg-white/[0.02] px-4 py-3 text-[14px] text-white placeholder:text-slate-600 focus:border-[#ff8c00] focus:outline-none focus:ring-2 focus:ring-[#ff8c00]/30"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}
                placeholder="What are you trying to do? What went wrong? The more context the better."
              />
            </div>

            {error ? (
              <p className="mt-4 text-[13px] text-red-400" role="alert">
                {error}
              </p>
            ) : null}

            {/* Submit */}
            <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] text-slate-500">
                By sending this message you agree to our{" "}
                <Link href="/privacy" className="text-slate-300 underline underline-offset-4 hover:text-white">
                  Privacy Policy
                </Link>
                .
              </p>
              <button
                type="submit"
                disabled={sending || sent}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-[14px] font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
                style={{
                  background: "linear-gradient(135deg, #ff3c3c, #ff8c00)",
                  boxShadow: "0 10px 30px -12px rgba(255,60,60,0.6)",
                }}
              >
                {sent ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Message sent
                  </>
                ) : sending ? (
                  <>Sending…</>
                ) : (
                  <>
                    Send message
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {sent && (
              <p className="mt-3 text-[12.5px] text-slate-400">
                We&apos;ve emailed you a confirmation and forwarded your note to our team. You can
                still reach{" "}
                <a
                  href="mailto:support@risksent.com"
                  className="text-[#ff8c00] underline underline-offset-4"
                >
                  support@risksent.com
                </a>{" "}
                directly if needed.
              </p>
            )}
          </form>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div
              className="rounded-2xl border p-5"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <div
                className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border"
                style={{
                  borderColor: "rgba(255,60,60,0.3)",
                  background:
                    "linear-gradient(135deg, rgba(255,60,60,0.1), rgba(255,140,0,0.06))",
                }}
              >
                <Mail className="h-4 w-4 text-[#ff8c00]" />
              </div>
              <h3 className="text-[15px] font-semibold text-white">
                Email us directly
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-400">
                Prefer a plain email? Write to{" "}
                <a
                  href="mailto:support@risksent.com"
                  className="text-[#ff8c00] underline underline-offset-4"
                >
                  support@risksent.com
                </a>
                . Typical response: &lt; 1 business day.
              </p>
            </div>

            <div
              className="rounded-2xl border p-5"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <h3 className="text-[15px] font-semibold text-white">
                Before you message us
              </h3>
              <ul className="mt-3 space-y-2 text-[13px] text-slate-400">
                <li>
                  <Link
                    href="/support"
                    className="group inline-flex items-center gap-1.5 hover:text-white"
                  >
                    Browse the help center{" "}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support#faq"
                    className="group inline-flex items-center gap-1.5 hover:text-white"
                  >
                    Check the FAQ{" "}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
                <li>
                  <a
                    href="https://status.risksent.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 hover:text-white"
                  >
                    View system status{" "}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                </li>
                <li>
                  <Link
                    href="/changelog"
                    className="group inline-flex items-center gap-1.5 hover:text-white"
                  >
                    Read the changelog{" "}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              </ul>
            </div>

            <div
              className="rounded-2xl border p-5"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <h3 className="text-[15px] font-semibold text-white">Legal</h3>
              <ul className="mt-3 space-y-1.5 text-[13px] text-slate-400">
                <li>
                  <Link href="/terms" className="hover:text-white">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-white">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link href="/risk-disclosure" className="hover:text-white">
                    Risk Disclosure
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
