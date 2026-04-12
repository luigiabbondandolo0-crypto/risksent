// ─── Mock data for demo mode ─────────────────────────────────────────────────

// ─── User profile ─────────────────────────────────────────────────────────────

export const MOCK_USER = {
  name: "Alex Morrison",
  plan: "Experienced",
  memberSince: "Jan 2026",
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const MOCK_DASHBOARD = {
  balance: 12_450.00,
  equity: 12_618.50,
  dailyPnl: 312.50,
  dailyPnlPct: 2.57,
  weeklyPnl: 1_240.00,
  weeklyPnlPct: 11.1,
  monthlyPnl: 2_840.00,
  monthlyPnlPct: 29.5,
  winRate: 68.4,
  totalTrades: 94,
  profitFactor: 2.31,
  avgRR: 1.92,
  maxDdPct: 4.2,
  dailyDdPct: 1.1,
  openTrades: 2,
  activeRules: 5,
};

// 60 data points: Jan 13 → Apr 12, growing from 10000 to 12450
export const MOCK_EQUITY_CURVE = [
  { date: "Jan 13", value: 10_000 },
  { date: "Jan 14", value: 10_145 },
  { date: "Jan 15", value: 10_092 },
  { date: "Jan 16", value: 10_238 },
  { date: "Jan 17", value: 10_185 },
  { date: "Jan 20", value: 10_320 },
  { date: "Jan 21", value: 10_460 },
  { date: "Jan 22", value: 10_390 },
  { date: "Jan 23", value: 10_520 },
  { date: "Jan 24", value: 10_475 },
  { date: "Jan 27", value: 10_610 },
  { date: "Jan 28", value: 10_555 },
  { date: "Jan 29", value: 10_720 },
  { date: "Jan 30", value: 10_680 },
  { date: "Jan 31", value: 10_820 },
  { date: "Feb 03", value: 10_760 },
  { date: "Feb 04", value: 10_890 },
  { date: "Feb 05", value: 10_970 },
  { date: "Feb 06", value: 10_915 },
  { date: "Feb 07", value: 11_060 },
  { date: "Feb 10", value: 11_140 },
  { date: "Feb 11", value: 11_080 },
  { date: "Feb 12", value: 11_230 },
  { date: "Feb 13", value: 11_180 },
  { date: "Feb 14", value: 11_320 },
  { date: "Feb 17", value: 11_260 },
  { date: "Feb 18", value: 11_410 },
  { date: "Feb 19", value: 11_370 },
  { date: "Feb 20", value: 11_500 },
  { date: "Feb 21", value: 11_450 },
  { date: "Feb 24", value: 11_380 },
  { date: "Feb 25", value: 11_520 },
  { date: "Feb 26", value: 11_610 },
  { date: "Feb 27", value: 11_555 },
  { date: "Feb 28", value: 11_680 },
  { date: "Mar 03", value: 11_720 },
  { date: "Mar 04", value: 11_660 },
  { date: "Mar 05", value: 11_790 },
  { date: "Mar 06", value: 11_850 },
  { date: "Mar 07", value: 11_800 },
  { date: "Mar 10", value: 11_940 },
  { date: "Mar 11", value: 12_010 },
  { date: "Mar 12", value: 11_960 },
  { date: "Mar 13", value: 12_080 },
  { date: "Mar 14", value: 12_140 },
  { date: "Mar 17", value: 12_080 },
  { date: "Mar 18", value: 12_200 },
  { date: "Mar 19", value: 12_160 },
  { date: "Mar 20", value: 12_280 },
  { date: "Mar 21", value: 12_230 },
  { date: "Mar 24", value: 12_090 },
  { date: "Mar 25", value: 12_220 },
  { date: "Mar 26", value: 12_300 },
  { date: "Mar 27", value: 12_260 },
  { date: "Mar 28", value: 12_380 },
  { date: "Apr 01", value: 12_320 },
  { date: "Apr 02", value: 12_200 },
  { date: "Apr 03", value: 12_340 },
  { date: "Apr 07", value: 12_140 },
  { date: "Apr 08", value: 12_290 },
  { date: "Apr 09", value: 12_450 },
] as { date: string; value: number }[];

export const MOCK_ALERTS = [
  { id: "1", type: "HIGH",   message: "Weekly loss approaching limit — 4.1% of 5% max", time: "1 hour ago" },
  { id: "2", type: "MEDIUM", message: "Position size at 0.95% on GBPJPY — near 1% limit", time: "3 hours ago" },
  { id: "3", type: "LOW",    message: "3rd trade today — review before opening another", time: "5 hours ago" },
  { id: "4", type: "MEDIUM", message: "XAUUSD spread widened above threshold (4.2 pips)", time: "Yesterday 14:22" },
];

export const MOCK_RISK_RULES = [
  { name: "Max Daily Loss",       limit: "2%",   current: "1.1%",  pct: 55, status: "safe"    as const },
  { name: "Max Position Size",    limit: "1%",   current: "0.95%", pct: 95, status: "warning" as const },
  { name: "Max Open Trades",      limit: "3",    current: "2/3",   pct: 67, status: "safe"    as const },
  { name: "Stop after 2 losses",  limit: "2",    current: "0",     pct: 0,  status: "safe"    as const },
  { name: "Max Weekly Loss",      limit: "5%",   current: "4.1%",  pct: 82, status: "warning" as const },
];

export const MOCK_OPEN_TRADES = [
  { id: "o1", symbol: "EURUSD", direction: "sell" as const, lots: 0.20, entry: 1.0968, current: 1.0942, pnl: +52.00, openSince: "2h 14m" },
  { id: "o2", symbol: "XAUUSD", direction: "buy"  as const, lots: 0.02, entry: 2318.5, current: 2334.0, pnl: +31.00, openSince: "45m"    },
];

// ─── Journal ──────────────────────────────────────────────────────────────────

export type MockTrade = {
  id: string;
  date: string;
  openTime: string;
  closeTime: string;
  symbol: string;
  direction: "buy" | "sell";
  lots: number;
  entry: number;
  exit: number;
  sl: number;
  tp: number;
  pnl: number;
  rr: number;
  duration: string;
  tags: string[];
  notes: string;
};

export const MOCK_TRADES: MockTrade[] = [
  { id: "t01", date: "Apr 09", openTime: "09:02", closeTime: "13:48", symbol: "EURUSD", direction: "sell", lots: 0.20, entry: 1.0968, exit: 1.0896, sl: 1.1010, tp: 1.0880, pnl: +144.00, rr: 2.6, duration: "4h 46m", tags: ["HTF Trend", "London Session"], notes: "Clean break of Asia range, sold the retest." },
  { id: "t02", date: "Apr 08", openTime: "14:22", closeTime: "16:05", symbol: "XAUUSD", direction: "buy",  lots: 0.03, entry: 2302.0, exit: 2318.5, sl: 2290.0, tp: 2330.0, pnl: +49.50, rr: 2.1, duration: "1h 43m", tags: ["FVG", "A+ Setup"],         notes: "" },
  { id: "t03", date: "Apr 08", openTime: "10:15", closeTime: "11:20", symbol: "GBPUSD", direction: "buy",  lots: 0.10, entry: 1.2715, exit: 1.2685, sl: 1.2690, tp: 1.2760, pnl: -30.00, rr: -1.2, duration: "1h 05m", tags: [],                        notes: "Entered too early, no confirmation." },
  { id: "t04", date: "Apr 07", openTime: "08:50", closeTime: "14:30", symbol: "US30",   direction: "sell", lots: 0.01, entry: 39_820, exit: 39_640, sl: 39_920, tp: 39_600, pnl: +180.00, rr: 2.9, duration: "5h 40m", tags: ["HTF Trend", "NY Open"],  notes: "Strong bearish momentum post NFP." },
  { id: "t05", date: "Apr 04", openTime: "13:10", closeTime: "17:45", symbol: "GBPJPY", direction: "buy",  lots: 0.08, entry: 191.42, exit: 192.18, sl: 191.00, tp: 192.40, pnl: +60.80, rr: 1.8, duration: "4h 35m", tags: ["Supply Zone"],            notes: "" },
  { id: "t06", date: "Apr 03", openTime: "09:30", closeTime: "12:20", symbol: "EURUSD", direction: "sell", lots: 0.15, entry: 1.0882, exit: 1.0848, sl: 1.0910, tp: 1.0840, pnl: +51.00, rr: 1.6, duration: "2h 50m", tags: ["London Session"],         notes: "" },
  { id: "t07", date: "Apr 02", openTime: "15:00", closeTime: "15:35", symbol: "US500",  direction: "sell", lots: 0.02, entry: 5248.0, exit: 5228.0, sl: 5260.0, tp: 5220.0, pnl: +40.00, rr: 2.4, duration: "35m",    tags: ["A+ Setup", "NY Open"],   notes: "Textbook short at prior high." },
  { id: "t08", date: "Apr 01", openTime: "10:05", closeTime: "13:55", symbol: "XAUUSD", direction: "sell", lots: 0.02, entry: 2331.5, exit: 2308.0, sl: 2345.0, tp: 2305.0, pnl: +47.00, rr: 2.0, duration: "3h 50m", tags: ["HTF Trend", "FVG"],       notes: "" },
  { id: "t09", date: "Mar 28", openTime: "09:15", closeTime: "10:05", symbol: "GBPUSD", direction: "sell", lots: 0.10, entry: 1.2648, exit: 1.2680, sl: 1.2620, tp: 1.2600, pnl: -32.00, rr: -1.1, duration: "50m",    tags: [],                        notes: "Counter-trend trade, should have avoided." },
  { id: "t10", date: "Mar 27", openTime: "14:30", closeTime: "16:10", symbol: "EURUSD", direction: "buy",  lots: 0.20, entry: 1.0812, exit: 1.0862, sl: 1.0782, tp: 1.0872, pnl: +100.00, rr: 2.7, duration: "1h 40m", tags: ["A+ Setup", "London Session"], notes: "Perfect 1:2.7, followed the plan." },
  { id: "t11", date: "Mar 26", openTime: "13:00", closeTime: "15:20", symbol: "US30",   direction: "buy",  lots: 0.01, entry: 39_480, exit: 39_560, sl: 39_430, tp: 39_580, pnl: +80.00, rr: 2.0, duration: "2h 20m", tags: ["Supply Zone"],             notes: "" },
  { id: "t12", date: "Mar 25", openTime: "09:00", closeTime: "11:45", symbol: "GBPJPY", direction: "sell", lots: 0.08, entry: 192.80, exit: 191.95, sl: 193.20, tp: 191.80, pnl: +68.00, rr: 2.1, duration: "2h 45m", tags: ["HTF Trend"],               notes: "" },
  { id: "t13", date: "Mar 24", openTime: "14:15", closeTime: "14:50", symbol: "US500",  direction: "buy",  lots: 0.02, entry: 5190.0, exit: 5172.0, sl: 5180.0, tp: 5220.0, pnl: -36.00, rr: -1.8, duration: "35m",    tags: [],                        notes: "Bad entry, stopped out quickly." },
  { id: "t14", date: "Mar 21", openTime: "10:20", closeTime: "14:10", symbol: "EURUSD", direction: "sell", lots: 0.15, entry: 1.0920, exit: 1.0872, sl: 1.0950, tp: 1.0860, pnl: +72.00, rr: 1.9, duration: "3h 50m", tags: ["London Session", "FVG"],   notes: "" },
  { id: "t15", date: "Mar 20", openTime: "08:45", closeTime: "12:30", symbol: "XAUUSD", direction: "buy",  lots: 0.03, entry: 2280.0, exit: 2305.0, sl: 2265.0, tp: 2310.0, pnl: +75.00, rr: 2.5, duration: "3h 45m", tags: ["A+ Setup"],               notes: "Strong demand zone hold." },
  { id: "t16", date: "Mar 19", openTime: "15:10", closeTime: "15:55", symbol: "GBPUSD", direction: "buy",  lots: 0.10, entry: 1.2580, exit: 1.2560, sl: 1.2555, tp: 1.2630, pnl: -20.00, rr: -0.8, duration: "45m",    tags: [],                        notes: "" },
  { id: "t17", date: "Mar 18", openTime: "09:30", closeTime: "13:20", symbol: "US30",   direction: "sell", lots: 0.01, entry: 39_650, exit: 39_480, sl: 39_740, tp: 39_470, pnl: +170.00, rr: 2.8, duration: "3h 50m", tags: ["HTF Trend", "NY Open"],  notes: "" },
  { id: "t18", date: "Mar 14", openTime: "14:00", closeTime: "16:40", symbol: "EURUSD", direction: "buy",  lots: 0.20, entry: 1.0848, exit: 1.0892, sl: 1.0820, tp: 1.0905, pnl: +88.00, rr: 2.3, duration: "2h 40m", tags: ["A+ Setup", "London Session"], notes: "" },
  { id: "t19", date: "Mar 13", openTime: "10:00", closeTime: "11:30", symbol: "GBPJPY", direction: "buy",  lots: 0.05, entry: 190.60, exit: 190.15, sl: 190.20, tp: 191.40, pnl: -22.50, rr: -1.1, duration: "1h 30m", tags: [],                        notes: "" },
  { id: "t20", date: "Mar 12", openTime: "08:55", closeTime: "14:15", symbol: "XAUUSD", direction: "sell", lots: 0.02, entry: 2318.0, exit: 2294.5, sl: 2330.0, tp: 2290.0, pnl: +47.00, rr: 2.0, duration: "5h 20m", tags: ["FVG", "HTF Trend"],       notes: "" },
  { id: "t21", date: "Mar 07", openTime: "14:30", closeTime: "16:00", symbol: "US500",  direction: "buy",  lots: 0.02, entry: 5180.0, exit: 5205.0, sl: 5165.0, tp: 5210.0, pnl: +50.00, rr: 2.3, duration: "1h 30m", tags: ["A+ Setup"],               notes: "" },
  { id: "t22", date: "Mar 06", openTime: "09:05", closeTime: "11:55", symbol: "EURUSD", direction: "sell", lots: 0.15, entry: 1.0910, exit: 1.0862, sl: 1.0940, tp: 1.0850, pnl: +72.00, rr: 2.0, duration: "2h 50m", tags: ["London Session"],         notes: "" },
  { id: "t23", date: "Mar 05", openTime: "13:20", closeTime: "14:10", symbol: "GBPUSD", direction: "sell", lots: 0.10, entry: 1.2720, exit: 1.2680, sl: 1.2750, tp: 1.2660, pnl: +40.00, rr: 1.6, duration: "50m",    tags: ["Supply Zone"],            notes: "" },
  { id: "t24", date: "Feb 28", openTime: "09:10", closeTime: "15:30", symbol: "XAUUSD", direction: "buy",  lots: 0.03, entry: 2262.0, exit: 2285.5, sl: 2248.0, tp: 2290.0, pnl: +70.50, rr: 2.4, duration: "6h 20m", tags: ["A+ Setup", "FVG"],        notes: "Strong reaction from weekly demand." },
  { id: "t25", date: "Feb 27", openTime: "14:00", closeTime: "14:40", symbol: "US30",   direction: "buy",  lots: 0.01, entry: 39_180, exit: 39_140, sl: 39_150, tp: 39_250, pnl: -40.00, rr: -1.3, duration: "40m",    tags: [],                        notes: "Poor timing, news event reversed it." },
  { id: "t26", date: "Feb 26", openTime: "10:30", closeTime: "13:10", symbol: "EURUSD", direction: "buy",  lots: 0.20, entry: 1.0780, exit: 1.0836, sl: 1.0750, tp: 1.0840, pnl: +112.00, rr: 2.8, duration: "2h 40m", tags: ["HTF Trend", "A+ Setup"], notes: "" },
  { id: "t27", date: "Feb 21", openTime: "09:20", closeTime: "12:45", symbol: "GBPJPY", direction: "sell", lots: 0.08, entry: 193.10, exit: 192.30, sl: 193.50, tp: 192.20, pnl: +64.00, rr: 2.1, duration: "3h 25m", tags: ["HTF Trend"],               notes: "" },
  { id: "t28", date: "Feb 20", openTime: "15:00", closeTime: "15:30", symbol: "US500",  direction: "sell", lots: 0.02, entry: 5162.0, exit: 5172.0, sl: 5148.0, tp: 5140.0, pnl: -20.00, rr: -0.7, duration: "30m",    tags: [],                        notes: "" },
  { id: "t29", date: "Feb 14", openTime: "09:00", closeTime: "14:20", symbol: "XAUUSD", direction: "sell", lots: 0.02, entry: 2310.0, exit: 2284.0, sl: 2324.0, tp: 2280.0, pnl: +52.00, rr: 2.2, duration: "5h 20m", tags: ["Supply Zone", "FVG"],     notes: "" },
  { id: "t30", date: "Feb 13", openTime: "10:50", closeTime: "12:30", symbol: "EURUSD", direction: "buy",  lots: 0.20, entry: 1.0740, exit: 1.0786, sl: 1.0718, tp: 1.0790, pnl: +92.00, rr: 2.5, duration: "1h 40m", tags: ["A+ Setup", "London Session"], notes: "Textbook entry off 4H demand." },
];

export const MOCK_JOURNAL_STATS = {
  totalTrades: 94,
  winRate: 68.4,
  avgRR: 1.92,
  totalPnl: 2_840,
  maxDd: 4.2,
  profitFactor: 2.31,
};

export const MOCK_PNL_BY_SYMBOL = [
  { symbol: "EURUSD", pnl: 920 },
  { symbol: "XAUUSD", pnl: 680 },
  { symbol: "US30",   pnl: 540 },
  { symbol: "GBPJPY", pnl: 340 },
  { symbol: "US500",  pnl: 220 },
  { symbol: "GBPUSD", pnl: 140 },
] as { symbol: string; pnl: number }[];

export const MOCK_PNL_BY_DOW = [
  { day: "Mon", pnl: 380 },
  { day: "Tue", pnl: 520 },
  { day: "Wed", pnl: 640 },
  { day: "Thu", pnl: 290 },
  { day: "Fri", pnl: -130 },
] as { day: string; pnl: number }[];

// ─── Backtesting ──────────────────────────────────────────────────────────────

export const MOCK_BT_SESSIONS = [
  {
    id: "bt1",
    name: "EURUSD London Scalp",
    symbol: "EURUSD",
    timeframe: "M5",
    dateFrom: "Jan 01, 2026",
    dateTo: "Jan 31, 2026",
    initialBalance: 10_000,
    finalBalance: 11_840,
    totalTrades: 847,
    winRate: 71.2,
    profitFactor: 2.14,
    maxDd: 3.8,
    avgRR: 1.6,
    status: "completed" as const,
  },
  {
    id: "bt2",
    name: "XAUUSD H1 Trend Follow",
    symbol: "XAUUSD",
    timeframe: "H1",
    dateFrom: "Feb 01, 2026",
    dateTo: "Feb 28, 2026",
    initialBalance: 10_000,
    finalBalance: 11_210,
    totalTrades: 124,
    winRate: 64.5,
    profitFactor: 1.98,
    maxDd: 5.1,
    avgRR: 2.1,
    status: "completed" as const,
  },
  {
    id: "bt3",
    name: "US30 NY Session",
    symbol: "US30",
    timeframe: "M15",
    dateFrom: "Mar 01, 2026",
    dateTo: "Apr 09, 2026",
    initialBalance: 10_000,
    finalBalance: 10_980,
    totalTrades: 312,
    winRate: 66.3,
    profitFactor: 1.87,
    maxDd: 4.2,
    avgRR: 1.8,
    status: "active" as const,
  },
] as const;

// ─── Risk Manager ─────────────────────────────────────────────────────────────

export const MOCK_RISK = {
  balance: 12_450,
  equity: 12_618.50,
  dailyDd: 1.1,
  dailyDdLimit: 2.0,
  maxDd: 4.2,
  maxDdLimit: 8.0,
  openPositions: 2,
};

export const MOCK_RISK_VIOLATIONS = [
  {
    id: "v1",
    rule: "Max Position Size",
    message: "XAUUSD 1.18% of balance — exceeded 1% limit by 0.18%",
    time: "Apr 03 · 10:25",
    severity: "medium" as const,
  },
  {
    id: "v2",
    rule: "Max Weekly Loss",
    message: "Weekly loss reached 4.9% — within 0.1% of 5% limit",
    time: "Mar 28 · 15:40",
    severity: "high" as const,
  },
  {
    id: "v3",
    rule: "Max Open Trades",
    message: "4 simultaneous positions opened briefly — limit is 3",
    time: "Mar 14 · 14:02",
    severity: "medium" as const,
  },
];

export const MOCK_TELEGRAM_ALERTS = [
  { id: "ta1", name: "Daily DD > 1.5%",   channel: "@risksent_alex", enabled: true  },
  { id: "ta2", name: "Position size > 1%", channel: "@risksent_alex", enabled: true  },
  { id: "ta3", name: "Weekly DD > 4%",     channel: "@risksent_alex", enabled: false },
];

// ─── AI Coach ─────────────────────────────────────────────────────────────────

export const MOCK_AI_MESSAGES = [
  {
    role: "user" as const,
    content: "Analyze my last week's performance.",
    time: "Mon 09:14",
  },
  {
    role: "assistant" as const,
    content:
      "Great week overall. You closed 11 trades with a 72.7% win rate and +€840 net P&L — your best week in 3 months. EURUSD was your strongest instrument (+€320), confirming your edge in the London session. One area to watch: your two losses on Friday were both taken within 30 minutes of each other, which hints at revenge-trading behaviour. Consider pausing after a loss until the next session.",
    time: "Mon 09:14",
  },
  {
    role: "user" as const,
    content: "What's my biggest weakness right now?",
    time: "Mon 09:16",
  },
  {
    role: "assistant" as const,
    content:
      "Based on 94 trades, your main weakness is Friday trading. Your Friday win rate is 38% versus 74% on Tuesday–Thursday. You're also prone to overtrading after 3pm London close — 80% of your losing trades occurred after 15:00. I'd recommend hard stopping at 15:00 and skipping Fridays entirely until you build a positive edge there.",
    time: "Mon 09:16",
  },
  {
    role: "user" as const,
    content: "How can I improve my average R:R?",
    time: "Mon 09:18",
  },
  {
    role: "assistant" as const,
    content:
      "Your current avg R:R is 1.92. The fastest lever is letting winners run: you're closing 40% of winning trades at 1:1 when your initial TP was at 1:2+. Try a partial close at 1:1 (50% of position) and move stop to breakeven. Let the rest run to target. Backtested on your EURUSD trades, this would raise your avg R:R to ~2.4 with similar win rate.",
    time: "Mon 09:18",
  },
  {
    role: "user" as const,
    content: "Am I ready for a prop firm challenge?",
    time: "Mon 09:21",
  },
  {
    role: "assistant" as const,
    content:
      "You're close, but not quite ready. You need to fix two things first: (1) Friday/afternoon discipline — prop firms track consistency daily, not just overall. A bad Friday can wipe your weekly target. (2) Your max drawdown hit 4.2% this month — most prop challenges cap at 4% daily, 8% overall. You need a buffer. I'd say 4–6 more weeks of consistent trading (every day under 2% daily DD, no Friday overtrading) before you're challenge-ready.",
    time: "Mon 09:21",
  },
];

export const MOCK_AI_REPORT_SECTIONS = [
  {
    title: "Risk Management",
    score: 82,
    color: "#00e676",
    body: "Excellent daily drawdown control — only 2 days exceeded 1.5% this month. One weekly loss warning triggered on Mar 28. Position sizing is mostly consistent with 1 exception on XAUUSD (1.18%). Overall risk discipline is strong.",
  },
  {
    title: "Win Rate & Statistics",
    score: 68,
    color: "#00b0ff",
    body: "68.4% win rate over 94 trades is well above the 50% retail average. Profit factor of 2.31 confirms your edge is real and not a fluke. Avg R:R of 1.92 is solid — improving trade management could push this to 2.4+.",
  },
  {
    title: "Trading Psychology",
    score: 71,
    color: "#ff8c00",
    body: "Revenge trading detected on 3 occasions (2 Fridays, 1 Thursday PM). You show a strong tendency to overtrade after a stop-out between 14:00–16:00. Discipline is otherwise good — you followed your rules on 91 of 94 trades.",
  },
  {
    title: "Best Setups",
    score: 85,
    color: "#a78bfa",
    body: "HTF Trend trades: avg P&L +€142, win rate 78%. A+ Setup: avg P&L +€96, win rate 82%. London Session filter adds significant edge — your win rate is 74% in London vs 52% outside. Supply/FVG combinations are working well.",
  },
  {
    title: "Recommendations",
    score: 0,
    color: "#ff3c3c",
    body: "",
    recommendations: [
      "Stop trading on Fridays until your Friday win rate exceeds 55%",
      "Set a hard cutoff at 15:00 London time — no new positions after this",
      "Use partial TP at 1:1 + trail to breakeven for runner",
      "After 2 losses in a day, close MT4 and review tomorrow",
      "Aim to keep max DD under 3% per month before attempting a prop challenge",
    ],
  },
];

export const MOCK_AI_REPORT = {
  title: "Monthly Performance Report",
  date: "Apr 2026",
  overallScore: 74,
  summary:
    "Strong month with 68.4% win rate and +€2,840 net P&L (+29.5%). Your risk management is disciplined and your setups are producing consistent edge. Main development areas: Friday/afternoon trading and letting winners run to full target.",
  insights: [
    "Risk: daily drawdown stayed under 1.5% on 22 of 24 sessions — strong baseline discipline.",
    "Edge: London session trades win 74% vs 52% outside — lean into your best window.",
    "Watch: Friday + post–stop-out hours (14:00–16:00) cluster most revenge-style entries.",
    "Next step: hard 15:00 London cutoff for new positions until Friday stats improve.",
  ],
};
