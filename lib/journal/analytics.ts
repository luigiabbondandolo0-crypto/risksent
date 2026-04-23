import {
  differenceInHours,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  parseISO,
  startOfMonth
} from "date-fns";
import type { JournalTradeRow } from "./journalTypes";
import { localYmdFromIso } from "./calendarBounds";

const INITIAL_EQUITY = 10_000;

export type EquityPoint = { t: string; balance: number; label: string };

export function closedTrades(trades: JournalTradeRow[]): JournalTradeRow[] {
  return trades.filter((x) => x.status === "closed" && x.close_time != null && x.pl != null);
}

export function totalPl(trades: JournalTradeRow[]): number {
  return closedTrades(trades).reduce((s, t) => s + (t.pl ?? 0), 0);
}

export function winRatePct(trades: JournalTradeRow[]): number {
  const c = closedTrades(trades);
  if (c.length === 0) return 0;
  const net = (t: JournalTradeRow) => t.pl ?? 0;
  const wins = c.filter((t) => net(t) > 0).length;
  return (wins / c.length) * 100;
}

export function avgRiskReward(trades: JournalTradeRow[]): number {
  const c = closedTrades(trades).filter((t) => t.risk_reward != null && Number.isFinite(t.risk_reward));
  if (c.length === 0) return 0;
  return c.reduce((s, t) => s + (t.risk_reward as number), 0) / c.length;
}

export function equityCurve(trades: JournalTradeRow[]): EquityPoint[] {
  const c = closedTrades(trades)
    .slice()
    .sort((a, b) => new Date(a.close_time!).getTime() - new Date(b.close_time!).getTime());
  let bal = INITIAL_EQUITY;
  const pts: EquityPoint[] = [{ t: "start", balance: bal, label: "Start" }];
  for (const t of c) {
    const net = (t.pl ?? 0);
    bal += net;
    pts.push({
      t: t.close_time!,
      balance: bal,
      label: format(parseISO(t.close_time!), "MMM d")
    });
  }
  return pts;
}

export function winLossSplit(trades: JournalTradeRow[]): { name: string; value: number; fill: string }[] {
  const c = closedTrades(trades);
  const net = (t: JournalTradeRow) => t.pl ?? 0;
  let win = 0;
  let loss = 0;
  for (const t of c) {
    const n = net(t);
    if (n > 0) win += n;
    else if (n < 0) loss += Math.abs(n);
  }
  return [
    { name: "Wins", value: Math.round(win * 100) / 100, fill: "#00e676" },
    { name: "Losses", value: Math.round(loss * 100) / 100, fill: "#ff3c3c" }
  ];
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function plByDayOfWeek(trades: JournalTradeRow[]): { day: string; pl: number }[] {
  const sums = [0, 0, 0, 0, 0, 0, 0];
  for (const t of closedTrades(trades)) {
    const d = getDay(new Date(t.close_time!));
    sums[d] += (t.pl ?? 0);
  }
  /* Mon-first display */
  const order = [1, 2, 3, 4, 5, 6, 0];
  return order.map((i) => ({ day: DOW[i], pl: Math.round(sums[i] * 100) / 100 }));
}

export function plBySymbol(trades: JournalTradeRow[]): { symbol: string; pl: number }[] {
  const m = new Map<string, number>();
  for (const t of closedTrades(trades)) {
    const net = (t.pl ?? 0);
    m.set(t.symbol, (m.get(t.symbol) ?? 0) + net);
  }
  return [...m.entries()]
    .map(([symbol, pl]) => ({ symbol, pl: Math.round(pl * 100) / 100 }))
    .sort((a, b) => Math.abs(b.pl) - Math.abs(a.pl));
}

/** London ~07–16 UTC, NY ~13–22, Asia ~00–09; overlap → first match (Asia < London < NY priority for overlaps). */
export function sessionBucketUtc(iso: string): "Asia" | "London" | "NY" | "Other" {
  const h = parseISO(iso).getUTCHours();
  if (h >= 0 && h < 9) return "Asia";
  if (h >= 7 && h < 16) return "London";
  if (h >= 13 && h < 22) return "NY";
  return "Other";
}

export function plBySession(trades: JournalTradeRow[]): { session: string; pl: number }[] {
  const m = { Asia: 0, London: 0, NY: 0, Other: 0 };
  for (const t of closedTrades(trades)) {
    const b = sessionBucketUtc(t.close_time!);
    m[b] += (t.pl ?? 0);
  }
  return (Object.keys(m) as (keyof typeof m)[]).map((session) => ({
    session,
    pl: Math.round(m[session] * 100) / 100
  }));
}

export function tagStats(trades: JournalTradeRow[]): { tag: string; pl: number; count: number }[] {
  const m = new Map<string, { pl: number; count: number }>();
  for (const t of closedTrades(trades)) {
    const net = (t.pl ?? 0);
    const tags = t.setup_tags?.length ? t.setup_tags : ["Untagged"];
    for (const tag of tags) {
      const cur = m.get(tag) ?? { pl: 0, count: 0 };
      cur.pl += net;
      cur.count += 1;
      m.set(tag, cur);
    }
  }
  return [...m.entries()]
    .map(([tag, v]) => ({ tag, pl: Math.round(v.pl * 100) / 100, count: v.count }))
    .sort((a, b) => b.pl - a.pl);
}

export function holdTimeHours(trades: JournalTradeRow[]): { winners: number; losers: number } {
  const c = closedTrades(trades);
  let wSum = 0;
  let wN = 0;
  let lSum = 0;
  let lN = 0;
  const net = (t: JournalTradeRow) => t.pl ?? 0;
  for (const t of c) {
    const h = differenceInHours(parseISO(t.close_time!), parseISO(t.open_time));
    if (!Number.isFinite(h) || h < 0) continue;
    if (net(t) > 0) {
      wSum += h;
      wN += 1;
    } else if (net(t) < 0) {
      lSum += h;
      lN += 1;
    }
  }
  return {
    winners: wN ? Math.round((wSum / wN) * 10) / 10 : 0,
    losers: lN ? Math.round((lSum / lN) * 10) / 10 : 0
  };
}

export type HeatCell = { date: string; pl: number; day: number };

/** Days in month with net P&L per day for heatmap */
export function monthlyPlHeatmap(trades: JournalTradeRow[], ref: Date = new Date()): HeatCell[] {
  const start = startOfMonth(ref);
  const end = endOfMonth(ref);
  const monthStart = format(start, "yyyy-MM-dd");
  const monthEnd = format(end, "yyyy-MM-dd");
  const dayMap = new Map<string, number>();
  for (const t of closedTrades(trades)) {
    const key = localYmdFromIso(t.close_time);
    if (!key || key < monthStart || key > monthEnd) continue;
    dayMap.set(key, (dayMap.get(key) ?? 0) + (t.pl ?? 0));
  }
  const days = eachDayOfInterval({ start, end });
  return days.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    const pl = Math.round((dayMap.get(key) ?? 0) * 100) / 100;
    return { date: key, pl, day: d.getDate() };
  });
}

export function relatedTrades(trades: JournalTradeRow[], symbol: string, excludeId: string, limit = 5): JournalTradeRow[] {
  return trades
    .filter((t) => t.symbol === symbol && t.id !== excludeId && t.status === "closed")
    .sort((a, b) => new Date(b.close_time ?? b.open_time).getTime() - new Date(a.close_time ?? a.open_time).getTime())
    .slice(0, limit);
}
