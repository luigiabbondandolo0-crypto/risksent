"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  MessageSquare,
  RefreshCw,
  Send,
  ChevronDown,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sparkles,
  Clock,
  Target,
  Zap,
  Shield,
  History,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { authFetch } from "@/lib/api/authFetch";
import type {
  CoachAdaptation,
  CoachError,
  CoachInsight,
  CoachMessage,
  CoachReport,
  CoachReportRow,
  ErrorSeverity,
} from "@/lib/ai-coach/coachTypes";

// ─── Design tokens ─────────────────────────────────────────────────────────

const CLAUDE_COLOR = "#7c3aed";

const severityConfig: Record<
  ErrorSeverity,
  { label: string; color: string; bg: string; border: string }
> = {
  critical: {
    label: "Critical",
    color: "#ff3c3c",
    bg: "rgba(255,60,60,0.08)",
    border: "rgba(255,60,60,0.25)",
  },
  high: {
    label: "High",
    color: "#ff8c00",
    bg: "rgba(255,140,0,0.08)",
    border: "rgba(255,140,0,0.25)",
  },
  medium: {
    label: "Medium",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
  },
  low: {
    label: "Low",
    color: "#64748b",
    bg: "rgba(100,116,139,0.08)",
    border: "rgba(100,116,139,0.2)",
  },
};

function scoreColor(s: number) {
  if (s >= 70) return "#00e676";
  if (s >= 40) return "#ff8c00";
  return "#ff3c3c";
}

function errorTypeLabel(type: string) {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const SUGGESTED_QUESTIONS = [
  "What's my biggest weakness?",
  "Would I pass an FTMO challenge?",
  "Analyze my revenge trading pattern",
  "What's causing my drawdown?",
  "When should I stop trading for the day?",
  "Am I overtrading?",
];

const ANALYSIS_WINDOWS = [
  { value: 30, label: "30 days" },
  { value: 60, label: "60 days" },
  { value: 90, label: "90 days" },
  { value: 180, label: "180 days" },
  { value: 365, label: "1 year" },
  { value: 9999, label: "All time" },
];

const coachSectionVariants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

type SectionTone = "default" | "critical" | "insight" | "challenge" | "rules" | "context";

const sectionToneClass: Record<SectionTone, string> = {
  default:
    "border-white/[0.09] bg-gradient-to-b from-white/[0.05] to-white/[0.015]",
  critical:
    "border-red-500/25 bg-gradient-to-b from-red-500/[0.08] to-transparent",
  insight:
    "border-[#6366f1]/20 bg-gradient-to-b from-[#6366f1]/[0.06] to-transparent",
  challenge:
    "border-violet-500/20 bg-gradient-to-b from-violet-500/[0.07] to-transparent",
  rules:
    "border-emerald-500/15 bg-gradient-to-b from-emerald-500/[0.05] to-transparent",
  context:
    "border-white/[0.08] bg-gradient-to-b from-slate-900/50 to-transparent",
};

/** Left accent bar on section header — high visibility */
const headerAccentBar: Record<SectionTone, string> = {
  default: "from-[#6366f1] via-violet-500 to-fuchsia-500/80",
  critical: "from-red-500 via-red-400 to-orange-500/90",
  insight: "from-[#6366f1] to-[#4f46e5]",
  challenge: "from-violet-500 via-fuchsia-500 to-indigo-400",
  rules: "from-emerald-400 to-cyan-600/90",
  context: "from-slate-400 via-slate-300 to-slate-500",
};

const headerBgTone: Record<SectionTone, string> = {
  default:
    "bg-gradient-to-br from-white/[0.12] via-white/[0.04] to-transparent",
  critical:
    "bg-gradient-to-br from-red-500/20 via-red-500/5 to-transparent",
  insight:
    "bg-gradient-to-br from-[#6366f1]/15 via-[#6366f1]/5 to-transparent",
  challenge:
    "bg-gradient-to-br from-violet-500/18 via-violet-500/6 to-transparent",
  rules:
    "bg-gradient-to-br from-emerald-500/12 via-emerald-500/4 to-transparent",
  context:
    "bg-gradient-to-br from-slate-600/15 via-slate-800/30 to-transparent",
};

const sectionBlobColor: Record<SectionTone, string> = {
  default: "#6366f1",
  critical: "#f87171",
  insight: "#38bdf8",
  challenge: "#a78bfa",
  rules: "#4ade80",
  context: "#64748b",
};

const CARD_HOVER = {
  hover: { scale: 1.02 },
  tap: { scale: 0.99 },
} as const;

/** Tween hover so scale follows the cursor without spring lag */
const HOVER_SCALE_TRANSITION = {
  type: "tween" as const,
  duration: 0.13,
  ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
};

type LucideIcon = ComponentType<{ className?: string }>;

function CoachSection({
  id,
  icon: Icon,
  title,
  description,
  tone = "default",
  children,
  className = "",
}: {
  id?: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  tone?: SectionTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-48px" }}
      variants={coachSectionVariants}
      transition={{
        opacity: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
        y: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
      }}
      className={[
        "relative scroll-mt-24 overflow-hidden rounded-2xl border shadow-[0_16px_56px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:scroll-mt-28",
        sectionToneClass[tone],
        className,
      ].join(" ")}
    >
      <div
        className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-full opacity-20 blur-2xl"
        style={{ background: `radial-gradient(circle, ${sectionBlobColor[tone]}, transparent)` }}
      />
      <div
        className={[
          "relative z-10 border-b border-white/10 px-4 py-4 backdrop-blur-md sm:px-6 sm:py-5",
          headerBgTone[tone],
        ].join(" ")}
      >
        <div
          className={`absolute left-0 top-0 h-full w-[4px] bg-gradient-to-b ${headerAccentBar[tone]} shadow-[2px_0_20px_rgba(0,0,0,0.45)]`}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        <div className="relative flex items-start gap-3 sm:gap-4 pl-2 sm:pl-3">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-black/30 text-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.45)] sm:h-12 sm:w-12"
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
          </motion.div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-transparent drop-shadow-[0_1px_24px_rgba(255,255,255,0.12)] sm:text-xl">
              {title}
            </h2>
            {description ? (
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400 sm:text-sm">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="relative z-10 p-4 sm:p-5 md:p-6">{children}</div>
    </motion.section>
  );
}

function ReportJumpNav({
  items,
}: {
  items: readonly { id: string; label: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <motion.nav
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto pb-1 sm:mx-0 sm:flex-wrap"
      aria-label="Report sections"
    >
      {items.map((item, i) => (
        <motion.a
          key={item.id}
          href={`#${item.id}`}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          transition={{
            opacity: { delay: i * 0.04, duration: 0.25 },
            x: { delay: i * 0.04, duration: 0.25 },
            scale: HOVER_SCALE_TRANSITION,
          }}
          className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:border-[#6366f1]/30 hover:bg-[#6366f1]/10 hover:text-indigo-100 sm:text-xs"
        >
          {item.label}
        </motion.a>
      ))}
    </motion.nav>
  );
}

// ─── Circular Score SVG ────────────────────────────────────────────────────

function CircularScore({
  score,
  label,
  size = 88,
}: {
  score: number;
  label: string;
  size?: number;
}) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const color = scoreColor(score);
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 80);
    return () => clearTimeout(t);
  }, [score]);

  const offset = circ - (animated / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 80 80"
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="6"
          />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)",
              filter: `drop-shadow(0 0 6px ${color}60)`,
            }}
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: "none" }}
        >
          <span
            className="font-[family-name:var(--font-display)] text-xl font-bold"
            style={{ color }}
          >
            {score}
          </span>
        </div>
      </div>
      <span className="text-center text-[11px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </span>
    </div>
  );
}

// ─── Error Card ─────────────────────────────────────────────────────────────

function ErrorCard({
  err,
  index,
}: {
  err: CoachError;
  index: number;
}) {
  const cfg = severityConfig[err.severity];
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        opacity: { delay: index * 0.06, duration: 0.28 },
        x: { delay: index * 0.06, duration: 0.28 },
        scale: HOVER_SCALE_TRANSITION,
      }}
      whileHover={CARD_HOVER.hover}
      whileTap={CARD_HOVER.tap}
      className="relative cursor-default overflow-hidden rounded-2xl border p-5"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-2xl"
        style={{ background: cfg.color }}
      />
      <div className="pl-2">
        <div className="mb-2 flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: `${cfg.color}20`,
              color: cfg.color,
              border: `1px solid ${cfg.color}40`,
            }}
          >
            {cfg.label}
          </span>
          <span className="text-xs font-semibold text-slate-300">
            {errorTypeLabel(err.type)}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-slate-400">
          {err.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs font-mono">
          <span style={{ color: cfg.color }}>
            Est. cost: -${err.estimated_cost_usd.toFixed(0)}
          </span>
          <span className="text-slate-600">
            {err.trades_affected} trades · {err.occurrences}× occurred
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Insight Card ───────────────────────────────────────────────────────────

function InsightCard({
  insight,
  index,
}: {
  insight: CoachInsight;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        opacity: { delay: index * 0.07, duration: 0.28 },
        y: { delay: index * 0.07, duration: 0.28 },
        scale: HOVER_SCALE_TRANSITION,
      }}
      whileHover={CARD_HOVER.hover}
      whileTap={CARD_HOVER.tap}
      className="relative cursor-default overflow-hidden rs-card p-5"
    >
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-2xl"
        style={{ background: "linear-gradient(to bottom, #22d3ee, #7c3aed)" }}
      />
      <div className="pl-2">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full border border-[#22d3ee]/30 bg-[#22d3ee]/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#22d3ee]">
            {insight.category}
          </span>
        </div>
        <h3 className="mb-1.5 text-sm font-semibold text-white">
          {insight.title}
        </h3>
        <p className="text-xs leading-relaxed text-slate-500">
          {insight.description}
        </p>
        <div className="mt-3 rounded-xl border border-[#00e676]/20 bg-[#00e676]/05 p-3">
          <p className="text-xs font-medium text-[#00e676]">
            → {insight.recommendation}
          </p>
        </div>
        {insight.estimated_impact && (
          <p className="mt-2 text-[10px] text-slate-600 font-mono">
            {insight.estimated_impact}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Challenge Card ─────────────────────────────────────────────────────────

function ChallengeCard({
  title,
  result,
  index,
}: {
  title: string;
  result: CoachReport["challenge_simulation"]["ftmo_phase1"];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        opacity: { delay: index * 0.1, duration: 0.35 },
        y: { delay: index * 0.1, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
        scale: HOVER_SCALE_TRANSITION,
      }}
      whileHover={CARD_HOVER.hover}
      whileTap={CARD_HOVER.tap}
      className="cursor-default rs-card p-6"
      style={{
        borderColor: result.would_pass
          ? "rgba(0,230,118,0.2)"
          : "rgba(255,60,60,0.2)",
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-white">
          {title}
        </h3>
        <span
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
          style={
            result.would_pass
              ? {
                  background: "rgba(0,230,118,0.15)",
                  color: "#00e676",
                  border: "1px solid rgba(0,230,118,0.3)",
                }
              : {
                  background: "rgba(255,60,60,0.15)",
                  color: "#ff3c3c",
                  border: "1px solid rgba(255,60,60,0.3)",
                }
          }
        >
          {result.would_pass ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <XCircle className="h-3 w-3" />
          )}
          {result.would_pass ? "PASS" : "FAIL"}
        </span>
      </div>

      {/* Pass probability ring */}
      <div className="mb-4 flex items-center gap-4">
        <CircularScore
          score={result.pass_probability}
          label="Pass prob."
          size={72}
        />
        <div>
          <p className="text-xs leading-relaxed text-slate-400">
            {result.reason}
          </p>
          {result.estimated_days_to_fail !== null && (
            <p className="mt-2 text-xs font-mono text-[#ff3c3c]">
              Breach estimated: day {result.estimated_days_to_fail}
            </p>
          )}
        </div>
      </div>

      {result.critical_issues.length > 0 && (
        <div className="space-y-1.5">
          {result.critical_issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-slate-500">
              <XCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-[#ff3c3c]" />
              {issue}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Adaptation Card ────────────────────────────────────────────────────────

function AdaptationCard({
  adapt,
  index,
}: {
  adapt: CoachAdaptation;
  index: number;
}) {
  const priorityColors = {
    high: { color: "#ff3c3c", glow: "rgba(255,60,60,0.15)" },
    medium: { color: "#ff8c00", glow: "rgba(255,140,0,0.1)" },
    low: { color: "#64748b", glow: "transparent" },
  };
  const pc = priorityColors[adapt.priority];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        opacity: { delay: index * 0.08, duration: 0.28 },
        y: { delay: index * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
        scale: HOVER_SCALE_TRANSITION,
      }}
      whileHover={CARD_HOVER.hover}
      whileTap={CARD_HOVER.tap}
      className="cursor-default rs-card p-5"
      style={{
        boxShadow:
          adapt.priority === "high" ? `0 0 20px ${pc.glow}` : undefined,
        borderColor:
          adapt.priority === "high"
            ? "rgba(255,60,60,0.2)"
            : undefined,
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
          style={{
            background: `${pc.color}20`,
            color: pc.color,
            border: `1px solid ${pc.color}40`,
          }}
        >
          {adapt.priority}
        </span>
        <p className="text-sm font-semibold text-white">{adapt.rule}</p>
      </div>
      <p className="mb-3 text-xs text-slate-500">{adapt.reason}</p>
      <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-600 mb-1">
          Implementation
        </p>
        <p className="text-xs text-slate-400">{adapt.implementation}</p>
      </div>
    </motion.div>
  );
}

// ─── Chat Message ────────────────────────────────────────────────────────────

function ChatBubble({
  msg,
  isNew,
}: {
  msg: CoachMessage;
  isNew?: boolean;
}) {
  const isUser = msg.role === "user";
  const [displayed, setDisplayed] = useState(isNew && !isUser ? "" : msg.content);

  useEffect(() => {
    if (!isNew || isUser) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(msg.content.slice(0, i));
      if (i >= msg.content.length) clearInterval(interval);
    }, 10);
    return () => clearInterval(interval);
  }, [isNew, isUser, msg.content]);

  if (isUser) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 10, x: 8 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="flex justify-end"
      >
        <div className="max-w-[min(92%,28rem)]">
          <motion.div
            whileHover={{ scale: 1.015 }}
            transition={{ scale: HOVER_SCALE_TRANSITION }}
            className="rounded-2xl rounded-br-md bg-gradient-to-br from-[#6366f1] via-[#4f46e5] to-[#3730a3] px-4 py-3 text-sm leading-relaxed text-white shadow-[0_16px_48px_-16px_rgba(99,102,241,0.55)]"
          >
            {msg.content}
          </motion.div>
          <p className="mt-2 text-right text-[10px] font-mono text-slate-500">
            {format(parseISO(msg.created_at), "HH:mm")}
          </p>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12, x: -6 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-full justify-start"
    >
      <div className="flex w-full max-w-[min(96%,40rem)] gap-3 sm:gap-4">
        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-500/35 bg-gradient-to-br from-violet-500/20 to-violet-900/30 text-[10px] font-bold text-violet-100 shadow-inner shadow-violet-500/10"
          style={{ color: CLAUDE_COLOR, borderColor: `${CLAUDE_COLOR}44` }}
        >
          AI
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/[0.1] bg-white/[0.05] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
              Claude
            </span>
            <span className="font-mono text-[10px] text-slate-600">
              {format(parseISO(msg.created_at), "HH:mm")}
            </span>
          </div>
          <div className="rounded-2xl rounded-tl-md border border-white/[0.1] bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent px-4 py-3.5 text-sm leading-relaxed text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <span className="whitespace-pre-wrap">{displayed}</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Report Tab ─────────────────────────────────────────────────────────────

function ReportTab({
  report,
  reportRow,
  allReports,
  onLoadReport,
  onGenerate,
  generating,
  isMock,
}: {
  report: CoachReport | null;
  reportRow: CoachReportRow | null;
  allReports: CoachReportRow[];
  onLoadReport: (r: CoachReportRow) => void;
  onGenerate: () => void;
  generating: boolean;
  isMock: boolean;
}) {
  if (!report) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.02]">
          <Brain className="h-9 w-9 text-slate-600" />
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
          No analysis yet
        </h2>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          Generate your first behavioral report to understand your trading
          patterns, emotional biases, and performance gaps.
        </p>
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ scale: HOVER_SCALE_TRANSITION }}
          disabled={generating || isMock}
          onClick={onGenerate}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f46e5] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#6366f1]/20 disabled:opacity-50"
        >
          {generating ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Brain className="h-4 w-4" />
          )}
          {isMock
            ? "Not available in demo"
            : generating
              ? "Analyzing trades…"
              : "Generate Report"}
        </motion.button>
      </motion.div>
    );
  }

  const scores = [
    { label: "Emotional", value: report.emotional_score },
    { label: "Performance", value: report.performance_score },
    { label: "Discipline", value: report.discipline_score },
    { label: "Risk consistency", value: report.risk_consistency_score },
    { label: "Strategy", value: report.strategy_adherence_score },
  ];

  const overallScore = Math.round(
    scores.reduce((s, x) => s + x.value, 0) / scores.length
  );

  const jumpLinks: { id: string; label: string }[] = [
    { id: "coach-overview", label: "Overview" },
  ];
  if (report.errors.length > 0) {
    jumpLinks.push({
      id: "coach-errors",
      label: `Errors (${report.errors.length})`,
    });
  }
  if (report.insights.length > 0) {
    jumpLinks.push({
      id: "coach-insights",
      label: `Insights (${report.insights.length})`,
    });
  }
  jumpLinks.push({ id: "coach-challenges", label: "Challenges" });
  if (report.adaptations.length > 0) {
    jumpLinks.push({ id: "coach-adaptations", label: "Rule tweaks" });
  }
  jumpLinks.push({ id: "coach-context", label: "Sessions & symbols" });
  jumpLinks.push({ id: "coach-weekly", label: "Weekly" });
  if (allReports.length > 1) {
    jumpLinks.push({ id: "coach-history", label: "History" });
  }

  return (
    <motion.div
      className="space-y-5 md:space-y-7"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <ReportJumpNav items={jumpLinks} />

      <CoachSection
        id="coach-overview"
        icon={Zap}
        title="Overview"
        description="Dimensional scores and coach narrative for this analysis."
        tone="default"
      >
        {reportRow && (
          <p className="rs-mono mb-5 text-[10px] text-slate-500 sm:text-xs">
            {format(parseISO(reportRow.created_at), "MMM d, yyyy · HH:mm")} ·{" "}
            {reportRow.trades_analyzed} trades ·{" "}
            <span style={{ color: CLAUDE_COLOR }}>Claude</span>
          </p>
        )}
        <p className="rs-section-title mb-3">Score breakdown</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {scores.map((s, idx) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                opacity: { delay: idx * 0.05, duration: 0.32 },
                y: { delay: idx * 0.05, duration: 0.32 },
                scale: HOVER_SCALE_TRANSITION,
              }}
              whileHover={{ scale: 1.045 }}
              whileTap={{ scale: 0.99 }}
              className="flex justify-center"
            >
              <CircularScore score={s.value} label={s.label} />
            </motion.div>
          ))}
        </div>

        <motion.div
          whileHover={{ scale: 1.012 }}
          whileTap={{ scale: 1.005 }}
          transition={{ scale: HOVER_SCALE_TRANSITION }}
          className="rs-card-accent relative mt-6 cursor-default p-4 sm:p-6"
        >
          <p className="rs-kpi-label mb-2 flex items-center gap-2">
            <Brain className="h-3.5 w-3.5" /> Coach summary
          </p>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
              <p className="leading-relaxed text-slate-300">{report.summary}</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch lg:w-72 lg:shrink-0 lg:flex-col">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center sm:flex-1">
                <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-600">
                  Overall
                </p>
                <p
                  className="font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl"
                  style={{ color: scoreColor(overallScore) }}
                >
                  {overallScore}
                </p>
              </div>
              <div className="space-y-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs sm:flex-1">
                <p>
                  <span className="text-slate-600">Best session </span>
                  <span className="font-medium text-[#00e676]">
                    {report.best_session}
                  </span>
                </p>
                <p>
                  <span className="text-slate-600">Worst pattern </span>
                  <span className="font-medium text-[#ff3c3c]">
                    {report.worst_pattern}
                  </span>
                </p>
              </div>
              <div className="rounded-xl border border-[#ff8c00]/20 bg-[#ff8c00]/08 p-3 sm:flex-1">
                <p className="mb-1 text-[10px] uppercase tracking-wider text-[#ff8c00]">
                  Fix this week
                </p>
                <p className="text-xs leading-relaxed text-slate-300">
                  {report.one_thing_to_fix_this_week}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </CoachSection>

      {report.errors.length > 0 && (
        <CoachSection
          id="coach-errors"
          icon={AlertTriangle}
          title="Behavioral errors"
          description="Repeated mistakes ranked by severity and estimated cost."
          tone="critical"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {report.errors.map((err, i) => (
              <ErrorCard key={err.type} err={err} index={i} />
            ))}
          </div>
        </CoachSection>
      )}

      {report.insights.length > 0 && (
        <CoachSection
          id="coach-insights"
          icon={Sparkles}
          title="Insights"
          description="Actionable observations tied to your recent behavior."
          tone="insight"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {report.insights.map((ins, i) => (
              <InsightCard key={ins.title} insight={ins} index={i} />
            ))}
          </div>
        </CoachSection>
      )}

      <CoachSection
        id="coach-challenges"
        icon={Target}
        title="Challenge simulator"
        description="How your stats would fare against common prop rules."
        tone="challenge"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ChallengeCard
            title="FTMO Standard (Phase 1)"
            result={report.challenge_simulation.ftmo_phase1}
            index={0}
          />
          <ChallengeCard
            title="FTMO Simplified"
            result={report.challenge_simulation.ftmo_simplified}
            index={1}
          />
        </div>
      </CoachSection>

      {report.adaptations.length > 0 && (
        <CoachSection
          id="coach-adaptations"
          icon={Shield}
          title="Rule adaptations"
          description="Concrete tweaks to your risk rules, by priority."
          tone="rules"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {report.adaptations.map((a, i) => (
              <AdaptationCard key={a.rule} adapt={a} index={i} />
            ))}
          </div>
        </CoachSection>
      )}

      <CoachSection
        id="coach-context"
        icon={Clock}
        title="Sessions & symbols"
        description="When and what you trade best — and what to avoid."
        tone="context"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <motion.div
            whileHover={CARD_HOVER.hover}
            whileTap={CARD_HOVER.tap}
            transition={{ scale: HOVER_SCALE_TRANSITION }}
            className="cursor-default rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5"
          >
            <p className="rs-kpi-label mb-3 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" /> Sessions
            </p>
            <div className="space-y-2">
              {[
                { label: "Best", value: report.best_session, color: "#00e676" },
                {
                  label: "Worst",
                  value: report.worst_session,
                  color: "#ff3c3c",
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-black/20 px-3 py-2.5"
                >
                  <span className="text-xs text-slate-500">{label} session</span>
                  <span
                    className="font-[family-name:var(--font-display)] text-sm font-bold"
                    style={{ color }}
                  >
                    {value}
                  </span>
                </div>
              ))}
              {report.best_trading_hours.length > 0 && (
                <div className="pt-2">
                  <p className="mb-1.5 text-[10px] uppercase tracking-wider text-slate-600">
                    Best hours (UTC)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {report.best_trading_hours.slice(0, 5).map((h) => (
                      <span
                        key={h}
                        className="rounded-full px-2 py-0.5 font-mono text-[10px]"
                        style={{
                          background: "rgba(0,230,118,0.12)",
                          color: "#00e676",
                          border: "1px solid rgba(0,230,118,0.2)",
                        }}
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            whileHover={CARD_HOVER.hover}
            whileTap={CARD_HOVER.tap}
            transition={{ scale: HOVER_SCALE_TRANSITION }}
            className="cursor-default rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5"
          >
            <p className="rs-kpi-label mb-3 flex items-center gap-2">
              <TrendingDown className="h-3.5 w-3.5" /> Symbols
            </p>
            <div className="space-y-3">
              <div>
                <p className="mb-1.5 text-[10px] uppercase tracking-wider text-slate-600">
                  Best
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {report.best_symbols.map((s) => (
                    <span
                      key={s}
                      className="rounded-full px-2.5 py-0.5 font-mono text-xs"
                      style={{
                        background: "rgba(0,230,118,0.12)",
                        color: "#00e676",
                        border: "1px solid rgba(0,230,118,0.2)",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[10px] uppercase tracking-wider text-slate-600">
                  Worst
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {report.worst_symbols.map((s) => (
                    <span
                      key={s}
                      className="rounded-full px-2.5 py-0.5 font-mono text-xs"
                      style={{
                        background: "rgba(255,60,60,0.12)",
                        color: "#ff3c3c",
                        border: "1px solid rgba(255,60,60,0.2)",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </CoachSection>

      <CoachSection
        id="coach-weekly"
        icon={Sparkles}
        title="Weekly summary"
        description="Rolling narrative for the last week of activity."
        tone="challenge"
      >
        <p className="leading-relaxed text-slate-300">{report.weekly_summary}</p>
      </CoachSection>

      {allReports.length > 1 && (
        <CoachSection
          id="coach-history"
          icon={History}
          title="Report history"
          description="Open a previous run without leaving this page."
          tone="default"
        >
          <div className="flex flex-wrap gap-2">
            {allReports.map((r) => {
              const score = Math.round(
                ((r.report.emotional_score ?? 0) +
                  (r.report.discipline_score ?? 0) +
                  (r.report.performance_score ?? 0)) /
                  3
              );
              const isActive = r.id === reportRow?.id;
              return (
                <motion.button
                  key={r.id}
                  type="button"
                  onClick={() => onLoadReport(r)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ scale: HOVER_SCALE_TRANSITION }}
                  className="rounded-xl border px-3 py-2 text-left transition-colors hover:bg-white/[0.04]"
                  style={{
                    borderColor: isActive
                      ? "rgba(34,211,238,0.35)"
                      : "rgba(255,255,255,0.08)",
                    background: isActive ? "rgba(34,211,238,0.06)" : "transparent",
                  }}
                >
                  <p className="text-xs font-medium text-slate-300">
                    {format(parseISO(r.created_at), "MMM d, HH:mm")}
                  </p>
                  <p className="font-mono text-[10px] text-slate-600">
                    {r.trades_analyzed} trades · score {score}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </CoachSection>
      )}
    </motion.div>
  );
}

// ─── Chat Tab ────────────────────────────────────────────────────────────────

function ChatTab({
  messages,
  onSend,
  loading,
  reportRow,
  isMock,
}: {
  messages: CoachMessage[];
  onSend: (msg: string) => void;
  loading: boolean;
  reportRow: CoachReportRow | null;
  isMock: boolean;
}) {
  const [input, setInput] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastCount = useRef(messages.length);

  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [messages, loading]);

  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const onScroll = () => {
      setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 80);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [messages, loading]);

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    onSend(msg);
  };

  const newMsgIndex = messages.length - 1;
  const isNewMsg = messages.length > lastCount.current;
  useEffect(() => {
    lastCount.current = messages.length;
  }, [messages.length]);

  const scrollThreadToBottom = () => {
    const el = scrollAreaRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-full min-h-0 flex-col"
    >
      <div className="flex h-[min(42rem,calc(100dvh-11rem))] min-h-[20rem] w-full flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-b from-[#101012] via-[#0a0a0c] to-[#080809] shadow-[0_28px_90px_-36px_rgba(0,0,0,0.9)] sm:h-[min(44rem,calc(100dvh-10rem))] sm:min-h-[22rem]">
        {/* Panel header */}
        <div className="relative shrink-0 border-b border-white/[0.08] bg-black/45 px-4 py-4 backdrop-blur-md sm:px-5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#6366f1]/35 to-transparent" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/15 to-violet-950/40 shadow-lg shadow-violet-900/25">
                <MessageSquare className="h-5 w-5 text-violet-300" />
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-white sm:text-lg">
                  Coach chat
                </h3>
                <p className="text-[11px] leading-snug text-slate-500 sm:text-xs">
                  {reportRow
                    ? "Replies use your latest report as context."
                    : "Generate a report first for deeper, personalized answers."}
                </p>
              </div>
            </div>
            {reportRow && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#6366f1]/15 bg-[#6366f1]/5 px-3 py-2 text-[11px] text-slate-400 sm:shrink-0">
                <Brain className="h-3.5 w-3.5 text-indigo-400/80" />
                <span>
                  Report{" "}
                  <span className="text-slate-300">
                    {format(parseISO(reportRow.created_at), "MMM d")}
                  </span>
                  <span className="text-slate-600"> · </span>
                  {reportRow.trades_analyzed} trades
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Thread — scrolls inside panel only; page does not grow */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            ref={scrollAreaRef}
            className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_45%_at_50%_-10%,rgba(99,102,241,0.12),transparent_55%)]" />
            <div className="relative space-y-6 sm:space-y-7">
              {messages.length === 0 ? (
                <div className="mx-auto flex max-w-3xl flex-col items-center px-1 py-6 text-center sm:py-10">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#6366f1]/20 bg-gradient-to-br from-[#6366f1]/10 to-transparent shadow-[0_0_40px_-8px_rgba(99,102,241,0.35)]">
                    <Sparkles className="h-7 w-7 text-indigo-400/80" />
                  </div>
                  <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">
                    Start the conversation
                  </p>
                  <p className="mt-2 max-w-md text-sm text-slate-500">
                    Pick a prompt below or write your own. The coach reads your
                    numbers, not your excuses.
                  </p>
                  <div className="mt-8 grid w-full gap-2.5 sm:grid-cols-2">
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                      <motion.button
                        key={q}
                        type="button"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          opacity: { delay: 0.04 * i, duration: 0.28 },
                          y: { delay: 0.04 * i, duration: 0.28 },
                          scale: HOVER_SCALE_TRANSITION,
                        }}
                        whileHover={CARD_HOVER.hover}
                        whileTap={CARD_HOVER.tap}
                        onClick={() => onSend(q)}
                        disabled={isMock}
                        className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3 text-left text-xs leading-snug text-slate-400 transition-colors hover:border-[#6366f1]/25 hover:bg-[#6366f1]/[0.07] hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {q}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <ChatBubble
                      key={msg.id}
                      msg={msg}
                      isNew={isNewMsg && i === newMsgIndex}
                    />
                  ))}
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start pl-0 sm:pl-1"
                    >
                      <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10 text-[9px] font-bold text-violet-200"
                          style={{ color: CLAUDE_COLOR }}
                        >
                          AI
                        </div>
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map((dot) => (
                            <motion.span
                              key={dot}
                              className="h-2 w-2 rounded-full bg-slate-500"
                              animate={{ opacity: [0.25, 1, 0.25], scale: [0.9, 1, 0.9] }}
                              transition={{
                                duration: 1.1,
                                repeat: Infinity,
                                delay: dot * 0.18,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
              <div ref={bottomRef} className="h-px w-full shrink-0" />
            </div>
          </div>

          <AnimatePresence>
            {showScrollBtn && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                onClick={scrollThreadToBottom}
                className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#0c0c0e]/95 text-slate-400 shadow-xl backdrop-blur-md transition-colors hover:border-[#6366f1]/30 hover:text-white"
              >
                <ChevronDown className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-white/[0.08] bg-gradient-to-t from-black/80 to-black/40 px-3 py-3 backdrop-blur-xl sm:px-4 sm:py-4">
          {messages.length > 0 && messages.length < 5 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
                <motion.button
                  key={q}
                  type="button"
                  whileHover={CARD_HOVER.hover}
                  whileTap={CARD_HOVER.tap}
                  transition={{ scale: HOVER_SCALE_TRANSITION }}
                  onClick={() => onSend(q)}
                  disabled={loading || isMock}
                  className="rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1.5 text-[11px] text-slate-500 transition-colors hover:border-white/15 hover:text-slate-200 disabled:opacity-40"
                >
                  {q}
                </motion.button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] p-2 shadow-inner shadow-black/40">
            <textarea
              ref={textareaRef}
              rows={1}
              className="max-h-[120px] min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed text-slate-100 outline-none placeholder:text-slate-600"
              placeholder={
                isMock
                  ? "Chat disabled in demo mode"
                  : "Message your coach…"
              }
              value={input}
              disabled={loading || isMock}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <motion.button
              type="button"
              disabled={!input.trim() || loading || isMock}
              onClick={handleSend}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              transition={{ scale: HOVER_SCALE_TRANSITION }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] to-[#3730a3] text-white shadow-[0_8px_24px_-6px_rgba(99,102,241,0.45)] transition-opacity disabled:opacity-35"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function AiCoachPageClient({
  isMock = false,
  mockReport,
  mockMessages,
}: {
  isMock?: boolean;
  mockReport?: CoachReportRow;
  mockMessages?: CoachMessage[];
}) {
  const [tab, setTab] = useState<"report" | "chat">("report");
  const [analysisWindow, setAnalysisWindow] = useState(9999);
  const [windowOpen, setWindowOpen] = useState(false);

  const [reportRow, setReportRow] = useState<CoachReportRow | null>(
    mockReport ?? null
  );
  const [allReports, setAllReports] = useState<CoachReportRow[]>(
    mockReport ? [mockReport] : []
  );
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [messages, setMessages] = useState<CoachMessage[]>(
    mockMessages ?? []
  );
  const [chatLoading, setChatLoading] = useState(false);
  const [loading, setLoading] = useState(!isMock);

  const report = reportRow?.report ?? null;

  // Read tab from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "chat") setTab("chat");
    }
  }, []);

  // Load reports + messages on mount (live only)
  const loadData = useCallback(async () => {
    if (isMock) return;
    setLoading(true);
    try {
      const [rRes, mRes] = await Promise.all([
        authFetch("/api/ai-coach/reports"),
        authFetch("/api/ai-coach/messages"),
      ]);
      if (rRes.ok) {
        const j = await rRes.json();
        const reports: CoachReportRow[] = j.reports ?? [];
        setAllReports(reports);
        if (reports.length > 0) setReportRow(reports[0]);
      }
      if (mRes.ok) {
        const j = await mRes.json();
        setMessages(j.messages ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [isMock]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleGenerate = async () => {
    if (isMock || generating) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await authFetch("/api/ai-coach/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: analysisWindow }),
      });
      const j = await res.json();
      if (!res.ok) {
        setGenerateError(j.error ?? "Analysis failed");
        return;
      }
      const newRow = j.report as CoachReportRow;
      setReportRow(newRow);
      setAllReports((prev) => [newRow, ...prev]);
    } finally {
      setGenerating(false);
    }
  };

  const handleChatSend = async (msg: string) => {
    if (isMock || chatLoading) return;
    const userMsg: CoachMessage = {
      id: `tmp-u-${Date.now()}`,
      user_id: "",
      role: "user",
      content: msg,
      model: "claude",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);
    try {
      const history = messages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await authFetch("/api/ai-coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history }),
      });
      const j = await res.json();
      if (res.ok) {
        const assistantMsg: CoachMessage = {
          id: `tmp-a-${Date.now()}`,
          user_id: "",
          role: "assistant",
          content: j.response,
          model: "claude",
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } finally {
      setChatLoading(false);
    }
  };

  const tradeCount = useMemo(() => reportRow?.trades_analyzed ?? 0, [reportRow]);

  return (
    <div className="relative space-y-5 sm:space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-40 left-1/4 h-96 w-96 rounded-full opacity-[0.06] blur-3xl"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />
        <div
          className="absolute top-1/3 right-0 h-72 w-72 rounded-full opacity-[0.04] blur-3xl"
          style={{ background: "radial-gradient(circle, #38bdf8, transparent)" }}
        />
        <div
          className="absolute bottom-1/4 left-0 h-64 w-64 rounded-full opacity-[0.04] blur-3xl"
          style={{ background: "radial-gradient(circle, #4ade80, transparent)" }}
        />
      </div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="min-w-0">
          <h1
            className="rs-page-title"
            style={{
              background: "linear-gradient(135deg, #e0e7ff 0%, #a78bfa 50%, #6366f1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AI Coach
          </h1>
          <p className="rs-page-sub">
            Behavioral analysis — no excuses, only data.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <div className="relative sm:min-w-0">
            <button
              type="button"
              disabled={isMock}
              onClick={() => setWindowOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-white/[0.04] disabled:opacity-50 sm:w-auto sm:justify-start"
            >
              <span className="truncate">
                {ANALYSIS_WINDOWS.find((w) => w.value === analysisWindow)?.label}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            </button>
            <AnimatePresence>
              {windowOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c0e] shadow-2xl sm:right-0 sm:left-auto sm:w-36"
                >
                  {ANALYSIS_WINDOWS.map((w) => (
                    <button
                      key={w.value}
                      type="button"
                      className="w-full px-3 py-2.5 text-left text-xs text-slate-300 transition-colors hover:bg-white/[0.04]"
                      onClick={() => {
                        setAnalysisWindow(w.value);
                        setWindowOpen(false);
                      }}
                    >
                      {w.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            type="button"
            whileHover={!generating && !isMock ? { scale: 1.02 } : {}}
            whileTap={!generating && !isMock ? { scale: 0.97 } : {}}
            transition={{
              opacity: generating
                ? { duration: 1.4, repeat: Infinity }
                : { duration: 0.2 },
              scale: HOVER_SCALE_TRANSITION,
            }}
            disabled={generating || isMock}
            onClick={() => void handleGenerate()}
            title={isMock ? "Not available in demo" : undefined}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f46e5] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#6366f1]/20 transition-opacity disabled:opacity-50 sm:w-auto"
            animate={generating ? { opacity: [0.7, 1, 0.7] } : { opacity: 1 }}
          >
            {generating ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Brain className="h-3.5 w-3.5" />
            )}
            {isMock
              ? "Demo mode"
              : generating
                ? `Analyzing${tradeCount > 0 ? ` ${tradeCount}` : ""} trades…`
                : "Generate Report"}
          </motion.button>
        </div>
      </motion.div>

      {/* Demo banner */}
      {isMock && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col gap-2 rounded-xl border border-[#7c3aed]/30 bg-[#7c3aed]/10 px-4 py-3 text-sm text-[#818cf8] sm:flex-row sm:items-center sm:gap-3 rs-mono"
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>
            Demo mode — sample analysis loaded. Sign up to run real AI on your
            trades.
          </span>
        </motion.div>
      )}

      {/* Generate error */}
      <AnimatePresence>
        {generateError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400"
          >
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {generateError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab switcher */}
      {!loading && (
        <div className="grid w-full grid-cols-2 gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 sm:inline-flex sm:w-auto sm:grid-cols-none">
          {(
            [
              { id: "report", label: "Report", Icon: Brain },
              { id: "chat", label: "Chat", Icon: MessageSquare },
            ] as const
          ).map(({ id, label, Icon }) => (
            <motion.button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className="relative flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium sm:min-h-0 sm:justify-start"
              style={{ color: tab === id ? "#fff" : "#64748b" }}
            >
              {tab === id && (
                <motion.span
                  layoutId="coach-tab-pill"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: "rgba(99,102,241,0.15)", boxShadow: "0 0 12px rgba(99,102,241,0.2)" }}
                  transition={{ type: "spring", damping: 28, stiffness: 380 }}
                />
              )}
              <Icon className="relative z-10 h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="relative z-10">{label}</span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
          aria-busy
          aria-label="Loading coach"
        >
          <div className="h-4 w-48 max-w-full animate-pulse rounded-lg bg-white/[0.06]" />
          <div className="h-32 rounded-2xl animate-pulse bg-white/[0.04]" />
          <div className="h-24 rounded-2xl animate-pulse bg-white/[0.04]" />
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          {tab === "report" ? (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <ReportTab
                report={report}
                reportRow={reportRow}
                allReports={allReports}
                onLoadReport={(r) => setReportRow(r)}
                onGenerate={() => void handleGenerate()}
                generating={generating}
                isMock={isMock}
              />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-0"
            >
              <ChatTab
                messages={messages}
                onSend={(msg) => void handleChatSend(msg)}
                loading={chatLoading}
                reportRow={reportRow}
                isMock={isMock}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
