"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl border p-5"
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
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
      className="rs-card p-5"
    >
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
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.12, duration: 0.35, type: "spring" }}
      className="rs-card p-6"
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
      transition={{ delay: index * 0.08 }}
      className="rs-card p-5"
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
    }, 12);
    return () => clearInterval(interval);
  }, [isNew, isUser, msg.content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[80%] ${isUser ? "order-2" : "order-1"}`}>
        {!isUser && (
          <div className="mb-1.5 flex items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{
                background: `${CLAUDE_COLOR}20`,
                color: CLAUDE_COLOR,
                border: `1px solid ${CLAUDE_COLOR}40`,
              }}
            >
              Claude
            </span>
            <span className="text-[10px] text-slate-700 font-mono">
              {format(parseISO(msg.created_at), "HH:mm")}
            </span>
          </div>
        )}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-sm text-white"
              : "rs-card rounded-tl-sm text-slate-300"
          }`}
          style={
            isUser
              ? {
                  background:
                    "linear-gradient(135deg, rgba(255,60,60,0.25) 0%, rgba(201,42,42,0.2) 100%)",
                  border: "1px solid rgba(255,60,60,0.2)",
                }
              : undefined
          }
        >
          {isUser ? (
            msg.content
          ) : (
            <span style={{ whiteSpace: "pre-wrap" }}>{displayed}</span>
          )}
        </div>
        {isUser && (
          <p className="mt-1 text-right text-[10px] text-slate-700 font-mono">
            {format(parseISO(msg.created_at), "HH:mm")}
          </p>
        )}
      </div>
    </motion.div>
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
          disabled={generating || isMock}
          onClick={onGenerate}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff3c3c] to-[#c92a2a] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#ff3c3c]/20 disabled:opacity-50"
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
    { label: "Risk Consty.", value: report.risk_consistency_score },
    { label: "Strategy", value: report.strategy_adherence_score },
  ];

  const overallScore = Math.round(
    scores.reduce((s, x) => s + x.value, 0) / scores.length
  );

  return (
    <div className="space-y-6">
      {/* ── Section 1: Score Cards ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rs-card p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <p className="rs-kpi-label flex items-center gap-2">
            <Zap className="h-3.5 w-3.5" /> Scores
          </p>
          {reportRow && (
            <span className="font-mono text-[10px] text-slate-600">
              {format(parseISO(reportRow.created_at), "MMM d, HH:mm")} ·{" "}
              {reportRow.trades_analyzed} trades ·{" "}
              <span style={{ color: CLAUDE_COLOR }}>Claude</span>
            </span>
          )}
        </div>
        <div className="flex flex-wrap justify-around gap-6">
          {scores.map((s) => (
            <CircularScore key={s.label} score={s.value} label={s.label} />
          ))}
        </div>
      </motion.div>

      {/* ── Section 2: Summary Banner ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.35 }}
        className="rs-card-accent p-6"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="flex-1">
            <p className="rs-kpi-label mb-2 flex items-center gap-2">
              <Brain className="h-3.5 w-3.5" /> Coach Summary
            </p>
            <p className="leading-relaxed text-slate-300">{report.summary}</p>
          </div>
          <div className="flex flex-col gap-3 lg:w-64 lg:shrink-0">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">
                Overall Score
              </p>
              <p
                className="font-[family-name:var(--font-display)] text-4xl font-bold"
                style={{ color: scoreColor(overallScore) }}
              >
                {overallScore}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs space-y-1.5">
              <p>
                <span className="text-slate-600">Best session: </span>
                <span className="font-medium text-[#00e676]">
                  {report.best_session}
                </span>
              </p>
              <p>
                <span className="text-slate-600">Worst pattern: </span>
                <span className="font-medium text-[#ff3c3c]">
                  {report.worst_pattern}
                </span>
              </p>
            </div>
            <div className="rounded-xl border border-[#ff8c00]/20 bg-[#ff8c00]/08 p-3">
              <p className="text-[10px] uppercase tracking-wider text-[#ff8c00] mb-1">
                Fix this week
              </p>
              <p className="text-xs text-slate-300">
                {report.one_thing_to_fix_this_week}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Section 3: Errors ───────────────────────────────────────────── */}
      {report.errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="rs-kpi-label mb-4 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-[#ff3c3c]" />
            Behavioral Errors ({report.errors.length})
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {report.errors.map((err, i) => (
              <ErrorCard key={err.type} err={err} index={i} />
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Section 4: Insights ─────────────────────────────────────────── */}
      {report.insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <p className="rs-kpi-label mb-4 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#22d3ee]" />
            Insights ({report.insights.length})
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {report.insights.map((ins, i) => (
              <InsightCard key={ins.title} insight={ins} index={i} />
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Section 5: Challenge Simulator ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="rs-kpi-label mb-4 flex items-center gap-2">
          <Target className="h-3.5 w-3.5" /> Challenge Simulator
        </p>
        <div className="grid gap-4 md:grid-cols-2">
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
      </motion.div>

      {/* ── Section 6: Adaptations ──────────────────────────────────────── */}
      {report.adaptations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <p className="rs-kpi-label mb-4 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" /> Rule Adaptations
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {report.adaptations.map((a, i) => (
              <AdaptationCard key={a.rule} adapt={a} index={i} />
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Section 7: Session & Symbol ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid gap-4 md:grid-cols-2"
      >
        <div className="rs-card p-5">
          <p className="rs-kpi-label mb-3 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" /> Sessions
          </p>
          <div className="space-y-2">
            {[
              { label: "Best", value: report.best_session, color: "#00e676" },
              { label: "Worst", value: report.worst_session, color: "#ff3c3c" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
              >
                <span className="text-xs text-slate-500">{label} session</span>
                <span
                  className="text-sm font-bold font-[family-name:var(--font-display)]"
                  style={{ color }}
                >
                  {value}
                </span>
              </div>
            ))}
            {report.best_trading_hours.length > 0 && (
              <div className="pt-2">
                <p className="mb-1.5 text-[10px] uppercase tracking-wider text-slate-700">
                  Best hours (UTC)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {report.best_trading_hours.slice(0, 5).map((h) => (
                    <span
                      key={h}
                      className="rounded-full px-2 py-0.5 text-[10px] font-mono"
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
        </div>

        <div className="rs-card p-5">
          <p className="rs-kpi-label mb-3 flex items-center gap-2">
            <TrendingDown className="h-3.5 w-3.5" /> Symbols
          </p>
          <div className="space-y-2">
            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-wider text-slate-700">
                Best
              </p>
              <div className="flex flex-wrap gap-1.5">
                {report.best_symbols.map((s) => (
                  <span
                    key={s}
                    className="rounded-full px-2.5 py-0.5 text-xs font-mono"
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
            <div className="pt-1">
              <p className="mb-1.5 text-[10px] uppercase tracking-wider text-slate-700">
                Worst
              </p>
              <div className="flex flex-wrap gap-1.5">
                {report.worst_symbols.map((s) => (
                  <span
                    key={s}
                    className="rounded-full px-2.5 py-0.5 text-xs font-mono"
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
        </div>
      </motion.div>

      {/* ── Section 8: Weekly Summary ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rs-card overflow-hidden p-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        }}
      >
        <p className="rs-kpi-label mb-3 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[#818cf8]" /> Weekly Summary
        </p>
        <p className="leading-relaxed text-slate-300">{report.weekly_summary}</p>
      </motion.div>

      {/* ── Section 9: Report History ────────────────────────────────────── */}
      {allReports.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="rs-kpi-label mb-3">Report History</p>
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
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onLoadReport(r)}
                  className="rounded-xl border px-3 py-2 text-left transition-all hover:bg-white/[0.04]"
                  style={{
                    borderColor: isActive
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(255,255,255,0.06)",
                    background: isActive ? "rgba(255,255,255,0.04)" : "transparent",
                  }}
                >
                  <p className="text-xs font-medium text-slate-300">
                    {format(parseISO(r.created_at), "MMM d, HH:mm")}
                  </p>
                  <p className="font-mono text-[10px] text-slate-600">
                    {r.trades_analyzed} trades · score {score}
                  </p>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastCount = useRef(messages.length);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[500px] flex-col">
      {/* Context banner */}
      {reportRow && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-xs text-slate-500">
          <Brain className="h-3.5 w-3.5 flex-shrink-0 text-slate-600" />
          Chat context: report from{" "}
          {format(parseISO(reportRow.created_at), "MMM d")},{" "}
          {reportRow.trades_analyzed} trades analyzed
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <MessageSquare className="h-6 w-6 text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-400">
              Ask your coach anything
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {reportRow
                ? "Your last report is loaded as context."
                : "Generate a report first for richer answers."}
            </p>

            {/* Suggested questions */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onSend(q)}
                  disabled={isMock}
                  className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-slate-400 transition-all hover:bg-white/[0.05] hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {q}
                </button>
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="rs-card rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-slate-500"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="mt-3 border-t border-white/[0.06] pt-3">
        {/* Suggested chips when there are messages */}
        {messages.length > 0 && messages.length < 4 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onSend(q)}
                disabled={loading || isMock}
                className="rounded-full border border-white/[0.06] px-2.5 py-1 text-[10px] text-slate-600 transition-all hover:text-slate-300 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-white/[0.08] bg-[#0c0c0e] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-[#ff3c3c]/40 focus:ring-2 focus:ring-[#ff3c3c]/20 font-[family-name:var(--font-mono)] placeholder:text-slate-700"
            placeholder={
              isMock
                ? "Chat disabled in demo mode"
                : "Ask your coach…"
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
          <button
            type="button"
            disabled={!input.trim() || loading || isMock}
            onClick={handleSend}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff3c3c] to-[#c92a2a] text-white shadow-lg shadow-[#ff3c3c]/20 transition hover:opacity-90 disabled:opacity-40"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
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
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <h1 className="rs-page-title">AI Coach</h1>
          <p className="rs-page-sub">
            Behavioral analysis — no excuses, only data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Analysis window dropdown */}
          <div className="relative">
            <button
              type="button"
              disabled={isMock}
              onClick={() => setWindowOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-1.5 text-xs text-slate-300 hover:bg-white/[0.04] transition-colors disabled:opacity-50"
            >
              {ANALYSIS_WINDOWS.find((w) => w.value === analysisWindow)?.label}
              <ChevronDown className="h-3 w-3 text-slate-500" />
            </button>
            <AnimatePresence>
              {windowOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  className="absolute right-0 top-full z-20 mt-1 w-32 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c0e] shadow-2xl"
                >
                  {ANALYSIS_WINDOWS.map((w) => (
                    <button
                      key={w.value}
                      type="button"
                      className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/[0.04] transition-colors"
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

          {/* Generate button */}
          <motion.button
            type="button"
            whileHover={!generating && !isMock ? { scale: 1.02 } : {}}
            whileTap={!generating && !isMock ? { scale: 0.97 } : {}}
            disabled={generating || isMock}
            onClick={() => void handleGenerate()}
            title={isMock ? "Not available in demo" : undefined}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff3c3c] to-[#c92a2a] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-[#ff3c3c]/20 disabled:opacity-50 transition-opacity"
            animate={generating ? { opacity: [0.7, 1, 0.7] } : { opacity: 1 }}
            transition={generating ? { duration: 1.4, repeat: Infinity } : {}}
          >
            {generating ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Brain className="h-3.5 w-3.5" />
            )}
            {isMock
              ? "Demo mode"
              : generating
                ? `Analyzing ${tradeCount > 0 ? tradeCount : ""}trades…`
                : "Generate Report"}
          </motion.button>
        </div>
      </motion.div>

      {/* Demo banner */}
      {isMock && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 rounded-xl border border-[#7c3aed]/30 bg-[#7c3aed]/10 px-4 py-2.5 text-sm text-[#818cf8] font-mono"
        >
          <Sparkles className="h-4 w-4 flex-shrink-0" />
          Demo mode — pre-loaded with sample analysis. Sign up to run real AI analysis on your trades.
        </motion.div>
      )}

      {/* Generate error */}
      <AnimatePresence>
        {generateError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 rounded-xl border border-[#ff3c3c]/30 bg-[#ff3c3c]/10 px-4 py-2.5 text-sm text-[#ff3c3c]"
          >
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {generateError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab switcher */}
      {!loading && (
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 w-fit">
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
              className="relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
              style={{ color: tab === id ? "#fff" : "#64748b" }}
            >
              {tab === id && (
                <motion.span
                  layoutId="coach-tab-pill"
                  className="absolute inset-0 rounded-lg bg-white/[0.06]"
                  transition={{ type: "spring", damping: 28, stiffness: 380 }}
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">{label}</span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <p className="font-mono text-sm text-slate-500">Loading…</p>
      ) : (
        <AnimatePresence mode="wait">
          {tab === "report" ? (
            <motion.div
              key="report"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
