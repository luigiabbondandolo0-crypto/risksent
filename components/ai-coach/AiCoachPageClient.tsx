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
import {
  GlobalAccountSelector,
  RS_SELECTED_ACCOUNT_KEY,
} from "@/components/shared/GlobalAccountSelector";
import type {
  CoachAdaptation,
  CoachError,
  CoachInsight,
  CoachMessage,
  CoachReport,
  CoachReportRow,
  ErrorSeverity,
} from "@/lib/ai-coach/coachTypes";

const REPORT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

type JournalAccountRow = {
  id: string;
  nickname: string;
  status: string;
  platform?: string;
};

// ─── Design tokens — calm teal / slate system ─────────────────────────────

const COACH = {
  accent: "#6366f1",
  accentMuted: "rgba(99,102,241,0.10)",
  surface: "rgba(18,23,31,0.92)",
  border: "rgba(255,255,255,0.06)",
  good: "#4ade80",
  warn: "#fbbf24",
  bad: "#f87171",
} as const;

const severityConfig: Record<
  ErrorSeverity,
  { label: string; color: string; bg: string; border: string }
> = {
  critical: {
    label: "Critical",
    color: "#f87171",
    bg: "rgba(248,113,113,0.06)",
    border: "rgba(248,113,113,0.22)",
  },
  high: {
    label: "High",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.06)",
    border: "rgba(251,146,60,0.2)",
  },
  medium: {
    label: "Medium",
    color: COACH.warn,
    bg: "rgba(251,191,36,0.06)",
    border: "rgba(251,191,36,0.18)",
  },
  low: {
    label: "Low",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.06)",
    border: "rgba(148,163,184,0.16)",
  },
};

function scoreColor(s: number) {
  if (s >= 70) return COACH.good;
  if (s >= 40) return COACH.warn;
  return COACH.bad;
}

function errorTypeLabel(type: string) {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const SUGGESTED_QUESTIONS = [
  "What's my biggest weakness?",
  "Would I pass a prop challenge?",
  "Am I overtrading?",
  "What should I fix first?",
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

/** Subtle left accent only — rest is flat for readability */
const sectionToneBorder: Record<SectionTone, string> = {
  default: "border-l-indigo-500/40",
  critical: "border-l-rose-400/45",
  insight: "border-l-indigo-400/35",
  challenge: "border-l-sky-400/35",
  rules: "border-l-emerald-500/35",
  context: "border-l-slate-500/40",
};

const CARD_HOVER = {
  hover: {},
  tap: {},
} as const;

/** Tween hover so scale follows the cursor without spring lag */
const HOVER_SCALE_TRANSITION = {
  type: "tween" as const,
  duration: 0.13,
  ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
};

const COACH_WAITING_TIPS = [
  "Analyzing your habits and emotional patterns…",
  "Cross-checking your journal, reviews, and risk rules.",
  "Your coach is quantifying mistakes, estimated costs, and challenge simulations.",
  "Reviewing sessions, hours, and symbols where you perform best or worst.",
  "Almost there — putting the finishing touches on your report.",
];

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
      viewport={{ once: true, margin: "-40px" }}
      variants={coachSectionVariants}
      transition={{
        opacity: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
        y: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
      }}
      className={[
        "scroll-mt-24 rounded-2xl border border-white/[0.07] bg-[#12171f]/95 shadow-[0_8px_40px_-24px_rgba(0,0,0,0.5)] sm:scroll-mt-28",
        "border-l-[3px]",
        sectionToneBorder[tone],
        className,
      ].join(" ")}
    >
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-4 sm:px-5 sm:py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-indigo-300/80">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-[family-name:var(--font-display)] text-base font-semibold tracking-tight text-slate-100 sm:text-lg">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs leading-snug text-slate-500">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="p-4 sm:p-5 md:p-6">{children}</div>
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
          className="shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:border-indigo-500/25 hover:bg-indigo-500/5 hover:text-indigo-100/90 sm:text-xs"
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
            strokeWidth="5"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)",
              opacity: 0.92,
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
      <span className="max-w-[5.5rem] text-center text-[11px] font-medium leading-tight text-slate-500">
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
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
          <span style={{ color: cfg.color }} className="font-mono">
            ~${err.estimated_cost_usd.toFixed(0)} est.
          </span>
          <span>
            {err.trades_affected} trades · {err.occurrences}×
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
      className="relative cursor-default overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
    >
      <div className="border-l-2 border-indigo-400/40 pl-3">
        <span className="inline-block rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-200/90">
          {insight.category}
        </span>
        <h3 className="mb-1 mt-2 text-sm font-semibold text-slate-100">
          {insight.title}
        </h3>
        <p className="text-xs leading-relaxed text-slate-500">
          {insight.description}
        </p>
        <div className="mt-3 rounded-lg border border-indigo-500/15 bg-indigo-500/[0.06] px-3 py-2.5">
          <p className="text-xs leading-snug text-indigo-100/90">
            {insight.recommendation}
          </p>
        </div>
        {insight.estimated_impact ? (
          <p className="mt-2 text-[10px] text-slate-600">{insight.estimated_impact}</p>
        ) : null}
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
      className="cursor-default rounded-xl border border-white/[0.06] bg-white/[0.02] p-6"
      style={{
        borderColor: result.would_pass
          ? "rgba(52,211,153,0.2)"
          : "rgba(248,113,113,0.2)",
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
                  background: "rgba(52,211,153,0.12)",
                  color: COACH.good,
                  border: "1px solid rgba(52,211,153,0.28)",
                }
              : {
                  background: "rgba(248,113,113,0.1)",
                  color: COACH.bad,
                  border: "1px solid rgba(248,113,113,0.28)",
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
          label="Pass %"
          size={72}
        />
        <div>
          <p className="text-xs leading-relaxed text-slate-400">
            {result.reason}
          </p>
          {result.estimated_days_to_fail !== null && (
            <p className="mt-2 text-xs font-mono text-rose-300/90">
              Risk ~day {result.estimated_days_to_fail}
            </p>
          )}
        </div>
      </div>

      {result.critical_issues.length > 0 && (
        <div className="space-y-1.5">
          {result.critical_issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-slate-500">
              <XCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-rose-400/80" />
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
    high: { color: "#f87171", glow: "rgba(248,113,113,0.12)" },
    medium: { color: "#fbbf24", glow: "rgba(251,191,36,0.08)" },
    low: { color: "#94a3b8", glow: "transparent" },
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
          adapt.priority === "high" ? "rgba(248,113,113,0.18)" : undefined,
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
        <p className="mb-1 text-[10px] font-medium text-slate-600">How</p>
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
            className="rounded-2xl rounded-br-md bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 px-4 py-3 text-sm leading-relaxed text-white shadow-[0_12px_40px_-16px_rgba(99,102,241,0.35)]"
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
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-500/25 bg-indigo-950/40 text-[10px] font-semibold text-indigo-200/90">
          AI
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-slate-400">
              Coach
            </span>
            <span className="font-mono text-[10px] text-slate-600">
              {format(parseISO(msg.created_at), "HH:mm")}
            </span>
          </div>
          <div className="rounded-2xl rounded-tl-md border border-white/[0.08] bg-[#161c26] px-4 py-3.5 text-sm leading-relaxed text-slate-200">
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
  generateBlocked,
  cooldownLabel,
}: {
  report: CoachReport | null;
  reportRow: CoachReportRow | null;
  allReports: CoachReportRow[];
  onLoadReport: (r: CoachReportRow) => void;
  onGenerate: () => void;
  generating: boolean;
  isMock: boolean;
  generateBlocked: boolean;
  cooldownLabel: string | null;
}) {
  if (!report) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
          <Brain className="h-9 w-9 text-indigo-400/50" />
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-slate-100">
          No report yet
        </h2>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
          Run an analysis on your closed trades to get a clear read on habits and risk.
        </p>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ scale: HOVER_SCALE_TRANSITION }}
          disabled={generating || isMock || generateBlocked}
          onClick={onGenerate}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {generating ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Brain className="h-4 w-4" />
          )}
          {isMock
            ? "Not available in demo"
            : generateBlocked && cooldownLabel
              ? `Available in ${cooldownLabel}`
              : generating
                ? "Analyzing trades…"
                : "Generate Report"}
        </motion.button>
        {cooldownLabel && generateBlocked && !isMock ? (
          <p className="mt-3 text-center text-xs text-slate-500">
            One report per account every 24 hours. Next in{" "}
            <span className="font-mono text-indigo-400/90">{cooldownLabel}</span>.
          </p>
        ) : null}
      </motion.div>
    );
  }

  const scores = [
    { label: "Emotion", value: report.emotional_score },
    { label: "Performance", value: report.performance_score },
    { label: "Discipline", value: report.discipline_score },
    { label: "Risk", value: report.risk_consistency_score },
    { label: "Strategy", value: report.strategy_adherence_score },
  ];

  const overallScore = Math.round(
    scores.reduce((s, x) => s + x.value, 0) / scores.length
  );

  const jumpLinks: { id: string; label: string }[] = [{ id: "coach-overview", label: "Summary" }];
  if (report.errors.length > 0) {
    jumpLinks.push({ id: "coach-errors", label: `Issues (${report.errors.length})` });
  }
  if (report.insights.length > 0) {
    jumpLinks.push({ id: "coach-insights", label: "Ideas" });
  }
  jumpLinks.push({ id: "coach-challenges", label: "Prop test" });
  if (report.adaptations.length > 0) {
    jumpLinks.push({ id: "coach-adaptations", label: "Rules" });
  }
  jumpLinks.push({ id: "coach-context", label: "Timing" });
  if (allReports.length > 1) {
    jumpLinks.push({ id: "coach-history", label: "Past" });
  }

  return (
    <motion.div
      className="space-y-6 md:space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <ReportJumpNav items={jumpLinks} />

      <CoachSection id="coach-overview" icon={Zap} title="At a glance" tone="default">
        {reportRow ? (
          <p className="mb-6 font-mono text-[11px] text-slate-500">
            {format(parseISO(reportRow.created_at), "MMM d, yyyy")} · {reportRow.trades_analyzed}{" "}
            trades
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {scores.map((s, idx) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                opacity: { delay: idx * 0.04, duration: 0.28 },
                y: { delay: idx * 0.04, duration: 0.28 },
                scale: HOVER_SCALE_TRANSITION,
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.99 }}
              className="flex justify-center"
            >
              <CircularScore score={s.value} label={s.label} />
            </motion.div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_minmax(0,14rem)] lg:items-start">
          <p className="max-w-2xl text-[15px] leading-[1.65] text-slate-400">
            {report.summary}
          </p>
          <div className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-center">
              <p className="text-[10px] text-slate-600">Blend</p>
              <p
                className="font-[family-name:var(--font-display)] text-3xl font-bold tabular-nums"
                style={{ color: scoreColor(overallScore) }}
              >
                {overallScore}
              </p>
            </div>
            <div className="border-t border-white/[0.06] pt-3 text-xs leading-snug text-slate-500">
              <span className="text-emerald-400/90">{report.best_session}</span>
              <span className="text-slate-600"> · </span>
              <span className="text-rose-300/90">{report.worst_pattern}</span>
            </div>
            <div className="border-t border-white/[0.06] pt-3">
              <p className="text-[10px] text-amber-200/80">Focus</p>
              <p className="mt-1 text-xs leading-snug text-slate-400">
                {report.one_thing_to_fix_this_week}
              </p>
            </div>
          </div>
        </div>
      </CoachSection>

      {report.errors.length > 0 && (
        <CoachSection id="coach-errors" icon={AlertTriangle} title="Issues" tone="critical">
          <div className="grid gap-4 sm:grid-cols-2">
            {report.errors.map((err, i) => (
              <ErrorCard key={`${err.type}-${i}`} err={err} index={i} />
            ))}
          </div>
        </CoachSection>
      )}

      {report.insights.length > 0 && (
        <CoachSection id="coach-insights" icon={Sparkles} title="Ideas" tone="insight">
          <div className="grid gap-4 sm:grid-cols-2">
            {report.insights.map((ins, i) => (
              <InsightCard key={`${ins.title}-${i}`} insight={ins} index={i} />
            ))}
          </div>
        </CoachSection>
      )}

      <CoachSection id="coach-challenges" icon={Target} title="Prop challenges" tone="challenge">
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
        <CoachSection id="coach-adaptations" icon={Shield} title="Risk rules" tone="rules">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {report.adaptations.map((a, i) => (
              <AdaptationCard key={`${a.rule}-${i}`} adapt={a} index={i} />
            ))}
          </div>
        </CoachSection>
      )}

      <CoachSection id="coach-context" icon={Clock} title="Timing & markets" tone="context">
        <div className="grid gap-4 md:grid-cols-2">
          <motion.div
            whileHover={CARD_HOVER.hover}
            whileTap={CARD_HOVER.tap}
            transition={{ scale: HOVER_SCALE_TRANSITION }}
            className="cursor-default rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5"
          >
            <p className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-400">
              <Clock className="h-3.5 w-3.5 opacity-70" /> Sessions
            </p>
            <div className="space-y-2">
              {[
                { label: "Best", value: report.best_session, color: COACH.good },
                { label: "Worst", value: report.worst_session, color: COACH.bad },
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
                  <p className="mb-1.5 text-[10px] text-slate-600">Hours (UTC)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {report.best_trading_hours.slice(0, 5).map((h) => (
                      <span
                        key={h}
                        className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300/90"
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
            <p className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-400">
              <TrendingDown className="h-3.5 w-3.5 opacity-70" /> Symbols
            </p>
            <div className="space-y-3">
              <div>
                <p className="mb-1.5 text-[10px] text-slate-600">Strong</p>
                <div className="flex flex-wrap gap-1.5">
                  {report.best_symbols.map((s) => (
                    <span
                      key={s}
                      className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-xs text-emerald-200/90"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[10px] text-slate-600">Weak</p>
                <div className="flex flex-wrap gap-1.5">
                  {report.worst_symbols.map((s) => (
                    <span
                      key={s}
                      className="rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 font-mono text-xs text-rose-200/90"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {report.weekly_summary ? (
          <div className="mt-6 border-t border-white/[0.06] pt-6">
            <p className="mb-2 text-xs font-medium text-slate-500">Week recap</p>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-400">{report.weekly_summary}</p>
          </div>
        ) : null}
      </CoachSection>

      {allReports.length > 1 && (
        <CoachSection id="coach-history" icon={History} title="Earlier reports" tone="default">
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
                    borderColor: isActive ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.08)",
                    background: isActive ? "rgba(99,102,241,0.08)" : "transparent",
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
      <div className="flex h-[min(42rem,calc(100dvh-11rem))] min-h-[20rem] w-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0f1319] shadow-[0_24px_80px_-32px_rgba(0,0,0,0.75)] sm:h-[min(44rem,calc(100dvh-10rem))] sm:min-h-[22rem]">
        <div className="shrink-0 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03]">
                <MessageSquare className="h-4 w-4 text-indigo-300/80" />
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-slate-100">
                  Chat
                </h3>
                <p className="text-[11px] text-slate-500 sm:text-xs">
                  {reportRow ? "Using your latest report." : "Generate a report for richer answers."}
                </p>
              </div>
            </div>
            {reportRow ? (
              <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-slate-500">
                <Brain className="h-3 w-3 text-indigo-400/70" />
                <span className="text-slate-400">
                  {format(parseISO(reportRow.created_at), "MMM d")} · {reportRow.trades_analyzed} trades
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Thread — scrolls inside panel only; page does not grow */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            ref={scrollAreaRef}
            className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_40%_at_50%_-8%,rgba(99,102,241,0.05),transparent_50%)]" />
            <div className="relative space-y-6 sm:space-y-7">
              {messages.length === 0 ? (
                <div className="mx-auto flex max-w-lg flex-col items-center px-1 py-6 text-center sm:py-10">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
                    <Sparkles className="h-6 w-6 text-indigo-400/70" />
                  </div>
                  <p className="font-[family-name:var(--font-display)] text-base font-semibold text-slate-100">
                    Ask something
                  </p>
                  <p className="mt-1.5 text-sm text-slate-500">Or tap a starter below.</p>
                  <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
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
                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left text-xs leading-snug text-slate-400 transition-colors hover:border-indigo-500/20 hover:bg-indigo-500/[0.05] hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-45"
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
                      <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-500/25 bg-indigo-950/40 text-[9px] font-semibold text-indigo-200/90">
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
                className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-[#0c0f14]/95 text-slate-400 shadow-lg backdrop-blur-md transition-colors hover:border-indigo-500/25 hover:text-indigo-100"
              >
                <ChevronDown className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-white/[0.06] bg-[#0c0f14]/90 px-3 py-3 backdrop-blur-md sm:px-4 sm:py-4">
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
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-[0_8px_24px_-6px_rgba(99,102,241,0.3)] transition-opacity hover:bg-indigo-500 disabled:opacity-35"
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

function CoachGeneratingOverlay({ active }: { active: boolean }) {
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    if (!active) {
      setTipIdx(0);
      return;
    }
    const id = window.setInterval(() => {
      setTipIdx((i) => (i + 1) % COACH_WAITING_TIPS.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [active]);

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="coach-gen-overlay"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          role="dialog"
          aria-modal="true"
          aria-live="polite"
          aria-label="Generating AI Coach report"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ type: "spring", damping: 26, stiffness: 340 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.08] bg-[#12171f]/98 px-8 py-10 shadow-2xl shadow-black/50"
          >
            <div
              className="pointer-events-none absolute -left-20 top-0 h-52 w-52 rounded-full opacity-[0.15] blur-3xl"
              style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
            />
            <div className="relative z-10 flex flex-col items-center text-center">
              <motion.div
                className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-950/30"
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Brain className="relative z-10 h-11 w-11 text-indigo-200/90" />
                <motion.span
                  className="absolute inset-0 rounded-2xl border-2 border-indigo-400/30"
                  style={{ borderColor: "rgba(99,102,241,0.3)" }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
              <p className="font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-400/80">
                AI Coach
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-white">
                Building your report…
              </h2>
              <AnimatePresence mode="wait">
                <motion.p
                  key={tipIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-4 min-h-[3.25rem] text-sm leading-relaxed text-slate-400"
                >
                  {COACH_WAITING_TIPS[tipIdx]}
                </motion.p>
              </AnimatePresence>
              <div className="mt-6 flex gap-1.5">
                {COACH_WAITING_TIPS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === tipIdx ? "w-5 bg-indigo-400" : "w-1.5 bg-white/15"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-5 text-[11px] text-slate-600">Usually takes less than a minute.</p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
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

  const [journalAccounts, setJournalAccounts] = useState<JournalAccountRow[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(!isMock);
  const [coachAccountId, setCoachAccountId] = useState<string | null>(null);
  const [forcedCooldownUntil, setForcedCooldownUntil] = useState<number | null>(null);
  const [tick, setTick] = useState(() => Date.now());

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
  const [loading, setLoading] = useState(false);

  const report = reportRow?.report ?? null;

  const cooldownUntilMs = useMemo(() => {
    const fromLatest = allReports[0]?.created_at
      ? new Date(allReports[0].created_at).getTime() + REPORT_COOLDOWN_MS
      : 0;
    return Math.max(fromLatest, forcedCooldownUntil ?? 0);
  }, [allReports, forcedCooldownUntil]);

  useEffect(() => {
    const left = cooldownUntilMs - Date.now();
    if (left <= 0) return;
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [cooldownUntilMs]);

  const reportCooldownActive = cooldownUntilMs > tick;
  const reportCooldownLabel = useMemo(() => {
    if (!reportCooldownActive) return null;
    const sec = Math.max(0, Math.ceil((cooldownUntilMs - tick) / 1000));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}h ${m}m ${s}s`;
  }, [cooldownUntilMs, tick, reportCooldownActive]);

  const generateBlocked = !isMock && !!coachAccountId && reportCooldownActive;

  // Read tab from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "chat") setTab("chat");
    }
  }, []);

  useEffect(() => {
    if (isMock) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/api/journal/accounts");
        if (!res.ok || cancelled) return;
        const j = await res.json();
        const list: JournalAccountRow[] = j.accounts ?? [];
        if (cancelled) return;
        setJournalAccounts(list);
        let stored: string | null = null;
        try {
          stored = localStorage.getItem(RS_SELECTED_ACCOUNT_KEY);
        } catch {
          /* ignore */
        }
        const pick =
          stored &&
          stored !== "all" &&
          list.some((a) => a.id === stored)
            ? stored
            : list[0]?.id ?? null;
        setCoachAccountId(pick);
      } finally {
        if (!cancelled) setAccountsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isMock]);

  const loadData = useCallback(async () => {
    if (isMock || !coachAccountId) return;
    setLoading(true);
    setAllReports([]);
    setReportRow(null);
    setMessages([]);
    try {
      const q = `journal_account_id=${encodeURIComponent(coachAccountId)}`;
      const [rRes, mRes] = await Promise.all([
        authFetch(`/api/ai-coach/reports?${q}`),
        authFetch(`/api/ai-coach/messages?${q}`),
      ]);
      if (rRes.ok) {
        const j = await rRes.json();
        const reports: CoachReportRow[] = j.reports ?? [];
        setAllReports(reports);
        if (reports.length > 0) setReportRow(reports[0]);
        else setReportRow(null);
      }
      if (mRes.ok) {
        const j = await mRes.json();
        setMessages(j.messages ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [isMock, coachAccountId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleGenerate = async () => {
    if (isMock || generating || !coachAccountId || generateBlocked) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await authFetch("/api/ai-coach/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days: analysisWindow,
          journal_account_id: coachAccountId,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        if (
          res.status === 429 &&
          typeof j.next_allowed_at === "string"
        ) {
          setForcedCooldownUntil(new Date(j.next_allowed_at).getTime());
        }
        setGenerateError(j.error ?? "Analysis failed");
        return;
      }
      setForcedCooldownUntil(null);
      const newRow = j.report as CoachReportRow;
      setReportRow(newRow);
      setAllReports((prev) => [newRow, ...prev]);
    } finally {
      setGenerating(false);
    }
  };

  const handleChatSend = async (msg: string) => {
    if (isMock || chatLoading || !coachAccountId) return;
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
        body: JSON.stringify({
          message: msg,
          history,
          journal_account_id: coachAccountId,
        }),
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
    <div className="relative space-y-6 sm:space-y-7">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-32 left-1/3 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full opacity-[0.06] blur-3xl"
          style={{ background: "radial-gradient(circle, #4f46e5, transparent 65%)" }}
        />
        <div
          className="absolute bottom-0 right-0 h-64 w-64 rounded-full opacity-[0.04] blur-3xl"
          style={{ background: "radial-gradient(circle, #312e81, transparent 70%)" }}
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
            className="rs-page-title font-[family-name:var(--font-display)]"
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
            Clear feedback from your journal — scores first, detail when you scroll.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {!isMock && journalAccounts.length > 0 && coachAccountId ? (
            <GlobalAccountSelector
              accounts={journalAccounts.map((a) => ({
                id: a.id,
                nickname: a.nickname,
                status: a.status,
                platform: a.platform,
              }))}
              selectedId={coachAccountId}
              allowAll={false}
              onChange={(id) => {
                if (id === "all") return;
                setCoachAccountId(id);
                setForcedCooldownUntil(null);
                setGenerateError(null);
                try {
                  localStorage.setItem(RS_SELECTED_ACCOUNT_KEY, id);
                } catch {
                  /* ignore */
                }
              }}
            />
          ) : null}
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
            disabled={generating || isMock || !coachAccountId || generateBlocked}
            onClick={() => void handleGenerate()}
            title={
              isMock
                ? "Not available in demo"
                : generateBlocked && reportCooldownLabel
                  ? `Next report in ${reportCooldownLabel}`
                  : undefined
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-900/25 transition-opacity hover:bg-indigo-500 disabled:opacity-50 sm:w-auto"
            animate={generating ? { opacity: [0.7, 1, 0.7] } : { opacity: 1 }}
          >
            {generating ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Brain className="h-3.5 w-3.5" />
            )}
            {isMock
              ? "Demo mode"
              : generateBlocked && reportCooldownLabel
                ? `Wait ${reportCooldownLabel}`
                : generating
                  ? `Analyzing${tradeCount > 0 ? ` ${tradeCount}` : ""} trades…`
                  : "Generate Report"}
          </motion.button>
          {!isMock && generateBlocked && reportCooldownLabel ? (
            <p className="w-full text-center text-[11px] text-slate-500 sm:text-right">
              Report cooldown:{" "}
              <span className="font-mono text-indigo-400/90">{reportCooldownLabel}</span>{" "}
              left (per account, 24h)
            </p>
          ) : null}
        </div>
      </motion.div>

      {!isMock && !accountsLoading && journalAccounts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-amber-500/25 bg-amber-950/20 px-4 py-3 text-sm text-amber-200/90"
        >
          Add a broker account in the journal to run AI Coach reports and chat for that
          account.
        </motion.div>
      ) : null}

      {/* Demo banner */}
      {isMock && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col gap-2 rounded-xl border border-indigo-500/20 bg-indigo-950/20 px-4 py-3 text-sm text-indigo-200/80 sm:flex-row sm:items-center sm:gap-3"
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
      {isMock ||
      (!accountsLoading && journalAccounts.length > 0 && coachAccountId) ? (
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
                  style={{ background: "rgba(99,102,241,0.12)", boxShadow: "0 0 0 1px rgba(99,102,241,0.15)" }}
                  transition={{ type: "spring", damping: 28, stiffness: 380 }}
                />
              )}
              <Icon className="relative z-10 h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="relative z-10">{label}</span>
            </motion.button>
          ))}
        </div>
      ) : null}

      {/* Loading + report/chat */}
      {!isMock && !accountsLoading && journalAccounts.length === 0 ? null : !isMock &&
        (accountsLoading || (!!coachAccountId && loading)) ? (
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
                generateBlocked={generateBlocked}
                cooldownLabel={reportCooldownLabel}
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
      <CoachGeneratingOverlay active={generating && !isMock} />
    </div>
  );
}
