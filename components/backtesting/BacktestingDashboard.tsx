"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  LineChart,
  Plus,
  TrendingUp,
  BarChart3,
  Activity,
  Target,
  FlaskConical,
  Layers,
} from "lucide-react";
import {
  AreaSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  LineSeries,
} from "lightweight-charts";
import type { BtSessionRow, StrategyWithStats } from "@/lib/backtesting/btTypes";
import { buildDemoBacktestingSeed } from "@/lib/demo/demoBacktestingSeed";
import { useDemoAction } from "@/hooks/useDemoAction";
import { DemoActionModal } from "@/components/demo/DemoActionModal";
import { bt } from "./btClasses";

type Props = {
  basePath: string;
  subscriptionDemo?: boolean;
};

// ─── Animated number (same pattern as dashboard) ──────────────────────────────
function AnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}: {
  value: number | null | undefined;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value == null) return;
    const duration = 900;
    const start = performance.now();
    const to = value;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  if (value == null) return <span className={className}>—</span>;
  return (
    <span className={`${className} tabular-nums`}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// ─── Cumulative P&L chart using lightweight-charts ────────────────────────────
type CumulativePt = { time: UTCTimestamp; value: number };

function CumulativePLChart({ sessions }: { sessions: BtSessionRow[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  const points = useMemo<CumulativePt[]>(() => {
    const sorted = [...sessions]
      .filter((s) => s.created_at)
      .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
    let running = 0;
    const pts: CumulativePt[] = [];
    for (const s of sorted) {
      const pl = s.current_balance - s.initial_balance;
      running += pl;
      const ts = Math.floor(new Date(s.created_at!).getTime() / 1000) as UTCTimestamp;
      pts.push({ time: ts, value: running });
    }
    return pts;
  }, [sessions]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || points.length === 0) return;

    const rect = el.getBoundingClientRect();
    const w = Math.max(rect.width, 280);
    const h = Math.max(rect.height, 160);

    const chart = createChart(el, {
      width: w,
      height: h,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#64748b",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.06)",
        scaleMargins: { top: 0.15, bottom: 0.1 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.06)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 4,
        barSpacing: 24,
        minBarSpacing: 8,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: false,
      handleScale: false,
    });

    const isPositive = points.length > 0 && points[points.length - 1]!.value >= 0;
    const topColor = isPositive ? "rgba(56,189,248,0.22)" : "rgba(248,113,113,0.18)";
    const lineColor = isPositive ? "#38bdf8" : "#f87171";

    const series = chart.addSeries(AreaSeries, {
      topColor,
      bottomColor: "rgba(0,0,0,0)",
      lineColor,
      lineWidth: 2,
      crosshairMarkerRadius: 4,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    series.setData(points);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      const c = containerRef.current;
      if (!c || !chartRef.current) return;
      const r = c.getBoundingClientRect();
      chartRef.current.applyOptions({
        width: Math.max(r.width, 280),
        height: Math.max(r.height, 160),
      });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [points]);

  if (points.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{ height: "180px" }}
    />
  );
}

// ─── Strategy sparkline (mini lightweight-charts line per strategy) ────────────
function StrategySparkline({
  winRate,
  totalPl,
  sessions,
  strategyId,
}: {
  winRate: number | null;
  totalPl: number;
  sessions: BtSessionRow[];
  strategyId: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const points = useMemo<CumulativePt[]>(() => {
    const sorted = [...sessions]
      .filter((s) => s.strategy_id === strategyId && s.created_at)
      .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));

    if (sorted.length === 0) return [];

    let running = 0;
    const pts: CumulativePt[] = [];

    // Anchor at 0 start
    const firstTs = Math.floor(
      new Date(sorted[0]!.created_at!).getTime() / 1000 - 86400
    ) as UTCTimestamp;
    pts.push({ time: firstTs, value: 0 });

    for (const s of sorted) {
      running += s.current_balance - s.initial_balance;
      const ts = Math.floor(new Date(s.created_at!).getTime() / 1000) as UTCTimestamp;
      pts.push({ time: ts, value: running });
    }
    return pts;
  }, [sessions, strategyId]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || points.length < 2) return;

    const rect = el.getBoundingClientRect();
    const w = Math.max(rect.width, 80);
    const h = 40;

    const chart = createChart(el, {
      width: w,
      height: h,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "transparent",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      crosshair: { mode: 0 },
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: false },
      timeScale: { visible: false },
      handleScroll: false,
      handleScale: false,
    });

    const isPos = totalPl >= 0;
    const series = chart.addSeries(LineSeries, {
      color: isPos ? "#38bdf8" : "#f87171",
      lineWidth: 1,
      crosshairMarkerVisible: false,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    series.setData(points);
    chart.timeScale().fitContent();

    chartRef.current = chart;

    const ro = new ResizeObserver(() => {
      const c = containerRef.current;
      if (!c || !chartRef.current) return;
      const r = c.getBoundingClientRect();
      chartRef.current.applyOptions({ width: Math.max(r.width, 80) });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [points, totalPl]);

  if (points.length < 2) return null;

  return (
    <div
      ref={containerRef}
      style={{ width: "80px", height: "40px", flexShrink: 0 }}
    />
  );
}

// ─── NavControl (unchanged) ───────────────────────────────────────────────────
function NavControl({
  href,
  className,
  children,
  subscriptionDemo,
  interceptAction,
  actionLabel,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  subscriptionDemo: boolean;
  interceptAction: (cb: () => void, label?: string) => void;
  actionLabel: string;
}) {
  const router = useRouter();
  if (subscriptionDemo) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => interceptAction(() => router.push(href), actionLabel)}
      >
        {children}
      </button>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cfg =
    s === "completed"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : s === "active" || s === "in_progress"
      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
      : "border-slate-600/50 bg-slate-800/50 text-slate-400";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono font-medium ${cfg}`}>
      {status}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function BacktestingDashboard({ basePath, subscriptionDemo = false }: Props) {
  const { interceptAction, modalOpen, actionLabel, closeModal } = useDemoAction();
  const [strategies, setStrategies] = useState<StrategyWithStats[]>([]);
  const [sessions, setSessions] = useState<BtSessionRow[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (subscriptionDemo) {
      const seed = buildDemoBacktestingSeed();
      setStrategies(seed.strategies);
      setSessions(seed.sessions);
      setErr(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const [rs, se] = await Promise.all([
        fetch("/api/backtesting/strategies"),
        fetch("/api/backtesting/sessions"),
      ]);
      if (!rs.ok || !se.ok) {
        setErr("Unauthorized or failed to load. Sign in to use backtesting.");
        return;
      }
      const sj = await rs.json();
      const ej = await se.json();
      setStrategies(sj.strategies ?? []);
      setSessions(ej.sessions ?? []);
    } finally {
      setLoading(false);
    }
  }, [subscriptionDemo]);

  useEffect(() => {
    void load();
  }, [load]);

  const sessionsByStrategy = useMemo(() => {
    const m = new Map<string, BtSessionRow[]>();
    for (const s of sessions) {
      const arr = m.get(s.strategy_id) ?? [];
      arr.push(s);
      m.set(s.strategy_id, arr);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    }
    return m;
  }, [sessions]);

  // Aggregate KPIs
  const kpi = useMemo(() => {
    const totalStrategies = strategies.length;
    const totalSessions = sessions.length;
    const avgWinRate =
      strategies.filter((s) => s.win_rate_pct != null).length > 0
        ? strategies
            .filter((s) => s.win_rate_pct != null)
            .reduce((a, s) => a + s.win_rate_pct!, 0) /
          strategies.filter((s) => s.win_rate_pct != null).length
        : null;
    const totalPl = strategies.reduce((a, s) => a + s.total_pl, 0);
    const totalTrades = strategies.reduce((a, s) => a + s.total_trades, 0);
    return { totalStrategies, totalSessions, avgWinRate, totalPl, totalTrades };
  }, [strategies, sessions]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`${bt.page} space-y-6 animate-fade-in`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 rounded-xl bg-slate-800/70 animate-pulse" />
            <div className="h-3 w-72 rounded bg-slate-800/50 animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 rounded-xl bg-slate-800/50 animate-pulse" />
            <div className="h-10 w-28 rounded-xl bg-slate-800/40 animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-800/40 animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-800/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ─── Error state ───────────────────────────────────────────────────────────
  if (err) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-400 font-mono">{err}</p>
        <Link href="/login" className={bt.btnPrimary}>
          Sign in
        </Link>
      </div>
    );
  }

  const hasData = strategies.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`${bt.page} space-y-6 lg:space-y-8`}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className={bt.h1}>Backtesting</h1>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-cyan-300 tracking-wider">
              LAB
            </span>
          </div>
          <p className={bt.sub}>
            Strategies, replay sessions, and historical performance analytics.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <NavControl
            href={`${basePath}/strategy/new`}
            className={bt.btnPrimary}
            subscriptionDemo={subscriptionDemo}
            interceptAction={interceptAction}
            actionLabel="create a new strategy"
          >
            <Plus className="h-4 w-4" />
            New strategy
          </NavControl>
          <NavControl
            href={`${basePath}/session/new`}
            className={bt.btnGhost}
            subscriptionDemo={subscriptionDemo}
            interceptAction={interceptAction}
            actionLabel="start a new backtesting session"
          >
            <LineChart className="h-4 w-4" />
            New session
          </NavControl>
        </div>
      </header>

      {/* ── KPI summary row ────────────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Strategies",
            icon: <Layers className="h-4 w-4 text-indigo-400" />,
            value: kpi.totalStrategies,
            decimals: 0,
            color: "text-white",
            sub: "total defined",
          },
          {
            label: "Sessions",
            icon: <FlaskConical className="h-4 w-4 text-cyan-400" />,
            value: kpi.totalSessions,
            decimals: 0,
            color: "text-cyan-300",
            sub: "total run",
          },
          {
            label: "Avg win rate",
            icon: <Target className="h-4 w-4 text-emerald-400" />,
            value: kpi.avgWinRate,
            decimals: 1,
            suffix: "%",
            color: kpi.avgWinRate != null && kpi.avgWinRate >= 50 ? "text-emerald-400" : "text-amber-400",
            sub: "across strategies",
          },
          {
            label: "Total P&L",
            icon: <TrendingUp className="h-4 w-4 text-slate-400" />,
            value: kpi.totalPl,
            decimals: 2,
            prefix: kpi.totalPl >= 0 ? "+" : "",
            color: kpi.totalPl >= 0 ? "text-emerald-400" : "text-red-400",
            sub: `${kpi.totalTrades} total trades`,
          },
        ].map(({ label, icon, value, decimals, prefix = "", suffix = "", color, sub }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3, ease: "easeOut" }}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="rs-card-accent p-5 shadow-rs-soft"
          >
            <div className="flex items-center justify-between">
              <span className="rs-kpi-label">{label}</span>
              {icon}
            </div>
            <div className={`mt-2 text-2xl font-bold font-display ${color}`}>
              {value == null || (typeof value === "number" && isNaN(value)) ? (
                <span className="text-slate-500">—</span>
              ) : (
                <AnimatedNumber
                  value={typeof value === "number" ? value : null}
                  decimals={decimals}
                  prefix={prefix}
                  suffix={suffix}
                  className={color}
                />
              )}
            </div>
            <p className="mt-0.5 text-[11px] font-mono text-slate-500">{sub}</p>
          </motion.div>
        ))}
      </section>

      {/* ── Cumulative P&L chart (lightweight-charts) ─────────────────────── */}
      <AnimatePresence>
        {sessions.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.28, duration: 0.35, ease: "easeOut" }}
            className="rs-card p-5 sm:p-6 shadow-rs-soft"
          >
            <div className="mb-1 flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span className="text-base font-semibold font-display tracking-tight text-slate-100">
                Cumulative P&L
              </span>
            </div>
            <p className="mb-5 text-xs font-mono text-slate-500">
              Running total across all backtesting sessions by date.
            </p>
            <CumulativePLChart sessions={sessions} />
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Strategies list ────────────────────────────────────────────────── */}
      <section className="space-y-3">
        {!hasData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="rs-card flex flex-col items-center gap-5 px-6 py-14 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10">
              <BarChart3 className="h-7 w-7 text-indigo-400" />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-slate-100">
                No strategies yet
              </p>
              <p className="mt-1 text-sm font-mono text-slate-500">
                Create a strategy to organise your backtesting sessions and track long-term edge.
              </p>
            </div>
            <NavControl
              href={`${basePath}/strategy/new`}
              className={bt.btnPrimary}
              subscriptionDemo={subscriptionDemo}
              interceptAction={interceptAction}
              actionLabel="create a strategy"
            >
              <Plus className="h-4 w-4" />
              Create your first strategy
            </NavControl>
          </motion.div>
        )}

        {strategies.map((st, idx) => {
          const isOpen = expanded.has(st.id);
          const sess = sessionsByStrategy.get(st.id) ?? [];
          const plPositive = st.total_pl >= 0;

          return (
            <motion.div
              key={st.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.06, duration: 0.3, ease: "easeOut" }}
            >
              <div className="rs-card overflow-hidden">
                {/* Strategy header row */}
                <button
                  type="button"
                  onClick={() => toggle(st.id)}
                  className="flex w-full items-center gap-3 p-5 text-left transition-colors hover:bg-white/[0.02]"
                >
                  {/* Expand icon */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03]">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                  </div>

                  {/* Name + description */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display text-base font-bold text-white">
                        {st.name}
                      </h2>
                      {st.completed_session_count > 0 && (
                        <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                          {st.completed_session_count} completed
                        </span>
                      )}
                    </div>
                    {st.description && (
                      <p className="mt-0.5 truncate text-xs font-mono text-slate-500">
                        {st.description}
                      </p>
                    )}
                  </div>

                  {/* Sparkline */}
                  <div className="hidden sm:block opacity-70">
                    <StrategySparkline
                      winRate={st.win_rate_pct}
                      totalPl={st.total_pl}
                      sessions={sessions}
                      strategyId={st.id}
                    />
                  </div>

                  {/* Stats grid */}
                  <div className="hidden md:grid shrink-0 grid-cols-4 gap-x-6 text-right text-[11px] font-mono">
                    <div>
                      <p className="text-slate-500">Sessions</p>
                      <p className="mt-0.5 font-semibold text-slate-200">{st.session_count}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Win rate</p>
                      <p className={`mt-0.5 font-semibold ${st.win_rate_pct != null && st.win_rate_pct >= 50 ? "text-emerald-400" : "text-amber-400"}`}>
                        {st.win_rate_pct != null ? `${st.win_rate_pct.toFixed(1)}%` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Avg R:R</p>
                      <p className="mt-0.5 font-semibold text-slate-200">
                        {st.avg_rr != null ? st.avg_rr.toFixed(2) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">P&L</p>
                      <p className={`mt-0.5 font-semibold ${plPositive ? "text-emerald-400" : "text-red-400"}`}>
                        {plPositive ? "+" : ""}
                        {st.total_pl.toFixed(0)}
                      </p>
                    </div>
                  </div>

                  {/* Mobile P&L pill */}
                  <div className="md:hidden shrink-0">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-mono font-semibold ${plPositive ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>
                      {plPositive ? "+" : ""}{st.total_pl.toFixed(0)}
                    </span>
                  </div>
                </button>

                {/* Expanded sessions list */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="sessions"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden border-t border-white/[0.06]"
                    >
                      <div className="p-5 pt-4 space-y-3">
                        {/* Add session link */}
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                            Sessions
                          </p>
                          <NavControl
                            href={`${basePath}/session/new?strategy_id=${encodeURIComponent(st.id)}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1.5 text-[11px] font-mono font-medium text-indigo-300 transition-colors hover:bg-indigo-500/15"
                            subscriptionDemo={subscriptionDemo}
                            interceptAction={interceptAction}
                            actionLabel="add a session for this strategy"
                          >
                            <Plus className="h-3 w-3" />
                            Add session
                          </NavControl>
                        </div>

                        {sess.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-slate-700/50 bg-slate-900/30 py-6 text-center text-xs font-mono text-slate-500">
                            No sessions for this strategy.
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {sess.map((se, si) => {
                              const sessPl = se.current_balance - se.initial_balance;
                              const sessPositive = sessPl >= 0;
                              return (
                                <motion.li
                                  key={se.id}
                                  initial={{ opacity: 0, x: -6 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: si * 0.04, duration: 0.2 }}
                                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-black/20 px-4 py-3 transition-colors hover:bg-white/[0.02]"
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-200 truncate">
                                      {se.name}
                                    </p>
                                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                      <span className="font-mono text-[11px] text-slate-500">
                                        {se.symbol}
                                      </span>
                                      <span className="text-slate-700">·</span>
                                      <span className="font-mono text-[11px] text-slate-500">
                                        {se.date_from} → {se.date_to}
                                      </span>
                                      <span className="text-slate-700">·</span>
                                      <StatusBadge status={se.status} />
                                      {se.current_balance != null && se.initial_balance != null && (
                                        <>
                                          <span className="text-slate-700">·</span>
                                          <span className={`font-mono text-[11px] font-semibold ${sessPositive ? "text-emerald-400" : "text-red-400"}`}>
                                            {sessPositive ? "+" : ""}{sessPl.toFixed(2)}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <NavControl
                                      href={`${basePath}/session/${se.id}/replay`}
                                      className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-mono font-medium text-cyan-300 transition-colors hover:bg-cyan-500/15"
                                      subscriptionDemo={subscriptionDemo}
                                      interceptAction={interceptAction}
                                      actionLabel="open session replay"
                                    >
                                      Replay
                                    </NavControl>
                                    <NavControl
                                      href={`${basePath}/session/${se.id}`}
                                      className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-mono text-slate-400 transition-colors hover:bg-white/[0.06]"
                                      subscriptionDemo={subscriptionDemo}
                                      interceptAction={interceptAction}
                                      actionLabel="open session summary"
                                    >
                                      Summary
                                    </NavControl>
                                  </div>
                                </motion.li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </section>

      {subscriptionDemo && (
        <DemoActionModal open={modalOpen} action={actionLabel} onClose={closeModal} />
      )}
    </motion.div>
  );
}
