import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";

const METAAPI_BASE = "https://api.metatraderapi.dev";

type ClosedOrder = {
  closeTime?: string;
  profit?: number;
  openTime?: string;
};

function parseOrders(orders: unknown): ClosedOrder[] {
  if (!Array.isArray(orders)) return [];
  return orders as ClosedOrder[];
}

const DEFAULT_CONTRACT_SIZE = 100_000;

type RawOpenPosition = {
  symbol?: string;
  volume?: number;
  openPrice?: number;
  stopLoss?: number;
  type?: string;
};

function parseOpenPositions(raw: unknown): RawOpenPosition[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (o): o is RawOpenPosition =>
      o != null && typeof o === "object" && typeof (o as RawOpenPosition).symbol === "string"
  );
}

function computeCurrentExposurePct(rawPositions: RawOpenPosition[], equity: number): number | null {
  if (equity <= 0) return null;
  let total = 0;
  for (const p of rawPositions) {
    const volume = Number(p.volume) || 0;
    const openPrice = Number(p.openPrice) || 0;
    const stopLoss = p.stopLoss != null ? Number(p.stopLoss) : undefined;
    if (!volume || !openPrice) continue;
    if (stopLoss != null && Number.isFinite(stopLoss) && stopLoss !== openPrice) {
      const riskAmount = Math.abs(openPrice - stopLoss) * volume * DEFAULT_CONTRACT_SIZE;
      total += (riskAmount / equity) * 100;
    }
  }
  return total > 0 ? total : null;
}

function buildRealStats(
  balance: number,
  equity: number,
  orders: ClosedOrder[]
): {
  winRate: number | null;
  maxDd: number | null;
  highestDdPct: number | null;
  peakDdDate: string | null;
  maxDdDollars: number | null;
  dailyDdPct: number | null;
  avgRiskReward: number | null;
  avgWin: number | null;
  avgLoss: number | null;
  avgWinPct: number | null;
  avgLossPct: number | null;
  winsCount: number;
  lossesCount: number;
  drawsCount: number;
  profitFactor: number | null;
  equityCurve: { date: string; value: number; pctFromStart: number }[];
  dailyStats: { date: string; profit: number; trades: number; wins: number }[];
  totalProfit: number;
  initialBalance: number;
} {
  const valid = orders.filter(
    (o) => o != null && typeof o.closeTime === "string" && typeof o.profit === "number"
  );
  if (valid.length === 0) {
    const totalProfit = Number.isFinite(balance) ? 0 : 0;
    const initialBalance = balance;
    return {
      winRate: null,
      maxDd: null,
      highestDdPct: null,
      peakDdDate: null,
      maxDdDollars: null,
      dailyDdPct: null,
      avgRiskReward: null,
      avgWin: null,
      avgLoss: null,
      avgWinPct: null,
      avgLossPct: null,
      winsCount: 0,
      lossesCount: 0,
      drawsCount: 0,
      profitFactor: null,
      equityCurve: [
        {
          date: new Date().toISOString().slice(0, 10),
          value: balance,
          pctFromStart: 0
        }
      ],
      dailyStats: [],
      totalProfit: 0,
      initialBalance: balance
    };
  }

  const totalProfit = valid.reduce((s, o) => s + (o.profit ?? 0), 0);
  const initialBalance = balance - totalProfit;
  if (initialBalance <= 0) {
    // fallback: use balance as start, curve will show growth from 0
    // initialBalance = balance; totalProfit stays; we'll build curve from orders only
  }

  const winsCount = valid.filter((o) => (o.profit ?? 0) > 0).length;
  const lossesCount = valid.filter((o) => (o.profit ?? 0) < 0).length;
  const drawsCount = valid.filter((o) => (o.profit ?? 0) === 0).length;
  const winRate = valid.length > 0 ? (winsCount / valid.length) * 100 : null;

  // Sort by close time and build equity curve (running balance) and daily stats
  const sorted = [...valid].sort(
    (a, b) => new Date(a.closeTime!).getTime() - new Date(b.closeTime!).getTime()
  );
  let running = initialBalance;
  const curve: { date: string; value: number; pctFromStart: number }[] = [];
  const dayMap = new Map<string, { profit: number; trades: number; wins: number }>();

  curve.push({
    date: sorted[0]!.closeTime!.slice(0, 10),
    value: initialBalance,
    pctFromStart: 0
  });

  for (const o of sorted) {
    const profit = o.profit ?? 0;
    running += profit;
    const dateStr = o.closeTime!.slice(0, 10);
    const pctFromStart =
      initialBalance > 0 ? ((running - initialBalance) / initialBalance) * 100 : 0;
    curve.push({
      date: dateStr,
      value: running,
      pctFromStart
    });
    const day = dayMap.get(dateStr) ?? { profit: 0, trades: 0, wins: 0 };
    day.profit += profit;
    day.trades += 1;
    if (profit > 0) day.wins += 1;
    dayMap.set(dateStr, day);
  }

  // If curve has only one point (no closes yet), add current balance as last point
  if (curve.length === 1 && balance !== initialBalance) {
    const pctFromStart =
      initialBalance > 0 ? ((balance - initialBalance) / initialBalance) * 100 : 0;
    curve.push({
      date: new Date().toISOString().slice(0, 10),
      value: balance,
      pctFromStart
    });
  }

  // Max drawdown from curve + date of peak DD + max DD in dollars
  let peak = curve[0]?.value ?? initialBalance;
  let maxDdPct = 0;
  let peakDdDate: string | null = null;
  let peakDdTroughValue = 0;
  for (let i = 1; i < curve.length; i++) {
    const v = curve[i]!.value;
    if (v > peak) peak = v;
    const dd = peak > 0 ? ((peak - v) / peak) * 100 : 0;
    if (dd > maxDdPct) {
      maxDdPct = dd;
      peakDdDate = curve[i]!.date;
      peakDdTroughValue = v;
    }
  }
  const maxDd = maxDdPct > 0 ? -maxDdPct : null;
  const highestDdPct = maxDdPct > 0 ? maxDdPct : null;
  const maxDdDollars =
    maxDdPct > 0 && peak > 0 ? peak - peakDdTroughValue : null;

  // Average win/loss (absolute and % of initial balance) and risk/reward
  const winningProfits = valid.filter((o) => (o.profit ?? 0) > 0).map((o) => o.profit!);
  const losingProfits = valid.filter((o) => (o.profit ?? 0) < 0).map((o) => Math.abs(o.profit!));
  const avgWinVal = winningProfits.length ? winningProfits.reduce((a, b) => a + b, 0) / winningProfits.length : 0;
  const avgLossVal = losingProfits.length ? losingProfits.reduce((a, b) => a + b, 0) / losingProfits.length : 0;
  const avgRiskReward =
    avgLossVal > 0 && avgWinVal > 0 ? Math.round((avgWinVal / avgLossVal) * 100) / 100 : null;
  const avgWin = winningProfits.length ? avgWinVal : null;
  const avgLoss = losingProfits.length ? avgLossVal : null;
  const denom = initialBalance > 0 ? initialBalance : balance - totalProfit;
  const avgWinPct = denom > 0 && avgWin != null ? (avgWin / denom) * 100 : null;
  const avgLossPct = denom > 0 && avgLoss != null ? (avgLoss / denom) * 100 : null;
  const grossProfit = winningProfits.length ? winningProfits.reduce((a, b) => a + b, 0) : 0;
  const grossLoss = losingProfits.length ? losingProfits.reduce((a, b) => a + b, 0) : 0;
  const profitFactor = grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : null;

  const dailyStats = Array.from(dayMap.entries())
    .map(([date, d]) => ({ date, profit: d.profit, trades: d.trades, wins: d.wins }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const initBal = initialBalance > 0 ? initialBalance : balance - totalProfit;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayStat = dayMap.get(todayStr);
  const dailyDdPct =
    todayStat && initBal > 0 ? (todayStat.profit / initBal) * 100 : null;

  return {
    winRate,
    maxDd,
    highestDdPct,
    peakDdDate,
    maxDdDollars,
    dailyDdPct,
    avgRiskReward,
    avgWin,
    avgLoss,
    avgWinPct,
    avgLossPct,
    winsCount,
    lossesCount,
    drawsCount,
    profitFactor,
    equityCurve: curve,
    dailyStats,
    totalProfit,
    initialBalance: initBal
  };
}

export async function GET(req: NextRequest) {
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const uuid = searchParams.get("uuid");

  let accountId: string | null = uuid;
  if (!accountId) {
    const { data: accounts } = await supabase
      .from("trading_account")
      .select("metaapi_account_id")
      .eq("user_id", user.id)
      .limit(1);
    accountId = accounts?.[0]?.metaapi_account_id ?? null;
  }

  if (!accountId) {
    return NextResponse.json({
      balance: 0,
      equity: 0,
      winRate: null,
      maxDd: null,
      equityCurve: [],
      error: "No account selected or linked"
    });
  }

  const apiKey = process.env.METATRADERAPI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "METATRADERAPI_API_KEY not set" }, { status: 500 });
  }

  const headers = { "x-api-key": apiKey, Accept: "application/json" };

  try {
    const [summaryRes, closedRes] = await Promise.all([
      fetch(`${METAAPI_BASE}/AccountSummary?id=${encodeURIComponent(accountId)}`, { headers }),
      fetch(`${METAAPI_BASE}/ClosedOrders?id=${encodeURIComponent(accountId)}`, { headers })
    ]);
    
    // Try OpenPositions first (MT4/MT5 standard), then fallback to OpenOrders
    let openRes = await fetch(`${METAAPI_BASE}/OpenPositions?id=${encodeURIComponent(accountId)}`, { headers });
    if (!openRes.ok && openRes.status === 403) {
      openRes = await fetch(`${METAAPI_BASE}/OpenOrders?id=${encodeURIComponent(accountId)}`, { headers });
    }

    if (!summaryRes.ok) {
      const err = await summaryRes.text();
      return NextResponse.json(
        { error: `MetatraderApi: ${summaryRes.status} ${err}` },
        { status: 502 }
      );
    }
    const summary = await summaryRes.json();
    const balance = Number(summary.balance) ?? 0;
    const equity = Number(summary.equity) ?? 0;
    const currency = summary.currency ?? "EUR";

    let closedOrders: ClosedOrder[] = [];
    if (closedRes.ok) {
      const raw = await closedRes.json();
      closedOrders = parseOrders(Array.isArray(raw) ? raw : raw?.orders ?? raw ?? []);
    }

    let currentExposurePct: number | null = null;
    if (openRes.ok) {
      const rawOpen = await openRes.json();
      const rawList = Array.isArray(rawOpen) ? rawOpen : (rawOpen as { orders?: unknown })?.orders ?? (rawOpen as { positions?: unknown })?.positions ?? rawOpen ?? [];
      const positions = parseOpenPositions(rawList);
      currentExposurePct = computeCurrentExposurePct(positions, equity > 0 ? equity : balance);
    }

    const {
      winRate,
      maxDd,
      highestDdPct,
      peakDdDate,
      maxDdDollars,
      dailyDdPct,
      avgRiskReward,
      avgWin,
      avgLoss,
      avgWinPct,
      avgLossPct,
      winsCount,
      lossesCount,
      drawsCount,
      profitFactor,
      equityCurve,
      dailyStats,
      totalProfit,
      initialBalance
    } = buildRealStats(balance, equity, closedOrders);

    const balancePct =
      initialBalance > 0 ? ((balance - initialBalance) / initialBalance) * 100 : null;
    const equityPct =
      initialBalance > 0 ? ((equity - initialBalance) / initialBalance) * 100 : null;

    return NextResponse.json({
      balance,
      equity,
      currency,
      winRate,
      maxDd,
      highestDdPct,
      peakDdDate,
      maxDdDollars,
      dailyDdPct,
      currentExposurePct,
      avgRiskReward,
      avgWin,
      avgLoss,
      avgWinPct,
      avgLossPct,
      winsCount,
      lossesCount,
      drawsCount,
      profitFactor,
      balancePct,
      equityPct,
      equityCurve,
      dailyStats,
      totalProfit,
      initialBalance,
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch account" },
      { status: 502 }
    );
  }
}
