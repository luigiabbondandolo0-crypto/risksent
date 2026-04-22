import { buildDemoBacktestingSeed } from "@/lib/demo/demoBacktestingSeed";
import { MOCK_BT_SESSIONS } from "@/lib/demo/mockData";
import { calcSessionStats } from "@/lib/backtesting/calcSessionStats";
import type { BtTimeframe } from "@/lib/backtesting/types";
import type { Candle, Session, Trade } from "@/lib/backtesting/types";

const TF_SEC: Record<BtTimeframe, number> = {
  M1: 60,
  M5: 300,
  M15: 900,
  M30: 1800,
  H1: 3600,
  H4: 14400,
  D1: 86400,
};

function symbolBasePrice(symbol: string): number {
  const s = symbol.toUpperCase();
  if (s.includes("XAU")) return 2650;
  if (s.includes("XAG")) return 31;
  if (s.includes("US30") || s.includes("US500")) return 42_000;
  if (s.includes("JPY")) return 150.5;
  if (s.includes("BTC")) return 98_000;
  return 1.085;
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function walkCandles(
  count: number,
  startTime: number,
  stepSec: number,
  base: number,
  seed: number
): Candle[] {
  const rnd = mulberry32(seed);
  const out: Candle[] = [];
  let close = base;
  for (let i = 0; i < count; i++) {
    const t = startTime + i * stepSec;
    const vol = base * (0.00015 + rnd() * 0.00035);
    const o = close;
    const delta = (rnd() - 0.48) * vol * 2.2;
    close = Math.max(base * 0.5, close + delta);
    const h = Math.max(o, close) + rnd() * vol * 0.5;
    const l = Math.min(o, close) - rnd() * vol * 0.5;
    out.push({
      time: t,
      open: o,
      high: h,
      low: l,
      close,
    });
  }
  return out;
}

export function getMockSessionById(id: string): Session | null {
  const { sessions } = buildDemoBacktestingSeed();
  const row = sessions.find((s) => s.id === id);
  if (!row) return null;
  const now = new Date().toISOString();
  return {
    id: row.id,
    user_id: row.user_id,
    strategy_id: row.strategy_id,
    name: row.name,
    symbol: row.symbol,
    timeframe: row.timeframe as Session["timeframe"],
    date_from: row.date_from,
    date_to: row.date_to,
    initial_balance: row.initial_balance,
    current_balance: row.current_balance,
    status: row.status as Session["status"],
    created_at: row.created_at ?? now,
    updated_at: row.updated_at ?? now,
  };
}

export function buildMockCandlesForSession(
  session: Session,
  tf: BtTimeframe
): { preload: Candle[]; session: Candle[] } {
  const step = TF_SEC[tf] ?? 3600;
  const base = symbolBasePrice(session.symbol);
  const seed = session.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  const preloadN = 96;
  const sessionN = 320;
  const start0 = Math.floor(Date.now() / 1000) - step * (preloadN + sessionN) - 86400 * 2;

  const all = walkCandles(preloadN + sessionN, start0, step, base, seed);
  return {
    preload: all.slice(0, preloadN),
    session: all.slice(preloadN),
  };
}

function mockKeyFromSessionId(id: string): string | null {
  if (!id.startsWith("demo-bt-session-")) return null;
  return id.replace("demo-bt-session-", "");
}

export function getMockResultsBundle(sessionId: string): {
  session: Session;
  trades: Trade[];
  stats: ReturnType<typeof calcSessionStats>;
} | null {
  const session = getMockSessionById(sessionId);
  if (!session) return null;
  const key = mockKeyFromSessionId(sessionId);
  const meta = key ? MOCK_BT_SESSIONS.find((m) => m.id === key) : undefined;
  if (!meta) {
    return {
      session,
      trades: [],
      stats: calcSessionStats([]),
    };
  }

  const n = Math.min(48, Math.max(8, Math.round(meta.totalTrades / 20)));
  const wins = Math.round((n * meta.winRate) / 100);
  const targetPl = meta.finalBalance - meta.initialBalance;
  const perWin = targetPl > 0 ? (targetPl / Math.max(1, wins * 0.6)) : 40;
  const perLoss = targetPl < 0 ? (Math.abs(targetPl) / Math.max(1, (n - wins) * 0.6)) : 25;

  const trades: Trade[] = [];
  const userId = "mock-user";
  const sym = session.symbol;
  const baseP = symbolBasePrice(sym);

  for (let i = 0; i < n; i++) {
    const isWin = i < wins;
    const dir: "BUY" | "SELL" = i % 2 === 0 ? "BUY" : "SELL";
    const entry = baseP * (1 + (i % 5) * 0.0001);
    const pnl = isWin ? perWin * (0.6 + (i % 3) * 0.1) : -perLoss * (0.7 + (i % 2) * 0.15);
    const exit = isWin
      ? dir === "BUY"
        ? entry + Math.abs(pnl) / 1000
        : entry - Math.abs(pnl) / 1000
      : dir === "BUY"
        ? entry - Math.abs(pnl) / 1000
        : entry + Math.abs(pnl) / 1000;
    const t0 = new Date(2026, (i % 3) + 1, 5 + (i % 20), 10 + (i % 5), 0, 0).toISOString();
    trades.push({
      id: `mock-trade-${sessionId}-${i}`,
      session_id: sessionId,
      user_id: userId,
      symbol: sym,
      direction: dir,
      entry_price: entry,
      exit_price: exit,
      stop_loss: dir === "BUY" ? entry * 0.999 : entry * 1.001,
      take_profit: dir === "BUY" ? entry * 1.001 : entry * 0.999,
      lot_size: 0.1,
      pnl,
      pips: pnl * 8,
      risk_reward: meta.avgRR,
      entry_time: t0,
      exit_time: t0,
      status: "closed",
      notes: null,
      created_at: t0,
    });
  }

  return {
    session: { ...session, current_balance: session.initial_balance + trades.reduce((s, t) => s + (t.pnl ?? 0), 0) },
    trades,
    stats: calcSessionStats(trades),
  };
}
