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
              borderColor: "rgba(255,255,255,0.06)",
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
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.01, borderColor: "rgba(255,255,255,0.12)" }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-left transition-all hover:bg-white/[0.04]"
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
          <span className="font-semibold text-white">{trade.symbol}</span>
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
              ? format(parseISO(trade.open_time), "HH:mm")
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

  return (
    <motion.div
      key="today"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="relative rounded-2xl p-4 lg:p-6"
      style={{ background: "rgba(7,7,16,0.85)", border: "1px solid rgba(99,102,241,0.1)" }}
    >
      <Link
        {...settingsLinkProps}
        title="Manage checklist, rules & strategies"
        className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white lg:right-5 lg:top-5"
        aria-label="Journal settings"
      >
        <Settings2 className="h-4 w-4" />
      </Link>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,40fr)_minmax(0,35fr)_minmax(0,25fr)] lg:gap-5 lg:pr-10">
        {/* LEFT — Daily Briefing */}
        <motion.div
          className="flex min-w-0 flex-col gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0 }}
        >
          <div className="space-y-2">
            <p className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {format(new Date(), "EEEE, MMMM d")}
            </p>
            <motion.p
              className="text-sm leading-relaxed text-slate-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {quote}
            </motion.p>
          </div>

          {/* Pre-trade checklist */}
          <div
            className={`${jn.cardSm} relative space-y-3 overflow-hidden`}
            style={{
              background: "rgba(99,102,241,0.04)",
              borderColor: "rgba(99,102,241,0.2)",
              boxShadow: "0 0 24px rgba(99,102,241,0.08)",
            }}
          >
            <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-full opacity-25 blur-2xl" style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">
                Pre-trade checklist
              </h3>
              <Link
                {...settingsLinkProps}
                className="text-slate-500 transition hover:text-slate-300"
                aria-label="Checklist settings"
              >
                <Settings2 className="h-4 w-4" />
              </Link>
            </div>
            {checklistTotal === 0 ? (
              <p className="text-sm text-slate-500">
                No checklist yet.{" "}
                <Link
                  {...settingsLinkProps}
                  className="font-mono text-[#ff8c00] hover:underline"
                >
                  Add items →
                </Link>
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>
                      {checklistCompleted}/{checklistTotal} completed
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: progressColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${checklistPct}%` }}
                      transition={{ type: "spring", stiffness: 120, damping: 22 }}
                    />
                  </div>
                </div>
                <motion.ul
                  className="space-y-2"
                  variants={checklistVariants}
                  initial="hidden"
                  animate="show"
                >
                  {sortedChecklist.map((item) => {
                    const yes = checklistDoneMap[item.id] === true;
                    return (
                      <motion.li key={item.id} variants={checklistItemVariants}>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          transition={{ type: "spring", stiffness: 500, damping: 28 }}
                          onClick={() =>
                            updateSession({
                              checklist_done: {
                                ...checklistDoneMap,
                                [item.id]: !yes,
                              },
                            })
                          }
                          className="flex w-full items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                        >
                          <span
                            className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border-2 font-mono text-xs"
                            style={{
                              borderColor: yes ? "#00e676" : "#ff3c3c",
                              color: yes ? "#00e676" : "#ff3c3c",
                              background: yes
                                ? "rgba(0,230,118,0.1)"
                                : "rgba(255,60,60,0.08)",
                            }}
                          >
                            {yes ? (
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            ) : (
                              <X className="h-3.5 w-3.5" strokeWidth={3} />
                            )}
                          </span>
                          <span
                            className={`text-sm text-slate-200 ${
                              yes ? "line-through decoration-slate-600" : ""
                            }`}
                          >
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

          {/* Today&apos;s rules */}
          <div
            className={`${jn.cardSm} relative space-y-3 overflow-hidden`}
            style={{
              background: "rgba(245,158,11,0.03)",
              borderColor: "rgba(245,158,11,0.18)",
              boxShadow: "0 0 22px rgba(245,158,11,0.07)",
            }}
          >
            <div className="pointer-events-none absolute right-0 top-0 h-16 w-16 rounded-full opacity-20 blur-2xl" style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }} />
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">
                Today&apos;s rules
              </h3>
              <Link
                {...settingsLinkProps}
                className="text-slate-500 transition hover:text-slate-300"
                aria-label="Rules settings"
              >
                <Settings2 className="h-4 w-4" />
              </Link>
            </div>
            {rulesTotal === 0 ? (
              <p className="text-sm text-slate-500">
                No rules set.{" "}
                <Link
                  {...settingsLinkProps}
                  className="font-mono text-[#ff8c00] hover:underline"
                >
                  Add rules →
                </Link>
              </p>
            ) : (
              <>
                <p className="text-[11px] font-mono text-slate-500">
                  {rulesActive}/{rulesTotal} rules active
                </p>
                <div className="flex flex-wrap gap-2">
                  {sortedRules.map((rule) => {
                    const yes = rulesFollowedMap[rule.id] === true;
                    return (
                      <motion.button
                        key={rule.id}
                        type="button"
                        layout
                        onClick={() =>
                          updateSession({
                            rules_followed: {
                              ...rulesFollowedMap,
                              [rule.id]: !yes,
                            },
                          })
                        }
                        className="inline-flex max-w-full items-center gap-2 rounded-full border-2 px-3 py-1.5 text-left text-xs font-medium transition-colors duration-200"
                        style={{
                          borderColor: yes ? "#00e676" : "#ff3c3c",
                          color: yes ? "#00e676" : "#ff3c3c",
                          background: yes
                            ? "rgba(0,230,118,0.08)"
                            : "rgba(255,60,60,0.06)",
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {yes ? (
                          <Check className="h-3.5 w-3.5 flex-shrink-0" />
                        ) : (
                          <X className="h-3.5 w-3.5 flex-shrink-0" />
                        )}
                        <span className="truncate">{rule.text}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Bias + key levels + watchlist */}
          <div
            className={`${jn.cardSm} relative space-y-3 overflow-hidden`}
            style={{
              background: "rgba(56,189,248,0.03)",
              borderColor: "rgba(56,189,248,0.18)",
              boxShadow: "0 0 22px rgba(56,189,248,0.07)",
            }}
          >
            <div className="pointer-events-none absolute right-0 top-0 h-16 w-16 rounded-full opacity-20 blur-2xl" style={{ background: "radial-gradient(circle, #38bdf8, transparent)" }} />
            <p className={jn.label}>Market bias</p>
            <div className="flex gap-1.5">
              <BiasButton
                label="Bullish"
                compact
                active={session.bias === "Bullish"}
                color="#00e676"
                onClick={() =>
                  onBiasChange(session.bias === "Bullish" ? null : "Bullish")
                }
              />
              <BiasButton
                label="Neutral"
                compact
                active={session.bias === "Neutral"}
                color="#64748b"
                onClick={() =>
                  onBiasChange(session.bias === "Neutral" ? null : "Neutral")
                }
              />
              <BiasButton
                label="Bearish"
                compact
                active={session.bias === "Bearish"}
                color="#ff3c3c"
                onClick={() =>
                  onBiasChange(session.bias === "Bearish" ? null : "Bearish")
                }
              />
            </div>
            <div>
              <p className={jn.label}>Key levels</p>
              <textarea
                className={`${jn.input} mt-1 resize-none`}
                style={{ minHeight: "4.5rem" }}
                rows={3}
                placeholder="Major S/R, session highs/lows…"
                value={session.key_levels ?? ""}
                onChange={(e) => onKeyLevelsChange(e.target.value)}
                readOnly={isMock}
              />
            </div>
            <div>
              <p className={jn.label}>Watchlist</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {(session.watchlist ?? []).map((sym) => (
                  <span
                    key={sym}
                    className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-xs font-mono text-slate-200"
                  >
                    {sym}
                    {!isMock && (
                      <button
                        type="button"
                        className="text-slate-600 hover:text-slate-300"
                        onClick={() => removeSymbol(sym)}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {!isMock && (
                <div className="mt-2 flex gap-2">
                  <input
                    className={`${jn.input} text-xs`}
                    placeholder="Symbol + Enter…"
                    value={watchInput}
                    onChange={(e) =>
                      setWatchInput(e.target.value.toUpperCase())
                    }
                    onKeyDown={(e) => e.key === "Enter" && addSymbol()}
                  />
                  <button
                    type="button"
                    className={jn.btnGhost}
                    onClick={addSymbol}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* CENTER — Session notes */}
        <motion.div
          className="flex min-w-0 flex-col gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <div
            className={`${jn.card} relative flex flex-col gap-4 overflow-hidden`}
            style={{
              background: "rgba(167,139,250,0.03)",
              borderColor: "rgba(167,139,250,0.18)",
              boxShadow: "0 0 28px rgba(167,139,250,0.08)",
            }}
          >
            <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full opacity-20 blur-2xl" style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} />
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-white">Session notes</h2>
              <SavedIndicator saving={saving} saved={saved} />
            </div>
            <textarea
              className={`${jn.input} min-h-[200px] resize-y`}
              placeholder="Free-form session notes…"
              value={session.notes ?? ""}
              onChange={(e) => onNotesChange(e.target.value)}
              onBlur={(e) =>
                onFlushSessionSave({ notes: e.target.value })
              }
              readOnly={isMock}
            />
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">
              Screenshots
            </p>
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
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                void processImageFiles(e.dataTransfer.files);
              }}
              onClick={() => !isMock && fileRef.current?.click()}
              className={`mt-2 flex min-h-[104px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center font-mono transition-colors ${
                dragOver
                  ? "border-[#ff8c00]/60 bg-[#ff8c00]/15 text-slate-100"
                  : "border-white/25 bg-white/[0.06] text-slate-200"
              } ${isMock ? "pointer-events-none opacity-50" : ""}`}
            >
              <span className="text-sm font-medium">
                {uploading
                  ? "Uploading…"
                  : "Drop screenshots here or click to upload"}
              </span>
              <span className="mt-1 text-[11px] text-slate-400">
                PNG, JPG — max {JOURNAL_IMAGE_MAX} images
              </span>
            </div>
            {(session.images ?? []).length > 0 && (
              <div className="mt-5 flex flex-col gap-6">
                {(session.images ?? [])
                  .slice(0, JOURNAL_IMAGE_MAX)
                  .map((url) => (
                    <JournalScreenshotTile
                      key={url}
                      url={url}
                      removeDisabled={isMock}
                      onRemove={
                        isMock ? undefined : () => removeImage(url)
                      }
                    />
                  ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* RIGHT — Today&apos;s trades */}
        <motion.div
          className="flex min-w-0 flex-col gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
        >
          <div
            className={`${jn.card} relative flex flex-col overflow-hidden`}
            style={{
              background: "rgba(74,222,128,0.03)",
              borderColor: "rgba(74,222,128,0.18)",
              boxShadow: "0 0 24px rgba(74,222,128,0.07)",
            }}
          >
            <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-full opacity-20 blur-2xl" style={{ background: "radial-gradient(circle, #4ade80, transparent)" }} />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Today&apos;s Trades
              </h2>
              <button
                type="button"
                className={jn.btnGhost}
                disabled={syncing}
                onClick={onSync}
                style={{ padding: "6px 10px", fontSize: "12px" }}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`}
                />
                Sync
              </button>
            </div>

            {todayTrades.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <Sun className="h-5 w-5 text-slate-600" />
                </div>
                <p className="text-sm text-slate-500">No trades today yet</p>
                <p className="mt-1 text-xs text-slate-700">
                  They&apos;ll appear here after sync
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {todayTrades.map((trade) => (
                  <TradeCard
                    key={trade.id}
                    trade={trade}
                    onClick={() => onTradeClick(trade)}
                  />
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
          <h2 className="font-display text-base font-bold text-white">
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
              color: monthPl >= 0 ? "#4ADE80" : "#F87171",
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
                    color: today ? "#fff" : stats ? (stats.pl >= 0 ? "#4ADE80" : "#F87171") : "#475569",
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
                      style={{ color: stats.pl >= 0 ? "#4ADE80" : "#F87171" }}
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
              <div className="mt-5 border-t border-white/[0.06] pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-white">
                    {format(parseISO(selectedDay), "EEEE, MMMM d")}
                  </h3>
                  <span
                    className="font-mono text-sm font-bold"
                    style={{
                      color: selectedDayPl >= 0 ? "#4ADE80" : "#F87171",
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
                          className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 hover:bg-white/[0.04] transition-colors"
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
                            <span className="text-sm font-medium text-slate-200">
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
                              color: net >= 0 ? "#4ADE80" : "#F87171",
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
        ? "border border-[#6366f1]/40 bg-[#6366f1]/15 text-white"
        : "border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
    }`;

  const statCard =
    "relative overflow-hidden rounded-xl p-3 backdrop-blur-sm";
  const statCardBg = { background: "rgba(255,255,255,0.02)" } as const;

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
          <h2 className="font-display text-base font-bold text-white">
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
              className="group inline-flex items-center gap-2 rounded-xl border border-[#6366f1]/40 bg-gradient-to-r from-[#6366f1]/20 to-[#a855f7]/20 px-4 py-2 font-mono text-xs font-semibold text-[#c7d2fe] shadow-[0_0_0_1px_rgba(99,102,241,0.15)] transition-all hover:border-[#6366f1]/70 hover:from-[#6366f1]/30 hover:to-[#a855f7]/30 hover:text-white"
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
          <p className="mt-1 font-[family-name:var(--font-mono)] text-lg font-semibold text-white">{stats.count}</p>
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
          <p className="mt-1 font-[family-name:var(--font-mono)] text-lg font-bold" style={{ color: stats.totalPl >= 0 ? "#4ade80" : "#f87171" }}>
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
        style={{ background: "rgba(255,255,255,0.02)" }}
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
                <tr className="border-b border-white/[0.07] text-[10px] font-mono uppercase tracking-wider text-slate-500">
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
                      className={`cursor-pointer border-b border-white/[0.04] transition-colors hover:bg-white/[0.04] ${
                        win
                          ? "border-l-2 border-l-[#00e676]/40"
                          : loss
                            ? "border-l-2 border-l-[#ff3c3c]/40"
                            : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-[family-name:var(--font-mono)] text-xs text-slate-300">
                        {format(
                          parseISO(t.close_time ?? t.open_time),
                          "MMM d, HH:mm"
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">
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
                                ? "#00e676"
                                : t.pips < 0
                                  ? "#ff3c3c"
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
                          color: net >= 0 ? "#00e676" : "#ff3c3c",
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
                              className="rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-400"
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
                          <span className="inline-flex cursor-not-allowed rounded-lg border border-white/[0.08] px-3 py-1 text-xs text-slate-600 opacity-60">
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] px-4 py-3">
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
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#6366f1]/10 to-transparent">
          <TrendingUp className="h-7 w-7 text-[#6366f1]" />
        </div>
        <h2 className="font-display text-2xl font-bold text-white">
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
  const [tab, setTab] = useState<"today" | "calendar" | "trades">("today");
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
    if (t === "calendar" || t === "history") setTab("calendar");
    else if (t === "trades") setTab("trades");
    else setTab("today");
  }, [searchParams]);

  const goTab = (next: "today" | "calendar" | "trades") => {
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
      const aRes = await fetch("/api/journal/accounts");
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

      await syncAllJournalMetaAccounts(accs);

      const { from: todayCloseFrom, to: todayCloseTo } = localDayBoundsIso(today);
      const sinceClose = localYearsAgoStartIso(3);

      const [sRes, tTodayRes, strRes, clRes, rRes] = await Promise.all([
        fetch(`/api/journal/sessions?date=${today}`),
        fetch(
          `/api/journal/trades?status=closed&close_from=${encodeURIComponent(todayCloseFrom)}&close_to=${encodeURIComponent(todayCloseTo)}&sort=close_time&pageSize=200`
        ),
        fetch("/api/journal/strategies"),
        fetch("/api/journal/checklist"),
        fetch("/api/journal/rules"),
      ]);
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
              background: "linear-gradient(135deg, #e0e7ff 0%, #a78bfa 50%, #6366f1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Journal
          </h1>
          <p className="mt-1.5 max-w-xl text-sm font-mono text-slate-400">
            Today&apos;s session, calendar, and trade history.
          </p>
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
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1 w-fit backdrop-blur-sm" style={{ boxShadow: "0 0 20px rgba(99,102,241,0.06)" }}>
          {(
            [
              { id: "today" as const, label: "Today", Icon: Sun },
              { id: "calendar" as const, label: "Calendar", Icon: CalendarDays },
              { id: "trades" as const, label: "Trades", Icon: BarChart2 },
            ] as const
          ).map(({ id: tid, label, Icon }) => (
            <button
              key={tid}
              type="button"
              onClick={() => goTab(tid)}
              className="relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{ color: tab === tid ? "#fff" : "#64748b" }}
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

      {/* Loading */}
      {loading ? (
        <p className="font-mono text-sm text-slate-500">Loading…</p>
      ) : (
        <AnimatePresence mode="wait">
          {tab === "today" ? (
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
          ) : tab === "calendar" ? (
            <CalendarTab
              key="calendar"
              allTrades={allTrades}
              currency={
                selectedAccountId === "all"
                  ? (accounts[0]?.currency ?? "USD")
                  : (accounts.find((a) => a.id === selectedAccountId)?.currency ?? "USD")
              }
              isMock={isMock}
              mockUseAppRoutes={mockUseAppRoutes}
            />
          ) : (
            <TradesTab
              key="trades"
              allTrades={allTrades}
              isMock={isMock}
              mockUseAppRoutes={mockUseAppRoutes}
              basePath={journalTradeBase}
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
