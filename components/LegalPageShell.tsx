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
    <div className="relative w-full min-h-screen bg-[#F8FAFC]">
      {/* Subtle top accent */}
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #6366f1, #a78bfa, #6366f1)" }} />

      <div className="mx-auto max-w-3xl px-6 pb-24 pt-12 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex items-center gap-1.5 text-[11px] font-mono text-slate-400"
        >
          <Link href="/" className="transition-colors hover:text-slate-600">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-300" />
          <span className="text-slate-600">{title}</span>
        </nav>

        {/* Header */}
        <header className="mb-10 border-b border-slate-200 pb-8">
          <h1
            className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-[15px] leading-relaxed text-slate-500">
              {subtitle}
            </p>
          )}
          <p className="mt-5 inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-slate-400">
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            Last updated: {lastUpdated}
          </p>
        </header>

        {/* Body */}
        <article className="legal-prose">
          {children}
        </article>

        {/* Footer note */}
        <div className="mt-16 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <p className="text-[13px] text-slate-500">
            Questions about this document? Email us at{" "}
            <a
              href="mailto:support@risksent.com"
              className="font-semibold text-[#6366f1] underline underline-offset-4 hover:text-[#4f46e5]"
            >
              support@risksent.com
            </a>{" "}
            or visit our{" "}
            <Link
              href="/support"
              className="font-semibold text-[#6366f1] underline underline-offset-4 hover:text-[#4f46e5]"
            >
              help center
            </Link>
            .
          </p>
        </div>
      </div>

      <style>{`
        .legal-prose {
          font-size: 15px;
          line-height: 1.75;
          color: #374151;
        }
        .legal-prose h2 {
          margin-top: 2.25rem;
          margin-bottom: 0.75rem;
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          font-family: var(--font-display);
          padding-bottom: 0.4rem;
          border-bottom: 1px solid #E5E7EB;
        }
        .legal-prose h3 {
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1F2937;
        }
        .legal-prose p {
          margin-bottom: 1rem;
        }
        .legal-prose ul {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
          list-style: none;
        }
        .legal-prose ul li {
          position: relative;
          margin-bottom: 0.5rem;
          padding-left: 0.25rem;
        }
        .legal-prose ul li::before {
          content: '–';
          position: absolute;
          left: -1rem;
          color: #6366f1;
          font-weight: 600;
        }
        .legal-prose ol {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }
        .legal-prose ol li {
          margin-bottom: 0.5rem;
        }
        .legal-prose strong {
          color: #1F2937;
          font-weight: 600;
        }
        .legal-prose a {
          color: #6366f1;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .legal-prose a:hover {
          color: #4f46e5;
        }
        .legal-prose blockquote {
          margin: 1.25rem 0;
          padding: 0.75rem 1rem;
          border-left: 3px solid #6366f1;
          background: #F5F3FF;
          border-radius: 0 0.5rem 0.5rem 0;
          color: #4B5563;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
