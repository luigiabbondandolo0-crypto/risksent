import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function LegalPageShell({
  title,
  subtitle,
  lastUpdated,
  children,
}: {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div
      className="relative w-full"
      style={{
        background:
          "radial-gradient(1200px 500px at 50% -10%, rgba(255,60,60,0.08), transparent 60%), #080809",
      }}
    >
      <div className="mx-auto max-w-3xl px-6 pb-24 pt-16 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex items-center gap-1.5 text-[11px] font-mono text-slate-500"
        >
          <Link href="/" className="transition-colors hover:text-slate-300">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-700" />
          <span className="text-slate-300">{title}</span>
        </nav>

        {/* Header */}
        <header className="mb-10 border-b border-white/[0.06] pb-8">
          <h1
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-base leading-relaxed text-slate-400">
              {subtitle}
            </p>
          )}
          <p className="mt-6 text-[11px] font-mono uppercase tracking-[0.16em] text-slate-600">
            Last updated: {lastUpdated}
          </p>
        </header>

        {/* Body */}
        <article
          className="legal-prose text-[15px] leading-[1.75] text-slate-300"
        >
          {children}
        </article>

        {/* Footer note */}
        <div
          className="mt-16 rounded-2xl border px-6 py-5"
          style={{
            borderColor: "rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <p className="text-[13px] text-slate-400">
            Questions about this document? Email us at{" "}
            <a
              href="mailto:support@risksent.com"
              className="text-[#ff8c00] underline underline-offset-4 hover:text-[#ffb347]"
            >
              support@risksent.com
            </a>{" "}
            or visit our{" "}
            <Link
              href="/support"
              className="text-[#ff8c00] underline underline-offset-4 hover:text-[#ffb347]"
            >
              help center
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
