// ─── Mock data used for demo mode (plan === 'user') ───────────────────────────
// All data is fictional and used only for display purposes.

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const MOCK_DASHBOARD = {
  balance: 10_000,
  equity: 10_247,
  dailyPnl: 245.5,
  dailyPnlPct: 2.46,
  winRate: 67.3,
  totalTrades: 47,
  profitFactor: 2.14,
  avgRR: 1.92,
  maxDdPct: 4.5,
  dailyDdPct: 1.2,
};

export const MOCK_EQUITY_CURVE = [
  { date: "Mar 14", value: 10_000 },
  { date: "Mar 15", value: 10_120 },
  { date: "Mar 16", value: 10_080 },
  { date: "Mar 17", value: 10_235 },
  { date: "Mar 18", value: 10_190 },
  { date: "Mar 19", value: 10_315 },
  { date: "Mar 20", value: 10_450 },
  { date: "Mar 21", value: 10_380 },
  { date: "Mar 22", value: 10_520 },
  { date: "Mar 23", value: 10_465 },
  { date: "Mar 24", value: 10_600 },
  { date: "Mar 25", value: 10_720 },
  { date: "Mar 26", value: 10_680 },
  { date: "Mar 27", value: 10_800 },
  { date: "Mar 28", value: 10_755 },
  { date: "Mar 29", value: 10_870 },
  { date: "Mar 30", value: 10_950 },
  { date: "Mar 31", value: 10_905 },
  { date: "Apr 01", value: 11_020 },
  { date: "Apr 02", value: 11_085 },
  { date: "Apr 03", value: 11_050 },
  { date: "Apr 04", value: 11_185 },
  { date: "Apr 05", value: 11_120 },
  { date: "Apr 06", value: 11_245 },
  { date: "Apr 07", value: 11_200 },
  { date: "Apr 08", value: 11_310 },
  { date: "Apr 09", value: 11_285 },
  { date: "Apr 10", value: 11_350 },
  { date: "Apr 11", value: 11_290 },
  { date: "Apr 12", value: 11_240 },
] as { date: string; value: number }[];

export const MOCK_ALERTS = [
  { id: "1", type: "HIGH", message: "Daily drawdown approaching limit (1.2% / 2%)", time: "2 hours ago" },
  { id: "2", type: "MEDIUM", message: "Position size above recommended on EURUSD", time: "4 hours ago" },
];

export const MOCK_RISK_RULES = [
  { name: "Max Daily Loss", value: "2%", status: "safe" as const, current: "1.2%" },
  { name: "Max Position Size", value: "1%", status: "warning" as const, current: "1.4%" },
  { name: "Max Open Trades", value: "3", status: "safe" as const, current: "2" },
];

// ─── Journal ──────────────────────────────────────────────────────────────────

export type MockTrade = {
  id: string;
  date: string;
  symbol: string;
  direction: "buy" | "sell";
  lots: number;
  entry: number;
  exit: number;
  pnl: number;
  rr: number;
  duration: string;
};

export const MOCK_TRADES: MockTrade[] = [
  { id: "1",  date: "Apr 12", symbol: "EURUSD", direction: "sell", lots: 0.12, entry: 1.0950, exit: 1.0880, pnl:  84.00, rr: 2.8, duration: "8h 00m" },
  { id: "2",  date: "Apr 11", symbol: "XAUUSD", direction: "buy",  lots: 0.02, entry: 2298.0, exit: 2315.0, pnl:  34.00, rr: 1.7, duration: "4h 30m" },
  { id: "3",  date: "Apr 11", symbol: "GBPUSD", direction: "buy",  lots: 0.08, entry: 1.2620, exit: 1.2580, pnl: -32.00, rr: -0.9, duration: "1h 10m" },
  { id: "4",  date: "Apr 10", symbol: "EURUSD", direction: "buy",  lots: 0.10, entry: 1.0842, exit: 1.0898, pnl:  56.00, rr: 2.2, duration: "3h 40m" },
  { id: "5",  date: "Apr 09", symbol: "US30",   direction: "sell", lots: 0.01, entry: 39650,  exit: 39480,  pnl: 170.00, rr: 3.2, duration: "4h 20m" },
  { id: "6",  date: "Apr 08", symbol: "XAUUSD", direction: "sell", lots: 0.01, entry: 2330.0, exit: 2305.5, pnl:  24.50, rr: 1.6, duration: "3h 15m" },
  { id: "7",  date: "Apr 08", symbol: "GBPUSD", direction: "sell", lots: 0.10, entry: 1.2720, exit: 1.2680, pnl:  40.00, rr: 2.0, duration: "1h 50m" },
  { id: "8",  date: "Apr 07", symbol: "EURUSD", direction: "buy",  lots: 0.08, entry: 1.0780, exit: 1.0840, pnl:  48.00, rr: 1.8, duration: "2h 45m" },
  { id: "9",  date: "Apr 07", symbol: "US30",   direction: "buy",  lots: 0.01, entry: 39520,  exit: 39480,  pnl: -40.00, rr: -1.0, duration: "30m" },
  { id: "10", date: "Apr 04", symbol: "XAUUSD", direction: "buy",  lots: 0.02, entry: 2290.0, exit: 2318.5, pnl:  57.00, rr: 2.1, duration: "6h 30m" },
  { id: "11", date: "Apr 04", symbol: "GBPUSD", direction: "buy",  lots: 0.05, entry: 1.2560, exit: 1.2520, pnl: -20.00, rr: -0.8, duration: "1h 05m" },
  { id: "12", date: "Apr 03", symbol: "EURUSD", direction: "sell", lots: 0.10, entry: 1.0910, exit: 1.0856, pnl:  54.00, rr: 2.4, duration: "5h 10m" },
  { id: "13", date: "Apr 02", symbol: "GBPUSD", direction: "sell", lots: 0.05, entry: 1.2648, exit: 1.2590, pnl:  29.00, rr: 1.9, duration: "2h 20m" },
  { id: "14", date: "Apr 01", symbol: "XAUUSD", direction: "sell", lots: 0.01, entry: 2315.5, exit: 2298.3, pnl:  17.20, rr: 1.5, duration: "1h 15m" },
  { id: "15", date: "Apr 01", symbol: "US30",   direction: "buy",  lots: 0.01, entry: 39840,  exit: 39780,  pnl: -60.00, rr: -1.0, duration: "45m" },
];

export const MOCK_JOURNAL_STATS = {
  totalTrades: 47,
  winRate: 64,
  avgRR: 1.8,
  totalPnl: 1240,
  maxDd: 3.2,
};

// ─── Backtesting ──────────────────────────────────────────────────────────────

export const MOCK_BT_SESSIONS = [
  {
    id: "bt1",
    name: "EURUSD M5 Scalping",
    symbol: "EURUSD",
    timeframe: "M5",
    dateFrom: "Jan 01, 2026",
    dateTo: "Mar 31, 2026",
    initialBalance: 10_000,
    finalBalance: 11_850,
    totalTrades: 312,
    winRate: 61.2,
    profitFactor: 1.87,
    maxDd: 5.4,
    status: "completed" as const,
  },
  {
    id: "bt2",
    name: "XAUUSD H1 Trend Follow",
    symbol: "XAUUSD",
    timeframe: "H1",
    dateFrom: "Jan 01, 2026",
    dateTo: "Mar 31, 2026",
    initialBalance: 10_000,
    finalBalance: 12_340,
    totalTrades: 87,
    winRate: 58.6,
    profitFactor: 2.31,
    maxDd: 7.1,
    status: "completed" as const,
  },
];

// ─── Risk Manager ─────────────────────────────────────────────────────────────

export const MOCK_RISK = {
  balance: 10_000,
  equity: 10_247,
  dailyDd: 1.2,
  maxDd: 4.5,
  openPositions: 2,
};

export const MOCK_RISK_VIOLATIONS = [
  { id: "v1", rule: "Max Position Size", message: "EURUSD lot size exceeded threshold", time: "Today 09:42", severity: "medium" as const },
  { id: "v2", rule: "Max Daily Loss", message: "Approaching 60% of daily loss limit", time: "Today 11:18", severity: "high" as const },
];

// ─── AI Coach ─────────────────────────────────────────────────────────────────

export const MOCK_AI_MESSAGES = [
  {
    role: "user" as const,
    content: "Can you analyze my trading performance this week?",
    time: "10:12 AM",
  },
  {
    role: "assistant" as const,
    content:
      "Based on your recent trades, your win rate of 67% is above average — well done. However, I notice your average loss is 1.4× larger than your average win. To improve your risk-reward, consider tightening stop losses on EURUSD scalps and only entering after confluence of at least 2 confirmation signals.",
    time: "10:12 AM",
  },
  {
    role: "user" as const,
    content: "What about my position sizing on XAUUSD?",
    time: "10:14 AM",
  },
  {
    role: "assistant" as const,
    content:
      "Your XAUUSD position sizes are 1.4% of balance on average — slightly above your 1% rule. Consider using a fixed-fractional model: risk exactly 1% per trade and let the lot size be calculated from your stop distance. This eliminates sizing guesswork and keeps your exposure consistent regardless of market volatility.",
    time: "10:14 AM",
  },
];

export const MOCK_AI_REPORT = {
  title: "Weekly Performance Report",
  date: "Apr 12, 2026",
  summary:
    "Strong week with 67% win rate and +2.46% account growth. Key strengths: discipline on EURUSD trend trades and good exit timing. Main improvement area: position sizing consistency on volatile instruments (XAUUSD, US30).",
  insights: [
    "Your best performing setup is EURUSD sell during London session open (avg RR 2.6)",
    "US30 trades underperforming — consider reducing size or avoiding during news events",
    "Daily drawdown never exceeded 1.5% this week — excellent risk control",
  ],
};
