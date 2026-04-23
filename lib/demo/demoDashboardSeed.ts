import {
  MOCK_DASHBOARD,
  MOCK_EQUITY_CURVE,
  MOCK_ALERTS,
} from "@/lib/demo/mockData";
import { SEED_TRADES } from "@/lib/journal/seedTrades";

export type DemoDashboardStats = {
  balance: number;
  equity: number;
  currency?: string;
  winRate: number | null;
  maxDd: number | null;
  highestDdPct: number | null;
  peakDdDate?: string | null;
  maxDdDollars?: number | null;
  dailyDdPct?: number | null;
  currentExposurePct?: number | null;
  avgRiskReward: number | null;
  avgWin?: number | null;
  avgLoss?: number | null;
  avgWinPct?: number | null;
  avgLossPct?: number | null;
  winsCount?: number;
  lossesCount?: number;
  drawsCount?: number;
  profitFactor?: number | null;
  balancePct: number | null;
  equityPct: number | null;
  equityCurve: { date: string; value: number; pctFromStart: number }[];
  dailyStats: { date: string; profit: number; trades: number; wins: number }[];
  initialBalance?: number;
  updatedAt?: string;
  error?: string;
};

export type DemoAlertRow = {
  id: string;
  message: string;
  severity: string;
  solution: string | null;
  alert_date: string;
  read: boolean | null;
  rule_type?: string | null;
  account_nickname?: string | null;
};

function buildDailyStatsFromSeed(): { date: string; profit: number; trades: number; wins: number }[] {
  const map = new Map<string, { profit: number; trades: number; wins: number }>();
  for (const t of SEED_TRADES) {
    if (t.status !== "closed" || !t.close_time) continue;
    const d = t.close_time.slice(0, 10);
    const net = (t.pl ?? 0);
    const cur = map.get(d) ?? { profit: 0, trades: 0, wins: 0 };
    cur.profit += net;
    cur.trades += 1;
    if (net > 0) cur.wins += 1;
    map.set(d, cur);
  }
  return [...map.entries()]
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildDemoDashboardStats(): DemoDashboardStats {
  const initialBalance = 10_000;
  const d = MOCK_DASHBOARD;
  const equityCurve = MOCK_EQUITY_CURVE.map((p) => {
    const iso = new Date(`${p.date}, 2026`).toISOString().slice(0, 10);
    const pctFromStart = ((p.value - initialBalance) / initialBalance) * 100;
    return { date: iso, value: p.value, pctFromStart };
  });

  const wins = SEED_TRADES.filter(
    (t) => t.status === "closed" && (t.pl ?? 0) > 0
  );
  const losses = SEED_TRADES.filter(
    (t) => t.status === "closed" && (t.pl ?? 0) < 0
  );
  const avgWin =
    wins.length > 0
      ? wins.reduce((s, t) => s + (t.pl ?? 0), 0) / wins.length
      : null;
  const avgLoss =
    losses.length > 0
      ? losses.reduce((s, t) => s + (t.pl ?? 0), 0) / losses.length
      : null;

  return {
    balance: d.balance,
    equity: d.equity,
    currency: "EUR",
    winRate: d.winRate,
    maxDd: d.maxDdPct,
    highestDdPct: d.maxDdPct,
    peakDdDate: equityCurve.length > 0 ? equityCurve[Math.floor(equityCurve.length * 0.55)]!.date : null,
    dailyDdPct: d.dailyDdPct,
    currentExposurePct: 4.8,
    avgRiskReward: d.avgRR,
    avgWin,
    avgLoss,
    avgWinPct: avgWin != null && d.balance ? (avgWin / d.balance) * 100 : null,
    avgLossPct: avgLoss != null && d.balance ? (Math.abs(avgLoss) / d.balance) * 100 : null,
    winsCount: wins.length,
    lossesCount: losses.length,
    drawsCount: SEED_TRADES.filter((t) => t.status === "closed").length - wins.length - losses.length,
    profitFactor: d.profitFactor,
    balancePct: ((d.balance - initialBalance) / initialBalance) * 100,
    equityPct: ((d.equity - initialBalance) / initialBalance) * 100,
    equityCurve,
    dailyStats: buildDailyStatsFromSeed(),
    initialBalance,
    updatedAt: new Date().toISOString(),
  };
}

export function buildDemoAlertRows(): DemoAlertRow[] {
  const now = Date.now();
  return MOCK_ALERTS.map((a, i) => ({
    id: a.id,
    message: a.message,
    severity: a.type === "HIGH" ? "high" : "medium",
    solution: null,
    alert_date: new Date(now - (i + 1) * 3_600_000).toISOString(),
    read: false,
    account_nickname: "Demo Account (IC Markets)",
  }));
}
