"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  CalendarDays,
  RefreshCw,
  Settings2,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Check,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Search,
  Sparkles,
  ArrowRight,
  Clock,
  BookOpen,
  Award,
  Trophy,
} from "lucide-react";
import {
  format,
  parseISO,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
} from "date-fns";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { jn } from "@/lib/journal/jnClasses";
import { fmtDayPl } from "@/lib/journal/fmtDayPl";
import { useUserTimezone } from "@/lib/UserPreferencesContext";
import { fmtInTz, fmtTimeOnly } from "@/lib/fmtInTz";
import { syncAllJournalMetaAccounts } from "@/lib/journal/metaApiAutoSyncClient";
import { GlobalAccountSelector } from "@/components/shared/GlobalAccountSelector";
import { AddAccountModal } from "@/components/journal/AddAccountModal";
import { TradeReviewModal } from "@/components/journal/TradeReviewModal";
import { JournalScreenshotTile } from "@/components/journal/JournalScreenshotTile";
import type {
  JournalAccountPublic,
  JournalBias,
  JournalChecklistItem,
  JournalRule,
  JournalSession,
  JournalStrategy,
  JournalTradeRow,
} from "@/lib/journal/journalTypes";
import { SEED_TRADES } from "@/lib/journal/seedTrades";
import { JOURNAL_IMAGE_MAX, readImageFileAsDataUrl } from "@/lib/journal/imageUpload";
import {
  localDayBoundsIso,
  localYearsAgoStartIso,
  localYmdFromIso,
  localYmFromIso
} from "@/lib/journal/calendarBounds";
import { useDemoAction } from "@/hooks/useDemoAction";
import { toast } from "@/lib/toast";
import { DemoActionModal } from "@/components/demo/DemoActionModal";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ACCOUNT: JournalAccountPublic = {
  id: "demo-account",
  user_id: "demo-user",
  nickname: "Demo Account (IC Markets)",
  broker_server: "ICMarkets-Demo",
  account_number: "12345678",
  platform: "MT5",
  metaapi_account_id: null,
  currency: "USD",
  initial_balance: 10000,
  current_balance: 12847.3,
  status: "active",
  last_synced_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
};

const MOCK_SESSION: Partial<JournalSession> = {
  bias: "Bullish",
  key_levels:
    "EURUSD: 1.0850 resistance, 1.0780 support\nXAUUSD: 2650 key demand zone",
  watchlist: ["EURUSD", "XAUUSD", "US30"],
  notes:
    "CPI data at 8:30am. Expect volatility. Waiting for London session to establish direction before entering.",
  images: [],
  checklist_done: { c1: true, c2: true, c3: false },
  rules_followed: { r1: true, r2: true, r3: false },
};

const MOTIVATIONAL_QUOTES = [
  "Discipline is the bridge between goals and accomplishment.",
  "The market rewards patience and punishes impulsiveness.",
  "Your edge means nothing without the discipline to execute it.",
  "One good trade beats ten impulsive ones.",
  "Protect the account first. Profits follow discipline.",
  "The best traders are not the most aggressive — they are the most disciplined.",
  "Cut losses fast. Let winners run. Repeat.",
  "A good trading day starts before the market opens.",
  "Risk management is not optional. It is the job.",
  "You don't need to trade every day. You need to trade right.",
  "Consistency over perfection. Every single day.",
  "Your stop loss is not a failure — it is your plan working.",
] as const;

const MOCK_STRATEGIES: JournalStrategy[] = [
  {
    id: "s1",
    user_id: "demo",
    name: "London Breakout",
    description: null,
    created_at: null,
  },
  {
    id: "s2",
    user_id: "demo",
    name: "HTF Pullback",
    description: null,
    created_at: null,
  },
];

const MOCK_CHECKLIST: JournalChecklistItem[] = [
  { id: "c1", user_id: "demo", text: "HTF trend confirmed", order_index: 0, created_at: null },
  { id: "c2", user_id: "demo", text: "Structure break on LTF", order_index: 1, created_at: null },
  { id: "c3", user_id: "demo", text: "News checked", order_index: 2, created_at: null },
];

const MOCK_RULES: JournalRule[] = [
  { id: "r1", user_id: "demo", text: "No trading 30min before/after news", order_index: 0, created_at: null },
  { id: "r2", user_id: "demo", text: "Max 2 trades per day", order_index: 1, created_at: null },
  { id: "r3", user_id: "demo", text: "Only trade A+ setups", order_index: 2, created_at: null },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

function normBoolRecord(r: unknown): Record<string, boolean> {
  if (!r || typeof r !== "object" || Array.isArray(r)) return {};
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(r)) out[k] = Boolean(v);
  return out;
}

function normSessionImages(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.filter((x): x is string => typeof x === "string");
  }
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v) as unknown;
      return Array.isArray(p)
        ? p.filter((x): x is string => typeof x === "string")
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

type JournalSessionPatch =
  | Partial<JournalSession>
  | ((prev: Partial<JournalSession>) => Partial<JournalSession>);

function getDayStats(trades: JournalTradeRow[], dateStr: string) {
  const day = trades.filter(
    (t) =>
      t.status === "closed" &&
      t.close_time != null &&
      localYmdFromIso(t.close_time) === dateStr
  );
  const pl = day.reduce(
    (s, t) => s + (t.pl ?? 0),
    0
  );
  return { pl, count: day.length };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BiasButton({
  label,
  active,
  color,
  onClick,
  compact,
}: {
  label: JournalBias;
  active: boolean;
  color: string;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      animate={active ? { scale: 1.04 } : { scale: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 400 }}
      onClick={onClick}
      className={`flex-1 rounded-xl border font-semibold transition-all ${
        compact ? "py-1.5 text-xs" : "py-2.5 text-sm"
      }`}
      style={
        active
          ? {
              borderColor: color,
              background: `${color}18`,
              color,
              boxShadow: `0 0 14px ${color}30`,
            }
          : {
              borderColor: "rgba(0,0,0,0.07)",
              color: "#64748b",
              background: "transparent",
            }
      }
    >
      {label}
    </motion.button>
  );
}

function SavedIndicator({ saving, saved }: { saving: boolean; saved: boolean }) {
  return (
    <AnimatePresence>
      {(saving || saved) && (
        <motion.span
          className="flex items-center gap-1 text-[11px] font-mono text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {saving ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3 text-[#00e676]" />
          )}
          {saving ? "Saving…" : "Saved ✓"}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function TradeCard({
  trade,
  onClick,
}: {
  trade: JournalTradeRow;
  onClick: () => void;
}) {
  const net = trade.pl ?? 0;
  const userTz = useUserTimezone();
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.01, borderColor: "rgba(99,102,241,0.3)" }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-all hover:bg-slate-100"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="rounded-md px-2 py-0.5 text-[11px] font-bold font-mono"
            style={
              trade.direction === "BUY"
                ? { background: "rgba(0,230,118,0.15)", color: "#00e676" }
                : { background: "rgba(255,60,60,0.15)", color: "#ff3c3c" }
            }
          >
            {trade.direction}
          </span>
          <span className="font-semibold text-slate-900">{trade.symbol}</span>
        </div>
        <div className="text-right">
          <p
            className="font-mono text-sm font-bold"
            style={{ color: net >= 0 ? "#00e676" : "#ff3c3c" }}
          >
            {net >= 0 ? "+" : ""}
            {net.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-600 font-mono">
            {trade.open_time
              ? fmtTimeOnly(trade.open_time, userTz)
              : "—"}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Today Tab ────────────────────────────────────────────────────────────────

function TodayTab({
  session,
  todayTrades,
  checklist,
  rules,
  updateSession,
  onFlushSessionSave,
  onBiasChange,
  onKeyLevelsChange,
  onWatchlistChange,
  onNotesChange,
  saving,
  saved,
  onTradeClick,
  onSync,
  syncing,
  isMock,
  settingsHref,
}: {
  session: Partial<JournalSession>;
  todayTrades: JournalTradeRow[];
  checklist: JournalChecklistItem[];
  rules: JournalRule[];
  updateSession: (patch: JournalSessionPatch) => void;
  onFlushSessionSave: (override?: Partial<JournalSession>) => void;
  onBiasChange: (b: JournalBias | null) => void;
  onKeyLevelsChange: (v: string) => void;
  onWatchlistChange: (tags: string[]) => void;
  onNotesChange: (v: string) => void;
  saving: boolean;
  saved: boolean;
  onTradeClick: (t: JournalTradeRow) => void;
  onSync: () => void;
  syncing: boolean;
  isMock: boolean;
  settingsHref: string;
}) {
  const [quote] = useState(
    () =>
      MOTIVATIONAL_QUOTES[
        Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
      ]!
  );
  const [watchInput, setWatchInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const sortedChecklist = useMemo(
    () => [...checklist].sort((a, b) => a.order_index - b.order_index),
    [checklist]
  );
  const sortedRules = useMemo(
    () => [...rules].sort((a, b) => a.order_index - b.order_index),
    [rules]
  );

  const checklistDoneMap = session.checklist_done ?? {};
  const rulesFollowedMap = session.rules_followed ?? {};

  const checklistTotal = sortedChecklist.length;
  const checklistCompleted = sortedChecklist.filter(
    (c) => checklistDoneMap[c.id] === true
  ).length;
  const checklistPct =
    checklistTotal > 0 ? (checklistCompleted / checklistTotal) * 100 : 0;
  const progressColor =
    checklistPct >= 100
      ? "#00e676"
      : checklistPct >= 60
        ? "#ff8c00"
        : "#ff3c3c";

  const rulesActive = sortedRules.filter(
    (r) => rulesFollowedMap[r.id] === true
  ).length;
  const rulesTotal = sortedRules.length;

  const addSymbol = () => {
    const s = watchInput.trim().toUpperCase();
    if (!s) return;
    const current = session.watchlist ?? [];
    if (!current.includes(s)) {
      onWatchlistChange([...current, s]);
    }
    setWatchInput("");
  };

  const removeSymbol = (sym: string) => {
    onWatchlistChange((session.watchlist ?? []).filter((x) => x !== sym));
  };

  const processImageFiles = async (files: FileList | File[]) => {
    if (isMock) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    const current = session.images ?? [];
    const room = JOURNAL_IMAGE_MAX - current.length;
    if (room <= 0) return;
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of list.slice(0, room)) {
        if (newUrls.length >= JOURNAL_IMAGE_MAX) break;
        const dataUrl = await readImageFileAsDataUrl(file);
        const res = await fetch("/api/journal/images/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl, filename: file.name }),
        });
        if (!res.ok) continue;
        const j: { url?: string } = await res.json();
        if (j.url) newUrls.push(j.url);
      }
      if (newUrls.length > 0) {
        updateSession((prev) => {
          const cur = prev.images ?? [];
          const merged = [...cur];
          for (const u of newUrls) {
            if (merged.length >= JOURNAL_IMAGE_MAX) break;
            if (!merged.includes(u)) merged.push(u);
          }
          return { images: merged };
        });
      }
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url: string) => {
    updateSession((prev) => ({
      images: (prev.images ?? []).filter((u) => u !== url),
    }));
  };

  const settingsLinkProps = isMock
    ? {
        href: "#" as const,
        onClick: (e: MouseEvent<HTMLAnchorElement>) => e.preventDefault(),
      }
    : { href: settingsHref };

  const checklistVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
  };
  const checklistItemVariants = {
    hidden: { opacity: 0, x: -8 },
    show: { opacity: 1, x: 0 },
  };

  // ── Analytics ──
  const todayPl = todayTrades.reduce((s, t) => s + (t.pl ?? 0), 0);
  const todayWins = todayTrades.filter((t) => (t.pl ?? 0) > 0).length;
  const todayWinRate =
    todayTrades.length > 0
      ? Math.round((todayWins / todayTrades.length) * 100)
      : null;
  const rrTrades = todayTrades.filter(
    (t) => t.risk_reward != null && t.risk_reward > 0
  );
  const avgRR =
    rrTrades.length > 0
      ? rrTrades.reduce((s, t) => s + (t.risk_reward ?? 0), 0) / rrTrades.length
      : null;

  // Sanity score: composite of checklist %, rules %, win rate (if trades exist)
  const clScore = checklistTotal > 0 ? checklistCompleted / checklistTotal : null;
  const rlScore = rulesTotal > 0 ? rulesActive / rulesTotal : null;
  const wrScore = todayTrades.length > 0 ? todayWins / todayTrades.length : null;
  const sanityParts = [clScore, rlScore, wrScore].filter(
    (s): s is number => s !== null
  );
  const sanityScore =
    sanityParts.length > 0
      ? Math.round(
          (sanityParts.reduce((a, b) => a + b, 0) / sanityParts.length) * 100
        )
      : null;
  const sanityLabel =
    sanityScore == null
      ? "—"
      : sanityScore >= 80
        ? "Excellent"
        : sanityScore >= 60
          ? "Good"
          : sanityScore >= 40
            ? "Fair"
            : "Weak";
  const sanityColor =
    sanityScore == null
      ? "#94a3b8"
      : sanityScore >= 80
        ? "#16a34a"
        : sanityScore >= 60
          ? "#6366f1"
          : sanityScore >= 40
            ? "#f59e0b"
            : "#dc2626";

  return (
    <motion.div
      key="today"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="relative space-y-5"
    >
      {/* Settings shortcut */}
      <Link
        {...settingsLinkProps}
        title="Manage checklist, rules & strategies"
        className="absolute right-0 top-0 z-20 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
        aria-label="Journal settings"
      >
        <Settings2 className="h-4 w-4" />
      </Link>

      {/* ── Analytics strip ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pr-11 sm:pr-12">
        {[
          {
            label: "Trades today",
            value: todayTrades.length > 0 ? String(todayTrades.length) : "—",
            sub:
              todayTrades.length > 0
                ? `${todayPl >= 0 ? "+" : ""}${todayPl.toFixed(2)}`
                : "No trades yet",
            color: "#6366f1",
            glow: "rgba(99,102,241,0.08)",
            border: "rgba(99,102,241,0.18)",
          },
          {
            label: "Win rate",
            value: todayWinRate != null ? `${todayWinRate}%` : "—",
            sub:
              todayTrades.length > 0
                ? `${todayWins}W / ${todayTrades.length - todayWins}L`
                : "No trades yet",
            color:
              todayWinRate == null
                ? "#94a3b8"
                : todayWinRate >= 50
                  ? "#16a34a"
                  : "#dc2626",
            glow:
              todayWinRate == null
                ? "rgba(148,163,184,0.06)"
                : todayWinRate >= 50
                  ? "rgba(74,222,128,0.08)"
                  : "rgba(248,113,113,0.08)",
            border:
              todayWinRate == null
                ? "rgba(148,163,184,0.2)"
                : todayWinRate >= 50
                  ? "rgba(74,222,128,0.22)"
                  : "rgba(248,113,113,0.22)",
          },
          {
            label: "Avg R:R",
            value: avgRR != null ? `${avgRR.toFixed(2)}` : "—",
            sub: avgRR != null ? `${rrTrades.length} trade${rrTrades.length !== 1 ? "s" : ""} with RR` : "No RR data",
            color: avgRR == null ? "#94a3b8" : avgRR >= 1.5 ? "#16a34a" : avgRR >= 1 ? "#f59e0b" : "#dc2626",
            glow: "rgba(56,189,248,0.07)",
            border: "rgba(56,189,248,0.18)",
          },
          {
            label: "Sanity score",
            value: sanityScore != null ? `${sanityScore}` : "—",
            sub: sanityLabel,
            color: sanityColor,
            glow: `${sanityColor}14`,
            border: `${sanityColor}30`,
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            className="relative overflow-hidden rounded-2xl p-4"
            style={{
              background: stat.glow,
              border: `1px solid ${stat.border}`,
              boxShadow: `0 0 20px ${stat.glow}`,
            }}
          >
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400 mb-1">
              {stat.label}
            </p>
            <p
              className="font-display text-2xl font-black tracking-tight"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              {stat.sub}
            </p>
            {/* Sanity score mini bar */}
            {stat.label === "Sanity score" && sanityScore != null && (
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: sanityColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${sanityScore}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.3 }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">

        {/* LEFT — Chart analysis + Agenda */}
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          {/* Chart hero */}
          <div
            className={`${jn.card} relative flex flex-col gap-4 overflow-hidden`}
            style={{
              borderColor: "rgba(99,102,241,0.18)",
              boxShadow: "0 0 32px rgba(99,102,241,0.07)",
            }}
          >
            <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full opacity-15 blur-3xl" style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Today&apos;s analysis
                </h2>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Upload your chart setup
                </p>
              </div>
              <SavedIndicator saving={saving} saved={saved} />
            </div>

            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                void processImageFiles(e.target.files ?? []);
                e.target.value = "";
              }}
            />

            {/* Images or upload prompt */}
            {(session.images ?? []).length > 0 ? (
              <div className="flex flex-col gap-4">
                {(session.images ?? []).slice(0, JOURNAL_IMAGE_MAX).map((url) => (
                  <JournalScreenshotTile
                    key={url}
                    url={url}
                    removeDisabled={isMock}
                    onRemove={isMock ? undefined : () => removeImage(url)}
                  />
                ))}
                {(session.images ?? []).length < JOURNAL_IMAGE_MAX && !isMock && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-xs font-mono text-slate-400 hover:border-[#6366f1]/50 hover:text-[#6366f1] transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add another chart
                  </button>
                )}
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileRef.current?.click();
                  }
                }}
                onDragEnter={() => setDragOver(true)}
                onDragLeave={() => setDragOver(false)}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  void processImageFiles(e.dataTransfer.files);
                }}
                onClick={() => !isMock && fileRef.current?.click()}
                className={`flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all ${
                  dragOver
                    ? "border-[#6366f1]/60 bg-indigo-50"
                    : "border-slate-200 bg-slate-50/50 hover:border-[#6366f1]/40 hover:bg-indigo-50/30"
                } ${isMock ? "pointer-events-none opacity-50" : ""}`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <TrendingUp className="h-6 w-6 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-600">
                    {uploading ? "Uploading…" : "Drop your chart here"}
                  </p>
                  <p className="mt-1 text-[11px] font-mono text-slate-400">
                    or click to browse · PNG, JPG · max {JOURNAL_IMAGE_MAX}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Agenda */}
          <div
            className={`${jn.card} relative flex flex-col gap-3 overflow-hidden`}
            style={{
              borderColor: "rgba(167,139,250,0.18)",
              boxShadow: "0 0 24px rgba(167,139,250,0.07)",
            }}
          >
            <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-full opacity-15 blur-2xl" style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} />
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Agenda &amp; Operational Plan
                </h2>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Setup ideas, trade plan, key observations
                </p>
              </div>
              <SavedIndicator saving={saving} saved={saved} />
            </div>
            <textarea
              className={`${jn.input} min-h-[160px] resize-y`}
              placeholder={"Operational plan for today...\n\nSetup: waiting for EURUSD breakout above 1.0850\nIdea: London session, 4H structure confirmed\nKey level: 1.0820 invalidation"}
              value={session.notes ?? ""}
              onChange={(e) => onNotesChange(e.target.value)}
              onBlur={(e) => onFlushSessionSave({ notes: e.target.value })}
              readOnly={isMock}
            />
          </div>
        </motion.div>

        {/* RIGHT — Checklist + Rules + Trades */}
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
        >
          {/* Pre-trade checklist */}
          <div
            className={`${jn.cardSm} relative space-y-3 overflow-hidden`}
            style={{
              background: "rgba(99,102,241,0.03)",
              borderColor: "rgba(99,102,241,0.2)",
              boxShadow: "0 0 20px rgba(99,102,241,0.07)",
            }}
          >
            <div className="pointer-events-none absolute right-0 top-0 h-16 w-16 rounded-full opacity-20 blur-2xl" style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-800">Pre-trade checklist</h3>
              <Link {...settingsLinkProps} className="text-slate-400 transition hover:text-slate-600" aria-label="Checklist settings">
                <Settings2 className="h-3.5 w-3.5" />
              </Link>
            </div>
            {checklistTotal === 0 ? (
              <p className="text-sm text-slate-500">
                No checklist yet.{" "}
                <Link {...settingsLinkProps} className="font-mono text-[#6366f1] hover:underline">
                  Add items →
                </Link>
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>{checklistCompleted}/{checklistTotal} done</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-slate-200">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: progressColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${checklistPct}%` }}
                      transition={{ type: "spring", stiffness: 120, damping: 22 }}
                    />
                  </div>
                </div>
                <motion.ul className="space-y-1.5" variants={checklistVariants} initial="hidden" animate="show">
                  {sortedChecklist.map((item) => {
                    const yes = checklistDoneMap[item.id] === true;
                    return (
                      <motion.li key={item.id} variants={checklistItemVariants}>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => updateSession({ checklist_done: { ...checklistDoneMap, [item.id]: !yes } })}
                          className="flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors"
                          style={{
                            borderColor: yes ? "rgba(74,222,128,0.3)" : "rgba(0,0,0,0.06)",
                            background: yes ? "rgba(74,222,128,0.06)" : "rgba(0,0,0,0.01)",
                          }}
                        >
                          <span
                            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md"
                            style={{
                              background: yes ? "#4ade80" : "rgba(0,0,0,0.07)",
                            }}
                          >
                            {yes && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                          </span>
                          <span className={`text-xs font-mono ${yes ? "text-slate-400 line-through" : "text-slate-700"}`}>
                            {item.text}
                          </span>
                        </motion.button>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              </>
            )}
          </div>

          {/* Rules */}
          <div
            className={`${jn.cardSm} relative space-y-3 overflow-hidden`}
            style={{
              background: "rgba(245,158,11,0.02)",
              borderColor: "rgba(245,158,11,0.18)",
              boxShadow: "0 0 18px rgba(245,158,11,0.06)",
            }}
          >
            <div className="pointer-events-none absolute right-0 top-0 h-14 w-14 rounded-full opacity-20 blur-2xl" style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }} />
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-800">Today&apos;s rules</h3>
              <Link {...settingsLinkProps} className="text-slate-400 transition hover:text-slate-600" aria-label="Rules settings">
                <Settings2 className="h-3.5 w-3.5" />
              </Link>
            </div>
            {rulesTotal === 0 ? (
              <p className="text-sm text-slate-500">
                No rules set.{" "}
                <Link {...settingsLinkProps} className="font-mono text-[#6366f1] hover:underline">
                  Add rules →
                </Link>
              </p>
            ) : (
              <div className="space-y-1.5">
                {sortedRules.map((rule) => {
                  const yes = rulesFollowedMap[rule.id] === true;
                  return (
                    <motion.button
                      key={rule.id}
                      type="button"
                      layout
                      onClick={() => updateSession({ rules_followed: { ...rulesFollowedMap, [rule.id]: !yes } })}
                      className="flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-xs font-mono transition-colors"
                      style={{
                        borderColor: yes ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.2)",
                        background: yes ? "rgba(74,222,128,0.06)" : "rgba(248,113,113,0.04)",
                        color: yes ? "#16a34a" : "#dc2626",
                      }}
                      transition={{ duration: 0.15 }}
                    >
                      {yes ? <Check className="h-3.5 w-3.5 flex-shrink-0" /> : <X className="h-3.5 w-3.5 flex-shrink-0" />}
                      <span className="truncate">{rule.text}</span>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trades */}
          <div
            className={`${jn.cardSm} relative flex flex-col gap-3 overflow-hidden`}
            style={{
              background: "rgba(74,222,128,0.02)",
              borderColor: "rgba(74,222,128,0.18)",
              boxShadow: "0 0 18px rgba(74,222,128,0.06)",
            }}
          >
            <div className="pointer-events-none absolute right-0 top-0 h-14 w-14 rounded-full opacity-20 blur-2xl" style={{ background: "radial-gradient(circle, #4ade80, transparent)" }} />
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Today&apos;s trades</h3>
              <button
                type="button"
                className={jn.btnGhost}
                disabled={syncing}
                onClick={onSync}
                style={{ padding: "4px 10px", fontSize: "12px" }}
              >
                <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
                Sync
              </button>
            </div>
            {todayTrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Sun className="h-8 w-8 text-slate-200 mb-2" />
                <p className="text-xs font-mono text-slate-400">No trades yet today</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {todayTrades.map((trade) => (
                  <TradeCard key={trade.id} trade={trade} onClick={() => onTradeClick(trade)} />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Calendar Tab ─────────────────────────────────────────────────────────────

function CalendarTab({
  allTrades,
  currency,
  isMock = false,
  mockUseAppRoutes = false,
}: {
  allTrades: JournalTradeRow[];
  currency?: string;
  isMock?: boolean;
  mockUseAppRoutes?: boolean;
}) {
  const [month, setMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const mockMonthInitialized = useRef(false);

  useEffect(() => {
    if (!isMock || allTrades.length === 0 || mockMonthInitialized.current) return;
    const fc = allTrades.find((t) => t.close_time)?.close_time;
    if (fc) {
      setMonth(startOfMonth(new Date(fc)));
      mockMonthInitialized.current = true;
    }
  }, [isMock, allTrades]);

  const blockRealLinks = isMock && !mockUseAppRoutes;
  const tradeLinkBase = "/app/journaling/trade";

  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });

  // Pad to Monday-start grid
  const padStart = (getDay(start) + 6) % 7;
  const cells: (Date | null)[] = [
    ...Array(padStart).fill(null),
    ...days,
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedDayTrades = useMemo(() => {
    if (!selectedDay) return [];
    return allTrades.filter(
      (t) =>
        t.status === "closed" &&
        t.close_time != null &&
        localYmdFromIso(t.close_time) === selectedDay
    );
  }, [selectedDay, allTrades]);

  const selectedDayPl = selectedDayTrades.reduce(
    (s, t) => s + (t.pl ?? 0),
    0
  );

  // Monthly stats
  const monthStr = format(month, "yyyy-MM");
  const monthTrades = allTrades.filter(
    (t) =>
      t.status === "closed" &&
      t.close_time != null &&
      localYmFromIso(t.close_time) === monthStr
  );
  const monthPl = monthTrades.reduce(
    (s, t) => s + (t.pl ?? 0),
    0
  );
  const monthWins = monthTrades.filter(
    (t) => (t.pl ?? 0) > 0
  ).length;
  const monthWinRate =
    monthTrades.length > 0
      ? ((monthWins / monthTrades.length) * 100).toFixed(0)
      : "—";

  const dayStats = useMemo(() => {
    const map: Record<string, { pl: number; count: number; wins: number }> = {};
    allTrades.forEach((t) => {
      if (!t.close_time || t.status !== "closed") return;
      const d = localYmdFromIso(t.close_time);
      if (!d) return;
      if (!map[d]) map[d] = { pl: 0, count: 0, wins: 0 };
      const net = t.pl ?? 0;
      map[d].pl += net;
      map[d].count++;
      if (net > 0) map[d].wins++;
    });
    return map;
  }, [allTrades]);

  return (
    <motion.div
      key="calendar"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div
        className={`${jn.card} relative overflow-hidden`}
        style={{ borderColor: "rgba(99,102,241,0.15)", boxShadow: "0 0 40px rgba(99,102,241,0.06)" }}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-[0.08] blur-3xl" style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
        {/* Month navigation */}
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            className={jn.btnGhost}
            onClick={() => {
              setMonth((m) => subMonths(m, 1));
              setSelectedDay(null);
            }}
            style={{ padding: "6px 10px" }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="font-display text-base font-bold text-slate-900">
            {format(month, "MMMM yyyy")}
          </h2>
          <button
            type="button"
            className={jn.btnGhost}
            onClick={() => {
              setMonth((m) => addMonths(m, 1));
              setSelectedDay(null);
            }}
            style={{ padding: "6px 10px" }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Month KPIs (same style as below — grouped with calendar) */}
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            {
              label: "Total Trades",
              value: monthTrades.length.toString(),
              color: "#94a3b8",
              glowColor: "rgba(148,163,184,0.12)",
              borderColor: "rgba(148,163,184,0.2)",
            },
            {
              label: "Win Rate",
              value: monthTrades.length > 0 ? `${monthWinRate}%` : "—",
              color: "#38BDF8",
              glowColor: "rgba(56,189,248,0.08)",
              borderColor: "rgba(56,189,248,0.22)",
            },
            {
              label: "Total P&L",
              value:
                monthTrades.length > 0 ? fmtDayPl(monthPl, currency) : "—",
              color: monthPl >= 0 ? "#16a34a" : "#dc2626",
              glowColor: monthPl >= 0 ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)",
              borderColor: monthPl >= 0 ? "rgba(74,222,128,0.22)" : "rgba(248,113,113,0.22)",
            },
            {
              label: "Best Day",
              value: (() => {
                const dayPls = Object.values(
                  Object.fromEntries(
                    Object.entries(
                      allTrades
                        .filter(
                          (t) =>
                            t.status === "closed" &&
                            t.close_time != null &&
                            localYmFromIso(t.close_time) === monthStr
                        )
                        .reduce(
                          (acc, t) => {
                            const d = localYmdFromIso(t.close_time!);
                            if (!d) return acc;
                            acc[d] = (acc[d] ?? 0) + (t.pl ?? 0);
                            return acc;
                          },
                          {} as Record<string, number>
                        )
                    )
                  )
                );
                if (dayPls.length === 0) return "—";
                const best = Math.max(...dayPls);
                return fmtDayPl(best, currency);
              })(),
              color: "#4ADE80",
              glowColor: "rgba(74,222,128,0.08)",
              borderColor: "rgba(74,222,128,0.22)",
            },
          ].map(({ label, value, color, glowColor, borderColor }, ki) => (
            <motion.div
              key={label}
              className="relative overflow-hidden rounded-xl p-3 backdrop-blur-sm"
              style={{
                background: glowColor,
                border: `1px solid ${borderColor}`,
                boxShadow: `0 0 16px ${glowColor}`,
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: ki * 0.07, ease: [0.22,1,0.36,1] }}
            >
              <div className="pointer-events-none absolute right-0 top-0 h-10 w-10 rounded-full opacity-30 blur-xl" style={{ background: `radial-gradient(circle, ${color}, transparent)` }} />
              <p className={jn.label}>{label}</p>
              <p
                className="mt-0.5 font-display text-lg font-bold"
                style={{ color }}
              >
                {value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Day headers */}
        <div className="mb-1 grid grid-cols-7 gap-0.5">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div
              key={d}
              className="py-1 text-center text-[10px] font-mono font-semibold text-slate-600 uppercase"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid — AnimatePresence enables month slide transition */}
        <AnimatePresence mode="wait">
        <motion.div
          key={format(month, "yyyy-MM")}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="grid grid-cols-7 gap-0.5"
        >
          {cells.map((day, i) => {
            if (!day) {
              return <div key={`pad-${i}`} className="aspect-square" />;
            }
            const ds = format(day, "yyyy-MM-dd");
            const stats = dayStats[ds];
            const isSelected = selectedDay === ds;
            const today = isToday(day);

            return (
              <motion.button
                key={ds}
                type="button"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: i * 0.012, ease: "easeOut" }}
                whileHover={{ scale: 1.08, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.94 }}
                onClick={() =>
                  setSelectedDay(isSelected ? null : ds)
                }
                className="relative flex aspect-square flex-col items-center justify-center rounded-xl border text-center transition-all"
                style={{
                  borderColor: isSelected
                    ? "rgba(99,102,241,0.5)"
                    : today
                      ? "rgba(255,255,255,0.15)"
                      : stats
                        ? stats.pl >= 0
                          ? "rgba(74,222,128,0.25)"
                          : "rgba(248,113,113,0.25)"
                        : "rgba(255,255,255,0.04)",
                  background: isSelected
                    ? "rgba(99,102,241,0.12)"
                    : stats
                      ? stats.pl >= 0
                        ? `rgba(74,222,128,${Math.min(0.2, 0.07 + Math.abs(stats.pl) / 2000)})`
                        : `rgba(248,113,113,${Math.min(0.2, 0.07 + Math.abs(stats.pl) / 2000)})`
                      : "transparent",
                }}
              >
                {/* Day number — top right */}
                <span
                  className="absolute top-0.5 right-1 sm:top-1 sm:right-1.5 text-[9px] sm:text-[11px] font-mono leading-none"
                  style={{
                    color: today ? "#fff" : stats ? (stats.pl >= 0 ? "#16a34a" : "#dc2626") : "#64748b",
                    fontWeight: today ? 700 : 500,
                  }}
                >
                  {format(day, "d")}
                </span>
                {/* Center: P&L, trades count, winrate */}
                {stats && (
                  <div className="flex flex-col items-center gap-0">
                    <span
                      className="text-[9px] sm:text-[13px] font-mono font-bold leading-tight"
                      style={{ color: stats.pl >= 0 ? "#16a34a" : "#dc2626" }}
                    >
                      {fmtDayPl(stats.pl, currency)}
                    </span>
                    <span className="hidden sm:block mt-0.5 text-[11px] font-mono leading-tight text-slate-400">
                      {stats.count === 1 ? "1 trade" : `${stats.count} trades`}
                    </span>
                    <span className="hidden sm:block text-[9px] font-mono leading-tight text-slate-400">
                      {stats.count > 0 ? `WR${Math.round((stats.wins / stats.count) * 100)}%` : "—"}
                    </span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </motion.div>
        </AnimatePresence>

        {/* Expanded day detail */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-5 border-t border-slate-200 pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    {format(parseISO(selectedDay), "EEEE, MMMM d")}
                  </h3>
                  <span
                    className="font-mono text-sm font-bold"
                    style={{
                      color: selectedDayPl >= 0 ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {fmtDayPl(selectedDayPl, currency)}
                  </span>
                </div>
                {selectedDayTrades.length === 0 ? (
                  <p className="text-sm text-slate-600">No closed trades this day.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayTrades.map((t) => {
                      const net = t.pl ?? 0;
                      return (
                        <Link
                          key={t.id}
                          href={`${tradeLinkBase}/${t.id}`}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="rounded-md px-1.5 py-0.5 text-[10px] font-bold font-mono"
                              style={
                                t.direction === "BUY"
                                  ? {
                                      background: "rgba(74,222,128,0.15)",
                                      color: "#4ADE80",
                                    }
                                  : {
                                      background: "rgba(248,113,113,0.15)",
                                      color: "#F87171",
                                    }
                              }
                            >
                              {t.direction}
                            </span>
                            <span className="text-sm font-medium text-slate-800">
                              {t.symbol}
                            </span>
                            {t.pips != null && (
                              <span className="text-xs text-slate-600 font-mono">
                                {t.pips > 0 ? "+" : ""}
                                {t.pips} pips
                              </span>
                            )}
                          </div>
                          <span
                            className="font-mono text-sm font-semibold"
                            style={{
                              color: net >= 0 ? "#16a34a" : "#dc2626",
                            }}
                          >
                            {net >= 0 ? "+" : ""}
                            {net.toFixed(2)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Trades Tab ───────────────────────────────────────────────────────────────

const TRADES_PAGE_SIZE = 50;

function tradeNetPl(t: JournalTradeRow): number {
  return t.pl ?? 0;
}

function fmtTradePrice(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  const v = Number(n);
  return Math.abs(v) >= 100 ? v.toFixed(2) : v.toFixed(5);
}

type DirFilter = "ALL" | "BUY" | "SELL";
type StatusFilter = "ALL" | JournalTradeRow["status"];

function TradesTab({
  allTrades,
  isMock,
  mockUseAppRoutes = false,
  basePath,
}: {
  allTrades: JournalTradeRow[];
  isMock: boolean;
  mockUseAppRoutes?: boolean;
  basePath: string;
}) {
  const router = useRouter();
  const searchParamsTrades = useSearchParams();
  const [symbolQ, setSymbolQ] = useState("");
  const [dir, setDir] = useState<DirFilter>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [fromDate, setFromDate] = useState(() => searchParamsTrades.get("from") ?? "");
  const [toDate, setToDate] = useState(() => searchParamsTrades.get("to") ?? "");
  const [page, setPage] = useState(0);

  const filtersActive =
    symbolQ.trim() !== "" ||
    dir !== "ALL" ||
    status !== "ALL" ||
    fromDate !== "" ||
    toDate !== "";

  const filtered = useMemo(() => {
    let list = [...allTrades];
    const q = symbolQ.trim().toLowerCase();
    if (q) list = list.filter((t) => t.symbol.toLowerCase().includes(q));
    if (dir !== "ALL") list = list.filter((t) => t.direction === dir);
    if (status !== "ALL") list = list.filter((t) => t.status === status);
    if (fromDate || toDate) {
      list = list.filter((t) => {
        const anchor =
          t.close_time != null
            ? localYmdFromIso(t.close_time)
            : t.open_time?.slice(0, 10) ?? "";
        if (!anchor) return false;
        if (fromDate && anchor < fromDate) return false;
        if (toDate && anchor > toDate) return false;
        return true;
      });
    }
    list.sort((a, b) => {
      const ta = new Date(a.close_time ?? a.open_time).getTime();
      const tb = new Date(b.close_time ?? b.open_time).getTime();
      return tb - ta;
    });
    return list;
  }, [allTrades, symbolQ, dir, status, fromDate, toDate]);

  useEffect(() => {
    setPage(0);
  }, [symbolQ, dir, status, fromDate, toDate, allTrades]);

  const stats = useMemo(() => {
    const closed = filtered.filter((t) => t.status === "closed");
    const nets = closed.map(tradeNetPl);
    const wins = nets.filter((n) => n > 0).length;
    const wr = closed.length > 0 ? (wins / closed.length) * 100 : 0;
    const totalPl = filtered.reduce((s, t) => s + tradeNetPl(t), 0);
    const rrVals = filtered
      .map((t) => t.risk_reward)
      .filter((x): x is number => x != null && Number.isFinite(Number(x)));
    const avgRr =
      rrVals.length > 0
        ? rrVals.reduce((a, b) => a + Number(b), 0) / rrVals.length
        : null;
    return {
      count: filtered.length,
      closedCount: closed.length,
      winRate: wr,
      totalPl,
      avgRr,
    };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / TRADES_PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageStart = safePage * TRADES_PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + TRADES_PAGE_SIZE);

  const blockRealLinks = isMock && !mockUseAppRoutes;

  const aiCoachHref = "/app/ai-coach";

  const openTrade = (id: string) => {
    if (blockRealLinks) return;
    router.push(`${basePath}/trade/${id}`);
  };

  const pillBtn = (on: boolean) =>
    `rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
      on
        ? "border border-[#6366f1]/40 bg-[#6366f1]/15 text-indigo-700"
        : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
    }`;

  const statCard =
    "relative overflow-hidden rounded-xl p-3 backdrop-blur-sm";
  const statCardBg = { background: "rgba(255,255,255,1)" } as const;

  return (
    <motion.div
      key="trades"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div
        className={`${jn.card} relative overflow-hidden`}
        style={{ borderColor: "rgba(99,102,241,0.14)", boxShadow: "0 0 30px rgba(99,102,241,0.05)" }}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-[0.07] blur-3xl" style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-base font-bold text-slate-900">
            All trades
          </h2>
          {blockRealLinks ? (
            <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-[#6366f1]/30 bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 px-4 py-2 font-mono text-xs font-semibold text-[#c7d2fe] opacity-60">
              <Sparkles className="h-3.5 w-3.5 text-[#a855f7]" />
              AI INSIGHTS
            </span>
          ) : (
            <Link
              href={aiCoachHref}
              className="group inline-flex items-center gap-2 rounded-xl border border-[#6366f1]/40 bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 px-4 py-2 font-mono text-xs font-semibold text-indigo-600 shadow-[0_0_0_1px_rgba(99,102,241,0.15)] transition-all hover:border-[#6366f1]/70 hover:from-[#6366f1]/20 hover:to-[#a855f7]/20 hover:text-indigo-800"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#a855f7] transition-transform group-hover:rotate-12" />
              AI INSIGHTS
            </Link>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              placeholder="Symbol…"
              value={symbolQ}
              onChange={(e) => setSymbolQ(e.target.value)}
              className={`${jn.input} pl-10`}
              aria-label="Filter by symbol"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Direction
            </span>
            {(["ALL", "BUY", "SELL"] as const).map((d) => (
              <button
                key={d}
                type="button"
                className={pillBtn(dir === d)}
                onClick={() => setDir(d)}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Status
            </span>
            {(["ALL", "open", "closed"] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={pillBtn(status === s)}
                onClick={() => setStatus(s)}
              >
                {s === "ALL" ? "ALL" : s.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className={jn.label}>From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className={jn.input}
              />
            </div>
            <div>
              <label className={jn.label}>To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={jn.input}
              />
            </div>
            {filtersActive && (
              <button
                type="button"
                className={`${jn.btnGhost} text-xs`}
                onClick={() => {
                  setSymbolQ("");
                  setDir("ALL");
                  setStatus("ALL");
                  setFromDate("");
                  setToDate("");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          className={statCard}
          style={{ background: "rgba(148,163,184,0.05)", border: "1px solid rgba(148,163,184,0.18)", boxShadow: "0 0 16px rgba(148,163,184,0.06)" }}
        >
          <div className="pointer-events-none absolute right-0 top-0 h-10 w-10 rounded-full opacity-25 blur-xl" style={{ background: "radial-gradient(circle, #94a3b8, transparent)" }} />
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Total trades</p>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-lg font-semibold text-slate-800">{stats.count}</p>
        </div>
        <div
          className={statCard}
          style={{ background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.2)", boxShadow: "0 0 16px rgba(56,189,248,0.07)" }}
        >
          <div className="pointer-events-none absolute right-0 top-0 h-10 w-10 rounded-full opacity-25 blur-xl" style={{ background: "radial-gradient(circle, #38bdf8, transparent)" }} />
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Win rate</p>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-lg font-semibold" style={{ color: "#38bdf8" }}>
            {stats.closedCount === 0 ? "—" : `${stats.winRate.toFixed(0)}%`}
          </p>
        </div>
        <div
          className={statCard}
          style={{
            background: stats.totalPl >= 0 ? "rgba(74,222,128,0.05)" : "rgba(248,113,113,0.05)",
            border: `1px solid ${stats.totalPl >= 0 ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
            boxShadow: `0 0 16px ${stats.totalPl >= 0 ? "rgba(74,222,128,0.07)" : "rgba(248,113,113,0.07)"}`,
          }}
        >
          <div className="pointer-events-none absolute right-0 top-0 h-10 w-10 rounded-full opacity-25 blur-xl" style={{ background: `radial-gradient(circle, ${stats.totalPl >= 0 ? "#4ade80" : "#f87171"}, transparent)` }} />
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Total P&amp;L</p>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-lg font-bold" style={{ color: stats.totalPl >= 0 ? "#16a34a" : "#dc2626" }}>
            {stats.count === 0 && stats.totalPl === 0 ? "—" : `${stats.totalPl >= 0 ? "+" : ""}${stats.totalPl.toFixed(2)}`}
          </p>
        </div>
        <div
          className={statCard}
          style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.18)", boxShadow: "0 0 16px rgba(167,139,250,0.06)" }}
        >
          <div className="pointer-events-none absolute right-0 top-0 h-10 w-10 rounded-full opacity-25 blur-xl" style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} />
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Avg R:R</p>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-lg font-semibold" style={{ color: "#a78bfa" }}>
            {stats.avgRr == null ? "—" : stats.avgRr.toFixed(2)}
          </p>
        </div>
      </div>

      <div
        className={`${jn.card} overflow-hidden p-0`}
        style={{ background: "rgba(255,255,255,1)" }}
      >
        {allTrades.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No trades yet — sync your account to see trades here
          </p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No trades match your filters
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Symbol</th>
                  <th className="px-4 py-3 font-medium">Dir</th>
                  <th className="px-4 py-3 font-medium">Lots</th>
                  <th className="px-4 py-3 font-medium">Open</th>
                  <th className="px-4 py-3 font-medium">Close</th>
                  <th className="px-4 py-3 font-medium">Pips</th>
                  <th className="px-4 py-3 font-medium">P&amp;L</th>
                  <th className="px-4 py-3 font-medium">R:R</th>
                  <th className="px-4 py-3 font-medium">Tags</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((t, i) => {
                  const net = tradeNetPl(t);
                  const win = net > 0;
                  const loss = net < 0;
                  const tags = t.setup_tags ?? [];
                  const rest = Math.max(0, tags.length - 2);
                  return (
                    <motion.tr
                      key={t.id}
                      role="button"
                      tabIndex={blockRealLinks ? -1 : 0}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02, duration: 0.2 }}
                      onClick={() => openTrade(t.id)}
                      onKeyDown={(e) => {
                        if (!blockRealLinks && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          openTrade(t.id);
                        }
                      }}
                      className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                        win
                          ? "border-l-2 border-l-[#00e676]/40"
                          : loss
                            ? "border-l-2 border-l-[#ff3c3c]/40"
                            : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-[family-name:var(--font-mono)] text-xs text-slate-500">
                        {format(
                          parseISO(t.close_time ?? t.open_time),
                          "MMM d, HH:mm"
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {t.symbol}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                          style={
                            t.direction === "BUY"
                              ? {
                                  background: "rgba(0,230,118,0.15)",
                                  color: "#00e676",
                                }
                              : {
                                  background: "rgba(255,60,60,0.15)",
                                  color: "#ff3c3c",
                                }
                          }
                        >
                          {t.direction}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-[family-name:var(--font-mono)] text-xs text-slate-400">
                        {t.lot_size}
                      </td>
                      <td className="px-4 py-3 font-[family-name:var(--font-mono)] text-xs text-slate-500">
                        {fmtTradePrice(t.open_price)}
                      </td>
                      <td className="px-4 py-3 font-[family-name:var(--font-mono)] text-xs text-slate-500">
                        {fmtTradePrice(t.close_price)}
                      </td>
                      <td
                        className="px-4 py-3 font-[family-name:var(--font-mono)] text-xs font-medium"
                        style={{
                          color:
                            t.pips == null
                              ? "#64748b"
                              : t.pips > 0
                                ? "#16a34a"
                                : t.pips < 0
                                  ? "#dc2626"
                                  : "#94a3b8",
                        }}
                      >
                        {t.pips == null
                          ? "—"
                          : `${t.pips > 0 ? "+" : ""}${t.pips}`}
                      </td>
                      <td
                        className="px-4 py-3 font-[family-name:var(--font-mono)] text-sm font-bold"
                        style={{
                          color: net >= 0 ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {net >= 0 ? "+" : ""}
                        {net.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 font-[family-name:var(--font-mono)] text-xs text-slate-400">
                        {t.risk_reward == null
                          ? "—"
                          : Number(t.risk_reward).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500"
                            >
                              {tag}
                            </span>
                          ))}
                          {rest > 0 && (
                            <span className="text-[10px] text-slate-600">
                              +{rest}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {blockRealLinks ? (
                          <span className="inline-flex cursor-not-allowed rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-500 opacity-60">
                            Review
                          </span>
                        ) : (
                          <Link
                            href={`${basePath}/trade/${t.id}`}
                            className={`${jn.btnGhost} inline-flex py-1.5 text-xs`}
                          >
                            Review
                          </Link>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {allTrades.length > 0 && filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
            <p className="text-xs font-mono text-slate-500">
              Showing {pageStart + 1}–{Math.min(pageStart + TRADES_PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length} trades
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={jn.btnGhost}
                disabled={safePage <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                style={{ padding: "6px 12px" }}
              >
                Prev
              </button>
              <button
                type="button"
                className={jn.btnGhost}
                disabled={safePage >= totalPages - 1}
                onClick={() =>
                  setPage((p) => Math.min(totalPages - 1, p + 1))
                }
                style={{ padding: "6px 12px" }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Start Day Screen ─────────────────────────────────────────────────────────
const START_PARTICLES = [
  { top: 12, left: 8,  color: "#6366f1", dur: 2.5, delay: 0 },
  { top: 22, left: 82, color: "#38bdf8", dur: 3.0, delay: 0.5 },
  { top: 68, left: 12, color: "#4ade80", dur: 2.8, delay: 1.0 },
  { top: 78, left: 72, color: "#6366f1", dur: 3.2, delay: 0.3 },
  { top: 38, left: 88, color: "#818cf8", dur: 2.2, delay: 0.8 },
  { top: 52, left: 4,  color: "#38bdf8", dur: 3.5, delay: 1.2 },
  { top: 8,  left: 52, color: "#4ade80", dur: 2.6, delay: 0.6 },
  { top: 85, left: 38, color: "#6366f1", dur: 2.9, delay: 1.5 },
  { top: 33, left: 48, color: "#818cf8", dur: 2.3, delay: 0.2 },
  { top: 58, left: 62, color: "#38bdf8", dur: 3.1, delay: 0.9 },
  { top: 18, left: 35, color: "#4ade80", dur: 2.7, delay: 1.3 },
  { top: 72, left: 55, color: "#6366f1", dur: 3.3, delay: 0.4 },
];

function StartDayScreen({ onStart }: { onStart: () => void }) {
  const [time, setTime] = useState(new Date());
  const [starting, setStarting] = useState(false);
  const [quote] = useState(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]!);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleStart = () => {
    setStarting(true);
    setTimeout(onStart, 500);
  };

  return (
    <motion.div
      key="start-day"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex min-h-[72vh] flex-col items-center justify-center overflow-hidden rounded-3xl"
      style={{
        background: "linear-gradient(145deg, #f8f9ff 0%, #f0f1ff 50%, #f8f9ff 100%)",
        border: "1px solid rgba(99,102,241,0.18)",
        boxShadow: "0 0 60px rgba(99,102,241,0.06)",
      }}
    >
      {/* Subtle dot grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.18) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
        }} />
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[480px] w-[480px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)" }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 65%)" }} />
        <div className="absolute top-0 left-1/4 h-56 w-56 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)" }} />
      </div>
      {/* Particles — softer on light bg */}
      {START_PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute h-1.5 w-1.5 rounded-full"
          style={{ background: p.color, top: `${p.top}%`, left: `${p.left}%`, opacity: 0.35 }}
          animate={{ y: [0, -10, 0], opacity: [0.2, 0.55, 0.2] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
      <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-[11px] font-mono uppercase tracking-[0.3em] text-slate-400"
        >
          {format(time, "EEEE, MMMM d")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="font-display font-black tabular-nums leading-none"
            style={{
              fontSize: "clamp(64px, 14vw, 108px)",
              background: "linear-gradient(135deg, #4338ca 0%, #6366f1 50%, #818cf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.04em",
            }}
          >
            {format(time, "HH:mm")}
            <span style={{ fontSize: "0.3em", WebkitTextFillColor: "#94a3b8", filter: "none" }}>
              :{format(time, "ss")}
            </span>
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          className="max-w-sm text-sm font-mono leading-relaxed text-slate-500"
        >
          &ldquo;{quote}&rdquo;
        </motion.p>
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={starting
            ? { opacity: 0, scale: 1.12, y: -20 }
            : { opacity: 1, y: 0, scale: 1 }
          }
          transition={starting
            ? { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
            : { delay: 0.75, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
          }
          whileHover={!starting ? { scale: 1.04, boxShadow: "0 8px 40px rgba(99,102,241,0.35)" } : {}}
          whileTap={!starting ? { scale: 0.97 } : {}}
          onClick={handleStart}
          className="inline-flex items-center gap-3 rounded-2xl px-10 py-5 text-base font-bold text-white"
          style={{
            background: "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)",
            boxShadow: "0 4px 24px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          <Sun className="h-5 w-5" />
          Start your day
          <ArrowRight className="h-4 w-4" />
        </motion.button>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.95, duration: 0.5 }}
          className="text-[11px] font-mono text-slate-400"
        >
          Pre-market prep · Checklist · Notes · Strategy
        </motion.p>
      </div>
    </motion.div>
  );
}

// ─── Live Clock ───────────────────────────────────────────────────────────────

function LiveClock() {
  const userTz = useUserTimezone();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const datePart = fmtInTz(now, userTz, { weekday: "long", month: "long", day: "numeric" });
  const timePart = fmtInTz(now, userTz, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const tzLabel = userTz && userTz !== "local" ? userTz.replace(/_/g, " ") : Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, " ");

  return (
    <div className="flex items-center gap-2 mt-1">
      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
      <span className="text-[12px] font-mono text-slate-500">
        <span className="text-slate-700 font-semibold">{datePart}</span>
        <span className="mx-1.5 text-slate-300">·</span>
        <span className="tabular-nums text-[#6366f1] font-bold">{timePart}</span>
        <span className="mx-1.5 text-slate-300">·</span>
        <span className="text-slate-400 text-[10px]">{tzLabel}</span>
      </span>
    </div>
  );
}

// ─── Past Grid ─────────────────────────────────────────────────────────────────

type PastSessionSummary = {
  session_date: string;
  bias: string | null;
  notes: string | null;
  key_levels: string | null;
  images: unknown;
  watchlist: unknown;
  checklist_done: unknown;
  rules_followed: unknown;
};

function sessionHasData(s: PastSessionSummary): boolean {
  if (s.bias) return true;
  if (s.notes?.trim()) return true;
  if (s.key_levels?.trim()) return true;
  const imgs = Array.isArray(s.images) ? s.images : [];
  if (imgs.length > 0) return true;
  const wl = Array.isArray(s.watchlist) ? s.watchlist : [];
  if (wl.length > 0) return true;
  const cl = s.checklist_done && typeof s.checklist_done === "object" && !Array.isArray(s.checklist_done)
    ? Object.values(s.checklist_done as Record<string, boolean>) : [];
  if (cl.some(v => v)) return true;
  const rl = s.rules_followed && typeof s.rules_followed === "object" && !Array.isArray(s.rules_followed)
    ? Object.values(s.rules_followed as Record<string, boolean>) : [];
  if (rl.some(v => v)) return true;
  return false;
}

type PastDay = {
  date: string;
  trades: JournalTradeRow[];
  pl: number;
  wins: number;
  winRate: number;
  screenshot: string | null;
  hasSession: boolean;
  sessionBias: string | null;
};

function buildPastDays(allTrades: JournalTradeRow[], allSessions: PastSessionSummary[]): PastDay[] {
  const today = getTodayStr();
  const map: Record<string, JournalTradeRow[]> = {};
  allTrades.forEach(t => {
    if (!t.close_time || t.status !== "closed") return;
    const d = localYmdFromIso(t.close_time);
    if (!d || d === today) return;
    if (!map[d]) map[d] = [];
    map[d].push(t);
  });

  // Merge in session-only days
  allSessions.forEach(s => {
    if (!s.session_date || s.session_date === today) return;
    if (!sessionHasData(s)) return;
    if (!map[s.session_date]) map[s.session_date] = [];
  });

  const sessionMap = new Map(allSessions.map(s => [s.session_date, s]));

  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, trades]) => {
      const pl = trades.reduce((s, t) => s + (t.pl ?? 0), 0);
      const wins = trades.filter(t => (t.pl ?? 0) > 0).length;
      const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;
      const screenshot = trades.find(t => t.screenshot_url)?.screenshot_url ?? null;
      const sess = sessionMap.get(date);
      return { date, trades, pl, wins, winRate, screenshot, hasSession: !!sess && sessionHasData(sess), sessionBias: sess?.bias ?? null };
    });
}

function PastDayCard({ day, currency, onClick, index }: { day: PastDay; currency: string; onClick: () => void; index: number; }) {
  const noTrades = day.trades.length === 0;
  const accent = noTrades ? "#6366f1" : day.pl >= 0 ? "#4ade80" : "#f87171";
  const accentBg = noTrades ? "rgba(99,102,241,0.08)" : day.pl >= 0 ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)";
  const accentBorder = noTrades ? "rgba(99,102,241,0.2)" : day.pl >= 0 ? "rgba(74,222,128,0.22)" : "rgba(248,113,113,0.22)";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.5), duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -5, boxShadow: `0 12px 40px ${accentBg}` }}
      whileTap={{ scale: 0.98 }}
      className="group relative overflow-hidden rounded-2xl text-left w-full"
      style={{ background: "rgba(255,255,255,0.9)", border: `1px solid ${accentBorder}`, backdropFilter: "blur(12px)", boxShadow: `0 2px 16px ${accentBg}` }}
    >
      <div className="relative h-28 overflow-hidden rounded-t-2xl">
        {day.screenshot ? (
          <img src={day.screenshot} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ opacity: 0.85 }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accentBg} 0%, rgba(99,102,241,0.05) 100%)` }}>
            {noTrades
              ? <BookOpen className="h-8 w-8" style={{ color: "#818cf8", opacity: 0.7 }} />
              : <BarChart2 className="h-8 w-8 text-slate-300" />}
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(255,255,255,0.95) 100%)" }} />
        <div className="absolute top-2 left-2 rounded-lg px-2 py-1 text-[10px] font-mono font-bold backdrop-blur-sm" style={{ background: "rgba(10,10,20,0.75)", color: "#e2e8f0" }}>
          {format(parseISO(day.date), "EEE, MMM d")}
        </div>
        {noTrades ? (
          <div className="absolute top-2 right-2 rounded-lg px-2 py-1 text-[10px] font-mono font-bold" style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.25)", backdropFilter: "blur(8px)" }}>
            {day.sessionBias ?? "Analysis"}
          </div>
        ) : (
          <div className="absolute top-2 right-2 rounded-lg px-2 py-1 text-[11px] font-mono font-bold" style={{ background: accentBg, color: accent, border: `1px solid ${accentBorder}`, backdropFilter: "blur(8px)" }}>
            {fmtDayPl(day.pl, currency)}
          </div>
        )}
      </div>
      <div className="px-3 pb-3 pt-2 flex items-center justify-between gap-2">
        {noTrades ? (
          <span className="text-[11px] font-mono text-[#6366f1]">Analysis only · no trades</span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500">{day.trades.length} trade{day.trades.length !== 1 ? "s" : ""}</span>
            <span className="h-3 w-px bg-slate-200" />
            <span className="text-[11px] font-mono font-semibold" style={{ color: day.winRate >= 50 ? "#16a34a" : "#dc2626" }}>WR {day.winRate}%</span>
          </div>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
    </motion.button>
  );
}

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const grade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : "D";
  const gradeColor = score >= 85 ? "#4ade80" : score >= 70 ? "#6366f1" : score >= 55 ? "#f59e0b" : "#f87171";
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={6} />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={gradeColor} strokeWidth={6} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (score / 100) * circ }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 6px ${gradeColor}80)` }}
        />
      </svg>
      <span className="absolute text-base font-black font-mono" style={{ color: gradeColor }}>{grade}</span>
    </div>
  );
}

function PastDayDetailModal({ day, session, loading: sessionLoading, checklist, rules, currency, onClose }: {
  day: PastDay; session: Partial<JournalSession> | null; loading: boolean;
  checklist: JournalChecklistItem[]; rules: JournalRule[]; currency: string; onClose: () => void;
}) {
  const checklistDone = (session?.checklist_done ?? {}) as Record<string, boolean>;
  const rulesFollowed = (session?.rules_followed ?? {}) as Record<string, boolean>;
  const clTotal = checklist.length;
  const clDone = checklist.filter(c => checklistDone[c.id]).length;
  const rlTotal = rules.length;
  const rlDone = rules.filter(r => rulesFollowed[r.id]).length;
  const score = clTotal + rlTotal > 0 ? Math.round(((clDone / Math.max(clTotal, 1)) + (rlDone / Math.max(rlTotal, 1))) / 2 * 100) : 0;
  const isWin = day.pl >= 0;
  const accent = isWin ? "#4ade80" : "#f87171";

  return (
    <AnimatePresence>
      <motion.div
        key="past-modal-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      >
        <motion.div
          key="past-modal-panel"
          initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ type: "spring", damping: 26, stiffness: 360 }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl"
          style={{ background: "rgba(255,255,255,0.98)", border: "1px solid rgba(99,102,241,0.15)", boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 rounded-t-3xl"
            style={{ background: "rgba(255,255,255,0.95)", borderBottom: "1px solid rgba(0,0,0,0.06)", backdropFilter: "blur(16px)" }}>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-slate-400">Journal recap</p>
              <h2 className="font-display text-lg font-bold text-slate-900">{format(parseISO(day.date), "EEEE, MMMM d, yyyy")}</h2>
            </div>
            <div className="flex items-center gap-3">
              {(clTotal + rlTotal > 0) && <ScoreRing score={score} />}
              <button type="button" onClick={onClose} className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {sessionLoading ? (
            <div className="p-6 space-y-3 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
            </div>
          ) : (
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "P&L", value: fmtDayPl(day.pl, currency), color: accent },
                  { label: "Trades", value: String(day.trades.length), color: "#6366f1" },
                  { label: "Win rate", value: `${day.winRate}%`, color: day.winRate >= 50 ? "#4ade80" : "#f87171" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <p className="text-base font-black font-mono" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              {(session?.bias || (session?.watchlist && session.watchlist.length > 0)) && (
                <div className="flex flex-wrap gap-2 items-center">
                  {session?.bias && (
                    <span className="rounded-full px-3 py-1 text-xs font-mono font-semibold"
                      style={{
                        color: session.bias === "Bullish" ? "#16a34a" : session.bias === "Bearish" ? "#dc2626" : "#64748b",
                        background: session.bias === "Bullish" ? "rgba(74,222,128,0.12)" : session.bias === "Bearish" ? "rgba(248,113,113,0.1)" : "rgba(148,163,184,0.1)",
                        border: `1px solid ${session.bias === "Bullish" ? "rgba(74,222,128,0.3)" : session.bias === "Bearish" ? "rgba(248,113,113,0.25)" : "rgba(148,163,184,0.2)"}`,
                      }}>{session.bias}</span>
                  )}
                  {session?.watchlist?.map(sym => (
                    <span key={sym} className="rounded-full px-2.5 py-1 text-xs font-mono font-semibold text-slate-600 bg-slate-100 border border-slate-200">{sym}</span>
                  ))}
                </div>
              )}
              {session?.notes && (
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-2">Agenda</p>
                  <div className="rounded-2xl p-4" style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.12)" }}>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-mono">{session.notes}</p>
                  </div>
                </div>
              )}
              {session?.key_levels && (
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-2">Key levels</p>
                  <p className="text-sm text-slate-600 font-mono leading-relaxed whitespace-pre-wrap">{session.key_levels}</p>
                </div>
              )}
              {session?.images && session.images.length > 0 && (
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-2">Charts</p>
                  <div className="grid grid-cols-2 gap-2">
                    {session.images.map((url, i) => (
                      <img key={i} src={url} alt="" className="w-full rounded-xl object-cover" style={{ maxHeight: 160 }} />
                    ))}
                  </div>
                </div>
              )}
              {checklist.length > 0 && (
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-2">Pre-trade checklist ({clDone}/{clTotal})</p>
                  <div className="space-y-1.5">
                    {[...checklist].sort((a, b) => a.order_index - b.order_index).map(item => {
                      const done = checklistDone[item.id] === true;
                      return (
                        <div key={item.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                          style={{ background: done ? "rgba(74,222,128,0.07)" : "rgba(0,0,0,0.02)", border: `1px solid ${done ? "rgba(74,222,128,0.2)" : "rgba(0,0,0,0.05)"}` }}>
                          <div className="flex-shrink-0 h-4 w-4 rounded-md flex items-center justify-center" style={{ background: done ? "#4ade80" : "rgba(0,0,0,0.08)" }}>
                            {done && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                          </div>
                          <span className={`text-sm font-mono ${done ? "text-slate-700" : "text-slate-400 line-through"}`}>{item.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {rules.length > 0 && (
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-2">Rules ({rlDone}/{rlTotal} followed)</p>
                  <div className="space-y-1.5">
                    {[...rules].sort((a, b) => a.order_index - b.order_index).map(rule => {
                      const followed = rulesFollowed[rule.id] === true;
                      return (
                        <div key={rule.id} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)" }}>
                          <span className="text-sm font-mono text-slate-600">{rule.text}</span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0"
                            style={{ color: followed ? "#16a34a" : "#dc2626", background: followed ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.1)" }}>
                            {followed ? "YES" : "NO"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div>
                <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-2">Trades</p>
                <div className="space-y-1.5">
                  {day.trades.map(t => {
                    const net = t.pl ?? 0;
                    return (
                      <div key={t.id} className="flex items-center justify-between rounded-xl px-3 py-2.5 border border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md px-2 py-0.5 text-[10px] font-bold font-mono"
                            style={t.direction === "BUY" ? { background: "rgba(74,222,128,0.12)", color: "#16a34a" } : { background: "rgba(248,113,113,0.12)", color: "#dc2626" }}>
                            {t.direction}
                          </span>
                          <span className="text-sm font-semibold text-slate-800">{t.symbol}</span>
                          {t.setup_tags?.map(tag => <span key={tag} className="hidden sm:inline text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-100">{tag}</span>)}
                        </div>
                        <p className="text-sm font-bold font-mono" style={{ color: net >= 0 ? "#16a34a" : "#dc2626" }}>
                          {net >= 0 ? "+" : ""}{net.toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
              {!session && !sessionLoading && (
                <div className="rounded-2xl p-6 text-center" style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <BookOpen className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-mono text-slate-400">No journal notes for this day</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function PastGrid({ allTrades, allSessions, currency, checklist, rules, isMock }: {
  allTrades: JournalTradeRow[]; allSessions: PastSessionSummary[]; currency: string; checklist: JournalChecklistItem[]; rules: JournalRule[]; isMock: boolean;
}) {
  const [selectedDay, setSelectedDay] = useState<PastDay | null>(null);
  const [pastDaySession, setPastDaySession] = useState<Partial<JournalSession> | null>(null);
  const [pastDayLoading, setPastDayLoading] = useState(false);

  useEffect(() => {
    if (!selectedDay || isMock) { setPastDaySession(null); return; }
    setPastDayLoading(true);
    fetch(`/api/journal/sessions?date=${selectedDay.date}`)
      .then(r => r.ok ? r.json() : null)
      .then(j => setPastDaySession(j?.session ?? null))
      .catch(() => setPastDaySession(null))
      .finally(() => setPastDayLoading(false));
  }, [selectedDay, isMock]);

  const pastDays = useMemo(() => buildPastDays(allTrades, allSessions), [allTrades, allSessions]);
  const grouped = useMemo(() => {
    const months: Record<string, PastDay[]> = {};
    pastDays.forEach(d => {
      const m = format(parseISO(d.date), "MMMM yyyy");
      if (!months[m]) months[m] = [];
      months[m].push(d);
    });
    return Object.entries(months);
  }, [pastDays]);

  if (pastDays.length === 0) {
    return (
      <motion.div key="past-empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }} className="flex flex-col items-center justify-center py-24 text-center">
        <BarChart2 className="h-10 w-10 text-slate-200 mb-4" />
        <p className="font-display text-xl font-bold text-slate-300 mb-1">No past days yet</p>
        <p className="text-sm font-mono text-slate-400">Your trading history will appear here</p>
      </motion.div>
    );
  }

  let cardIdx = 0;
  return (
    <motion.div key="past" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }} className="space-y-8">
      {grouped.map(([monthLabel, days]) => (
        <div key={monthLabel}>
          <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-400 mb-3">{monthLabel}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {days.map(day => <PastDayCard key={day.date} day={day} currency={currency} onClick={() => setSelectedDay(day)} index={cardIdx++} />)}
          </div>
        </div>
      ))}
      {selectedDay && (
        <PastDayDetailModal
          day={selectedDay} session={pastDaySession} loading={pastDayLoading}
          checklist={checklist} rules={rules} currency={currency}
          onClose={() => { setSelectedDay(null); setPastDaySession(null); }}
        />
      )}
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onConnected }: { onConnected: () => void }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-sm"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-[#6366f1]/10 to-transparent">
          <TrendingUp className="h-7 w-7 text-[#6366f1]" />
        </div>
        <h2 className="font-display text-2xl font-bold text-slate-900">
          Start your trading journal
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Connect your first broker account to begin tracking trades, sessions,
          and building your edge.
        </p>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`${jn.btnPrimary} mt-6`}
          onClick={() => setModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Connect your first account
        </motion.button>
      </motion.div>

      <AddAccountModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          onConnected();
        }}
      />
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function JournalingPageClient({
  isMock = false,
  mockUseAppRoutes = false,
}: {
  isMock?: boolean;
  mockUseAppRoutes?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { interceptAction, modalOpen, actionLabel, closeModal } = useDemoAction();
  const [accounts, setAccounts] = useState<JournalAccountPublic[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | "all">(
    "all"
  );
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [tab, setTab] = useState<"today" | "past">("today");
  const [dayStarted, setDayStarted] = useState(false);
  const [loading, setLoading] = useState(!isMock);
  const [syncing, setSyncing] = useState(false);

  // Session state
  const [session, setSession] = useState<Partial<JournalSession>>(
    isMock ? MOCK_SESSION : {}
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  // Trades
  const [todayTrades, setTodayTrades] = useState<JournalTradeRow[]>([]);
  const [allTrades, setAllTrades] = useState<JournalTradeRow[]>([]);
  const [allSessions, setAllSessions] = useState<PastSessionSummary[]>([]);

  // Review modal
  const [reviewTrade, setReviewTrade] = useState<JournalTradeRow | null>(null);

  // Strategies / checklist / rules
  const [strategies, setStrategies] = useState<JournalStrategy[]>(
    isMock ? MOCK_STRATEGIES : []
  );
  const [checklist, setChecklist] = useState<JournalChecklistItem[]>(
    isMock ? MOCK_CHECKLIST : []
  );
  const [rules, setRules] = useState<JournalRule[]>(isMock ? MOCK_RULES : []);

  const blockRealLinks = isMock && !mockUseAppRoutes;

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "past" || t === "calendar" || t === "history") setTab("past");
    else setTab("today");
  }, [searchParams]);

  const goTab = (next: "today" | "past") => {
    setTab(next);
    if (next === "today") {
      router.replace(pathname, { scroll: false });
    } else {
      router.replace(`${pathname}?tab=${next}`, { scroll: false });
    }
  };

  const journalTradeBase = "/app/journaling";

  const load = useCallback(async () => {
    if (isMock) {
      setAccounts([MOCK_ACCOUNT]);
      setSelectedAccountId("demo-account");
      setTodayTrades(
        SEED_TRADES.filter((t) => t.id === "seed-0" || t.id === "seed-1")
      );
      setAllTrades(SEED_TRADES);
      return;
    }

    setLoading(true);
    try {
      const today = getTodayStr();
      const { from: todayCloseFrom, to: todayCloseTo } = localDayBoundsIso(today);
      const sinceClose = localYearsAgoStartIso(3);

      // Fire all independent fetches in parallel — don't wait for accounts before fetching other data
      const [aRes, sRes, tTodayRes, strRes, clRes, rRes, allSessRes] = await Promise.all([
        fetch("/api/journal/accounts"),
        fetch(`/api/journal/sessions?date=${today}`),
        fetch(
          `/api/journal/trades?status=closed&close_from=${encodeURIComponent(todayCloseFrom)}&close_to=${encodeURIComponent(todayCloseTo)}&sort=close_time&pageSize=200`
        ),
        fetch("/api/journal/strategies"),
        fetch("/api/journal/checklist"),
        fetch("/api/journal/rules"),
        fetch("/api/journal/sessions?all=true"),
      ]);

      let accs: JournalAccountPublic[] = [];
      if (aRes.ok) {
        const j = await aRes.json();
        accs = j.accounts ?? [];
        setAccounts(accs);
        const stored =
          typeof window !== "undefined"
            ? localStorage.getItem("rs_selected_account") ??
              localStorage.getItem("rs_journal_account")
            : null;
        if (
          stored &&
          (stored === "all" || accs.find((a) => a.id === stored))
        ) {
          setSelectedAccountId(stored);
        } else if (accs.length === 1) {
          setSelectedAccountId(accs[0].id);
        }
      }

      // Fire MetaAPI sync in the background — don't block UI render on it
      void syncAllJournalMetaAccounts(accs);
      if (sRes.ok) {
        const j = await sRes.json();
        if (j.session) {
          const s = j.session as JournalSession;
          setSession((prev) => {
            const serverImages = normSessionImages(s.images).slice(
              0,
              JOURNAL_IMAGE_MAX
            );
            const prevImages = (prev.images ?? []).slice(0, JOURNAL_IMAGE_MAX);
            const merged: string[] = [...serverImages];
            for (const u of prevImages) {
              if (merged.length >= JOURNAL_IMAGE_MAX) break;
              if (u && !merged.includes(u)) merged.push(u);
            }
            return {
              ...s,
              checklist_done: normBoolRecord(s.checklist_done),
              rules_followed: normBoolRecord(s.rules_followed),
              images: merged,
            };
          });
        }
      }
      if (tTodayRes.ok) {
        const j = await tTodayRes.json();
        setTodayTrades(j.trades ?? []);
      }
      const allClosed: JournalTradeRow[] = [];
      const seenIds = new Set<string>();
      let p = 1;
      for (;;) {
        const r = await fetch(
          `/api/journal/trades?status=closed&close_from=${encodeURIComponent(sinceClose)}&sort=close_time&pageSize=500&page=${p}`
        );
        if (!r.ok) break;
        const j = await r.json();
        const batch = (j.trades ?? []) as JournalTradeRow[];
        for (const t of batch) {
          if (seenIds.has(t.id)) continue;
          seenIds.add(t.id);
          allClosed.push(t);
        }
        if (batch.length < 500) break;
        if (typeof j.total === "number" && allClosed.length >= j.total) break;
        p += 1;
        if (p > 100) break;
      }
      setAllTrades(allClosed);
      if (allSessRes.ok) {
        const j = await allSessRes.json();
        setAllSessions(j.sessions ?? []);
      }
      if (strRes.ok) {
        const j = await strRes.json();
        setStrategies(j.strategies ?? []);
      }
      if (clRes.ok) {
        const j = await clRes.json();
        setChecklist(j.items ?? []);
      }
      if (rRes.ok) {
        const j = await rRes.json();
        setRules(j.rules ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [isMock]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading) return;
    const hasSessionData = !!(session.bias || session.notes?.trim() ||
      Object.values(session.checklist_done ?? {}).some(v => v));
    const hasTrades = todayTrades.length > 0;
    if (hasSessionData || hasTrades) setDayStarted(true);
  }, [loading, session, todayTrades]);

  // Auto-save session with 800ms debounce
  const scheduleSessionSave = useCallback(
    (patch: Partial<JournalSession>) => {
      if (isMock) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSaving(true);
        try {
          await fetch("/api/journal/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...patch, session_date: getTodayStr() }),
          });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        } finally {
          setSaving(false);
        }
      }, 800);
    },
    [isMock]
  );

  const flushSessionSave = useCallback(
    async (override?: Partial<JournalSession>) => {
      if (isMock) return;
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      setSaving(true);
      try {
        await fetch("/api/journal/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...sessionRef.current,
            ...override,
            session_date: getTodayStr(),
          }),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } finally {
        setSaving(false);
      }
    },
    [isMock]
  );

  const updateSession = useCallback(
    (patch: JournalSessionPatch) => {
      setSession((prev) => {
        const part = typeof patch === "function" ? patch(prev) : patch;
        const next = { ...prev, ...part };
        scheduleSessionSave(next);
        return next;
      });
    },
    [scheduleSessionSave]
  );

  const handleSync = async () => {
    if (isMock || syncing) return;
    if (!accounts.some((a) => a.metaapi_account_id)) {
      toast.info("Nothing to sync", "Connect a broker account with MetaApi first.");
      return;
    }
    setSyncing(true);
    try {
      await load();
      toast.success("Synced", "Trades updated from your broker.");
    } catch {
      toast.error("Sync failed", "Try again in a moment.");
    } finally {
      setSyncing(false);
    }
  };

  const selectAccount = (id: string | "all") => {
    setSelectedAccountId(id);
  };

  // ── Empty state ──
  if (!loading && accounts.length === 0 && !isMock) {
    return <EmptyState onConnected={() => void load()} />;
  }

  return (
    <div className={`${jn.page} relative space-y-6`}>
      {/* Ambient page glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full opacity-[0.06] blur-3xl" style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
        <div className="absolute top-1/3 right-0 h-72 w-72 rounded-full opacity-[0.04] blur-3xl" style={{ background: "radial-gradient(circle, #38bdf8, transparent)" }} />
        <div className="absolute bottom-1/4 left-0 h-64 w-64 rounded-full opacity-[0.04] blur-3xl" style={{ background: "radial-gradient(circle, #4ade80, transparent)" }} />
      </div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap items-center gap-4"
      >
        {/* Title + subtitle */}
        <div className="min-w-0 w-full shrink-0 sm:w-auto">
          <h1
            className={jn.h1}
            style={{
              background: "linear-gradient(135deg, #4338ca 0%, #6366f1 50%, #818cf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Journal
          </h1>
          <LiveClock />
        </div>

        {/* Account selector — center */}
        <div className="flex flex-1 justify-center">
          <GlobalAccountSelector
            accounts={accounts.map((a) => ({
              id: a.id,
              nickname: a.nickname,
              status: a.status,
              platform: a.platform,
            }))}
            selectedId={selectedAccountId}
            onChange={(id) => selectAccount(id)}
            onAddAccount={
              blockRealLinks
                ? undefined
                : isMock && mockUseAppRoutes
                  ? () =>
                      interceptAction(
                        () => setAddAccountOpen(true),
                        "add a trading account"
                      )
                  : () => setAddAccountOpen(true)
            }
            isMock={blockRealLinks}
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/app/journaling/settings"
            className={jn.btnGhost}
            style={{ padding: "6px 10px" }}
          >
            <Settings2 className="h-4 w-4" />
          </Link>
          <button
            type="button"
            className={jn.btnGhost}
            disabled={syncing || isMock}
            onClick={() => void handleSync()}
            style={{ padding: "6px 12px" }}
          >
            <RefreshCw
              className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
            />
            Sync
          </button>
        </div>
      </motion.div>


      {/* Tab switcher */}
      {!loading && (
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 w-fit backdrop-blur-sm" style={{ boxShadow: "0 0 20px rgba(99,102,241,0.06)" }}>
          {(
            [
              { id: "today" as const, label: "Today", Icon: Sun },
              { id: "past" as const, label: "Past", Icon: CalendarDays },
            ] as const
          ).map(({ id: tid, label, Icon }) => (
            <button
              key={tid}
              type="button"
              onClick={() => goTab(tid)}
              className="relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{ color: tab === tid ? "#4338ca" : "#64748b" }}
            >
              {tab === tid && (
                <motion.span
                  layoutId="journal-tab-pill"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: "rgba(99,102,241,0.15)", boxShadow: "0 0 12px rgba(99,102,241,0.2)" }}
                  transition={{ type: "spring", damping: 28, stiffness: 380 }}
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 rounded-2xl bg-slate-200/70" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-200/70" />)}
          </div>
          <div className="h-40 rounded-2xl bg-slate-200/70" />
          <div className="h-32 rounded-2xl bg-slate-200/70" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {tab === "today" && !dayStarted ? (
            <StartDayScreen key="start-day" onStart={() => setDayStarted(true)} />
          ) : tab === "today" && dayStarted ? (
            <TodayTab
              key="today"
              session={session}
              todayTrades={todayTrades}
              checklist={checklist}
              rules={rules}
              updateSession={updateSession}
              onFlushSessionSave={flushSessionSave}
              settingsHref="/app/journaling/settings"
              onBiasChange={(b) => updateSession({ bias: b })}
              onKeyLevelsChange={(v) => updateSession({ key_levels: v })}
              onWatchlistChange={(tags) => updateSession({ watchlist: tags })}
              onNotesChange={(v) => updateSession({ notes: v })}
              saving={saving}
              saved={saved}
              onTradeClick={setReviewTrade}
              onSync={() => void handleSync()}
              syncing={syncing}
              isMock={isMock}
            />
          ) : (
            <PastGrid
              key="past"
              allTrades={allTrades}
              allSessions={allSessions}
              currency={
                selectedAccountId === "all"
                  ? (accounts[0]?.currency ?? "USD")
                  : (accounts.find((a) => a.id === selectedAccountId)?.currency ?? "USD")
              }
              checklist={checklist}
              rules={rules}
              isMock={isMock}
            />
          )}
        </AnimatePresence>
      )}

      {/* Trade Review Modal */}
      {reviewTrade && (
        <TradeReviewModal
          trade={reviewTrade}
          onClose={() => setReviewTrade(null)}
          strategies={strategies}
          checklist={checklist}
          rules={rules}
          isMock={isMock}
          onStrategiesChange={setStrategies}
          onChecklistChange={setChecklist}
          onRulesChange={setRules}
        />
      )}

      {/* Add Account Modal */}
      <AddAccountModal
        open={addAccountOpen}
        onClose={() => setAddAccountOpen(false)}
        onCreated={() => void load()}
      />

      {isMock && mockUseAppRoutes && (
        <DemoActionModal
          open={modalOpen}
          action={actionLabel}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
