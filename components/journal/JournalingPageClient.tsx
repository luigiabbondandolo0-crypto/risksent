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
import { jn } from "@/lib/journal/jnClasses";
import { GlobalAccountSelector } from "@/components/shared/GlobalAccountSelector";
import { AddAccountModal } from "@/components/journal/AddAccountModal";
import { TradeReviewModal } from "@/components/journal/TradeReviewModal";
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

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ACCOUNT: JournalAccountPublic = {
  id: "demo-account",
  user_id: "demo-user",
  nickname: "Demo Account (IC Markets)",
  broker_server: "ICMarkets-Demo",
  account_number: "12345678",
  platform: "MT5",
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
};

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

function getDayStats(trades: JournalTradeRow[], dateStr: string) {
  const day = trades.filter(
    (t) => t.close_time?.slice(0, 10) === dateStr && t.status === "closed"
  );
  const pl = day.reduce(
    (s, t) => s + (t.pl ?? 0) + (t.commission ?? 0) + (t.swap ?? 0),
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
}: {
  label: JournalBias;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      animate={active ? { scale: 1.04 } : { scale: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 400 }}
      onClick={onClick}
      className="flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-all"
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
  const net = (trade.pl ?? 0) + (trade.commission ?? 0) + (trade.swap ?? 0);
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
}: {
  session: Partial<JournalSession>;
  todayTrades: JournalTradeRow[];
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
}) {
  const [watchInput, setWatchInput] = useState("");

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

  return (
    <motion.div
      key="today"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="flex gap-5"
    >
      {/* LEFT: Session Planner (60%) */}
      <div className="flex w-3/5 flex-col gap-4">
        <div className={jn.card}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Session Planner
            </h2>
            <SavedIndicator saving={saving} saved={saved} />
          </div>

          {/* Market Bias */}
          <div className="mb-4">
            <p className={jn.label}>Market Bias</p>
            <div className="mt-2 flex gap-2">
              <BiasButton
                label="Bullish"
                active={session.bias === "Bullish"}
                color="#00e676"
                onClick={() =>
                  onBiasChange(session.bias === "Bullish" ? null : "Bullish")
                }
              />
              <BiasButton
                label="Neutral"
                active={session.bias === "Neutral"}
                color="#64748b"
                onClick={() =>
                  onBiasChange(session.bias === "Neutral" ? null : "Neutral")
                }
              />
              <BiasButton
                label="Bearish"
                active={session.bias === "Bearish"}
                color="#ff3c3c"
                onClick={() =>
                  onBiasChange(session.bias === "Bearish" ? null : "Bearish")
                }
              />
            </div>
          </div>

          {/* Key Levels */}
          <div className="mb-4">
            <p className={jn.label}>Key Levels</p>
            <textarea
              className={`${jn.input} mt-1 min-h-[72px] resize-none`}
              placeholder="Major S/R levels, session highs/lows…"
              value={session.key_levels ?? ""}
              onChange={(e) => onKeyLevelsChange(e.target.value)}
              readOnly={isMock}
            />
          </div>

          {/* Watchlist */}
          <div className="mb-4">
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
                  placeholder="Type symbol + Enter…"
                  value={watchInput}
                  onChange={(e) => setWatchInput(e.target.value.toUpperCase())}
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

          {/* Notes */}
          <div>
            <p className={jn.label}>Notes</p>
            <textarea
              className={`${jn.input} mt-1 min-h-[100px] resize-none`}
              placeholder="Today's macro context, news events, trading plan…"
              value={session.notes ?? ""}
              onChange={(e) => onNotesChange(e.target.value)}
              readOnly={isMock}
            />
          </div>
        </div>
      </div>

      {/* RIGHT: Today's Trades (40%) */}
      <div className="flex w-2/5 flex-col gap-4">
        <div className={`${jn.card} flex flex-col`}>
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
      </div>
    </motion.div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────

function HistoryTab({
  allTrades,
  isMock = false,
}: {
  allTrades: JournalTradeRow[];
  isMock?: boolean;
}) {
  const [month, setMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const mockMonthInitialized = useRef(false);

  useEffect(() => {
    if (!isMock || allTrades.length === 0 || mockMonthInitialized.current) return;
    const fc = allTrades.find((t) => t.close_time)?.close_time;
    if (fc) {
      setMonth(startOfMonth(parseISO(fc.slice(0, 10))));
      mockMonthInitialized.current = true;
    }
  }, [isMock, allTrades]);

  const tradeLinkBase = isMock ? "/mock/journal/trade" : "/app/journaling/trade";

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
      (t) => t.close_time?.slice(0, 10) === selectedDay && t.status === "closed"
    );
  }, [selectedDay, allTrades]);

  const selectedDayPl = selectedDayTrades.reduce(
    (s, t) => s + (t.pl ?? 0) + (t.commission ?? 0) + (t.swap ?? 0),
    0
  );

  // Monthly stats
  const monthStr = format(month, "yyyy-MM");
  const monthTrades = allTrades.filter(
    (t) => t.close_time?.slice(0, 7) === monthStr && t.status === "closed"
  );
  const monthPl = monthTrades.reduce(
    (s, t) => s + (t.pl ?? 0) + (t.commission ?? 0) + (t.swap ?? 0),
    0
  );
  const monthWins = monthTrades.filter(
    (t) => (t.pl ?? 0) + (t.commission ?? 0) + (t.swap ?? 0) > 0
  ).length;
  const monthWinRate =
    monthTrades.length > 0
      ? ((monthWins / monthTrades.length) * 100).toFixed(0)
      : "—";

  const dayStats = useMemo(() => {
    const map: Record<string, { pl: number; count: number }> = {};
    allTrades.forEach((t) => {
      if (!t.close_time || t.status !== "closed") return;
      const d = t.close_time.slice(0, 10);
      if (!map[d]) map[d] = { pl: 0, count: 0 };
      map[d].pl +=
        (t.pl ?? 0) + (t.commission ?? 0) + (t.swap ?? 0);
      map[d].count++;
    });
    return map;
  }, [allTrades]);

  return (
    <motion.div
      key="history"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div className={jn.card}>
        {/* Month navigation */}
        <div className="mb-5 flex items-center justify-between">
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
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Total Trades",
              value: monthTrades.length.toString(),
              color: "#94a3b8",
            },
            {
              label: "Win Rate",
              value: monthTrades.length > 0 ? `${monthWinRate}%` : "—",
              color: "#22d3ee",
            },
            {
              label: "Total P&L",
              value:
                monthTrades.length > 0
                  ? `${monthPl >= 0 ? "+" : ""}${monthPl.toFixed(2)}`
                  : "—",
              color: monthPl >= 0 ? "#00e676" : "#ff3c3c",
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
                            t.close_time?.slice(0, 7) === monthStr &&
                            t.status === "closed"
                        )
                        .reduce(
                          (acc, t) => {
                            const d = t.close_time!.slice(0, 10);
                            acc[d] =
                              (acc[d] ?? 0) +
                              (t.pl ?? 0) +
                              (t.commission ?? 0) +
                              (t.swap ?? 0);
                            return acc;
                          },
                          {} as Record<string, number>
                        )
                    )
                  )
                );
                if (dayPls.length === 0) return "—";
                const best = Math.max(...dayPls);
                return `+${best.toFixed(0)}`;
              })(),
              color: "#00e676",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className={jn.cardSm}>
              <p className={jn.label}>{label}</p>
              <p
                className="mt-1 font-display text-xl font-bold"
                style={{ color }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Day headers */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div
              key={d}
              className="py-1 text-center text-[10px] font-mono font-semibold text-slate-600 uppercase"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
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
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() =>
                  setSelectedDay(isSelected ? null : ds)
                }
                className="flex aspect-square flex-col items-center justify-center rounded-xl border text-center transition-all"
                style={{
                  borderColor: isSelected
                    ? "rgba(34,211,238,0.4)"
                    : today
                      ? "rgba(255,255,255,0.15)"
                      : stats
                        ? stats.pl >= 0
                          ? "rgba(0,230,118,0.2)"
                          : "rgba(255,60,60,0.2)"
                        : "rgba(255,255,255,0.04)",
                  background: isSelected
                    ? "rgba(34,211,238,0.08)"
                    : stats
                      ? stats.pl >= 0
                        ? `rgba(0,230,118,${Math.min(0.18, 0.06 + Math.abs(stats.pl) / 2000)})`
                        : `rgba(255,60,60,${Math.min(0.18, 0.06 + Math.abs(stats.pl) / 2000)})`
                      : "transparent",
                }}
              >
                <span
                  className="text-xs font-mono"
                  style={{
                    color: today ? "#fff" : stats ? (stats.pl >= 0 ? "#00e676" : "#ff3c3c") : "#475569",
                    fontWeight: today ? 700 : 400,
                  }}
                >
                  {format(day, "d")}
                </span>
                {stats && (
                  <div className="mt-0.5 flex flex-col items-center gap-0">
                    <span
                      className="text-[9px] font-mono leading-tight"
                      style={{ color: stats.pl >= 0 ? "#00e676" : "#ff3c3c" }}
                    >
                      {stats.pl >= 0 ? "+" : ""}
                      {stats.pl.toFixed(0)}
                    </span>
                    <span className="text-[8px] font-mono leading-tight text-slate-500">
                      {stats.count} {stats.count === 1 ? "trade" : "trades"}
                    </span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

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
                      color: selectedDayPl >= 0 ? "#00e676" : "#ff3c3c",
                    }}
                  >
                    {selectedDayPl >= 0 ? "+" : ""}
                    {selectedDayPl.toFixed(2)}
                  </span>
                </div>
                {selectedDayTrades.length === 0 ? (
                  <p className="text-sm text-slate-600">No closed trades this day.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayTrades.map((t) => {
                      const net =
                        (t.pl ?? 0) +
                        (t.commission ?? 0) +
                        (t.swap ?? 0);
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
                              color: net >= 0 ? "#00e676" : "#ff3c3c",
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
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#ff3c3c]/10 to-transparent">
          <TrendingUp className="h-7 w-7 text-[#ff3c3c]" />
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

export function JournalingPageClient({ isMock = false }: { isMock?: boolean }) {
  const [accounts, setAccounts] = useState<JournalAccountPublic[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | "all">(
    "all"
  );
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [tab, setTab] = useState<"today" | "history">("today");
  const [loading, setLoading] = useState(!isMock);
  const [syncing, setSyncing] = useState(false);

  // Session state
  const [session, setSession] = useState<Partial<JournalSession>>(
    isMock ? MOCK_SESSION : {}
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

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

  // Read tab from URL ?tab=history on first load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "history") setTab("history");
    }
  }, []);

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
      const [aRes, sRes, tTodayRes, allRes, strRes, clRes, rRes] =
        await Promise.all([
          fetch("/api/journal/accounts"),
          fetch(`/api/journal/sessions?date=${today}`),
          fetch(
            `/api/journal/trades?status=closed&from=${today}T00:00:00Z&to=${today}T23:59:59Z&pageSize=50`
          ),
          fetch("/api/journal/trades?pageSize=500"),
          fetch("/api/journal/strategies"),
          fetch("/api/journal/checklist"),
          fetch("/api/journal/rules"),
        ]);

      if (aRes.ok) {
        const j = await aRes.json();
        const accs: JournalAccountPublic[] = j.accounts ?? [];
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
      if (sRes.ok) {
        const j = await sRes.json();
        if (j.session) setSession(j.session);
      }
      if (tTodayRes.ok) {
        const j = await tTodayRes.json();
        setTodayTrades(j.trades ?? []);
      }
      if (allRes.ok) {
        const j = await allRes.json();
        setAllTrades(j.trades ?? []);
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

  const updateSession = useCallback(
    (patch: Partial<JournalSession>) => {
      setSession((prev) => {
        const next = { ...prev, ...patch };
        scheduleSessionSave(next);
        return next;
      });
    },
    [scheduleSessionSave]
  );

  const handleSync = async () => {
    if (isMock || syncing) return;
    const target =
      selectedAccountId === "all"
        ? accounts[0]
        : accounts.length === 1
          ? accounts[0]
          : accounts.find((a) => a.id === selectedAccountId);
    if (!target) return;
    setSyncing(true);
    try {
      await fetch(`/api/journal/accounts/${target.id}/sync`, {
        method: "POST",
      });
      await load();
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
    <div className={`${jn.page} space-y-6`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-center gap-4"
      >
        {/* Title */}
        <h1 className={jn.h1}>Journal</h1>

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
            onAddAccount={isMock ? undefined : () => setAddAccountOpen(true)}
            isMock={isMock}
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link
            href={isMock ? "#" : "/app/journaling/settings"}
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

      {/* Mock banner */}
      {isMock && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 rounded-xl border border-[#ff8c00]/30 bg-[#ff8c00]/10 px-4 py-2.5 text-sm text-[#ff8c00] font-mono"
        >
          <TrendingDown className="h-4 w-4 flex-shrink-0" />
          Demo mode — showing sample data. Sign up to connect your real account.
        </motion.div>
      )}

      {/* Tab switcher */}
      {!loading && (
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 w-fit">
          {(["today", "history"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{ color: tab === t ? "#fff" : "#64748b" }}
            >
              {tab === t && (
                <motion.span
                  layoutId="journal-tab-pill"
                  className="absolute inset-0 rounded-lg bg-white/[0.06]"
                  transition={{ type: "spring", damping: 28, stiffness: 380 }}
                />
              )}
              {t === "today" ? (
                <Sun className="relative z-10 h-3.5 w-3.5" />
              ) : (
                <CalendarDays className="relative z-10 h-3.5 w-3.5" />
              )}
              <span className="relative z-10 capitalize">{t}</span>
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
            <HistoryTab key="history" allTrades={allTrades} isMock={isMock} />
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
    </div>
  );
}
