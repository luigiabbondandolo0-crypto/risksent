export type ClosedOrder = {
  closeTime?: string;
  profit?: number;
  openTime?: string;
};

export function parseOrders(orders: unknown): ClosedOrder[] {
  if (!Array.isArray(orders)) return [];
  return orders as ClosedOrder[];
}

export function buildRealStats(
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
  }

  const winsCount = valid.filter((o) => (o.profit ?? 0) > 0).length;
  const lossesCount = valid.filter((o) => (o.profit ?? 0) < 0).length;
  const drawsCount = valid.filter((o) => (o.profit ?? 0) === 0).length;
  const winRate = valid.length > 0 ? (winsCount / valid.length) * 100 : null;

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

  if (curve.length === 1 && balance !== initialBalance) {
    const pctFromStart =
      initialBalance > 0 ? ((balance - initialBalance) / initialBalance) * 100 : 0;
    curve.push({
      date: new Date().toISOString().slice(0, 10),
      value: balance,
      pctFromStart
    });
  }

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
