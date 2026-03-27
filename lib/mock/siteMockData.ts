/** Static mock payloads for /mock preview routes only — not used by live APIs. */

export const MOCK_CURRENCY = "EUR";

export const MOCK_ACCOUNT = {
  label: "500123 · FTMO Demo",
  uuid: "mock-uuid-001",
};

/** Extra days for calendar density (same month as mock “today”). */
export const MOCK_DASHBOARD_STATS = {
  balance: 102_450.32,
  equity: 102_180.55,
  balancePct: 2.45,
  equityPct: 2.18,
  winRate: 58.2,
  avgRiskReward: 1.35,
  avgWin: 420.5,
  avgLoss: 280.0,
  avgWinPct: 0.41,
  avgLossPct: 0.28,
  profitFactor: 1.42,
  maxDdDollars: -3200,
  highestDdPct: 4.8,
  peakDdDate: "2025-11-12",
  winsCount: 42,
  lossesCount: 28,
  drawsCount: 5,
  dailyDdPct: -1.2,
  currentExposurePct: 3.4,
  equityCurve: Array.from({ length: 24 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (23 - i));
    const pct = -2 + i * 0.35 + (i % 3) * 0.2;
    return {
      date: d.toISOString().slice(0, 10),
      value: 100000 * (1 + pct / 100),
      pctFromStart: pct,
    };
  }),
  dailyStats: [
    { date: "2026-03-05", profit: 45, trades: 2, wins: 1 },
    { date: "2026-03-06", profit: -120, trades: 4, wins: 1 },
    { date: "2026-03-10", profit: 200, trades: 3, wins: 2 },
    { date: "2026-03-12", profit: 88, trades: 2, wins: 2 },
    { date: "2026-03-15", profit: -40, trades: 6, wins: 2 },
    { date: "2026-03-18", profit: 310, trades: 5, wins: 4 },
    { date: "2026-03-20", profit: 120, trades: 3, wins: 2 },
    { date: "2026-03-21", profit: -80, trades: 5, wins: 2 },
    { date: "2026-03-22", profit: 200, trades: 4, wins: 3 },
  ],
  initialBalance: 100_000,
  updatedAt: new Date().toISOString(),
};

export const MOCK_RULES = {
  daily_loss_pct: 3,
  max_risk_per_trade_pct: 1,
  max_exposure_pct: 6,
  revenge_threshold_trades: 3,
};

export const MOCK_ALERTS = [
  {
    id: "1",
    message: "Daily loss approaching limit (2.8% of 3%)",
    severity: "medium",
    solution: "Reduce size or pause until tomorrow.",
    alert_date: new Date().toISOString(),
    read: false,
  },
  {
    id: "2",
    message: "Exposure above comfort zone vs your plan",
    severity: "high",
    solution: "Close or hedge one position before adding size.",
    alert_date: new Date().toISOString(),
    read: false,
  },
];

export const MOCK_TRADES = [
  {
    ticket: 1001,
    closeTime: "2026-03-22T14:32:00Z",
    symbol: "EURUSD",
    type: "buy",
    lots: 0.5,
    openPrice: 1.0821,
    closePrice: 1.0845,
    profit: 240,
  },
  {
    ticket: 1002,
    closeTime: "2026-03-22T09:15:00Z",
    symbol: "XAUUSD",
    type: "sell",
    lots: 0.2,
    openPrice: 3025.4,
    closePrice: 3018.1,
    profit: 146,
  },
  {
    ticket: 1003,
    closeTime: "2026-03-21T16:40:00Z",
    symbol: "GBPUSD",
    type: "buy",
    lots: 0.3,
    openPrice: 1.265,
    closePrice: 1.2628,
    profit: -132,
  },
];

export const MOCK_ACCOUNTS = [
  {
    id: "acc-1",
    broker_type: "MT5",
    account_number: "500123",
    account_name: "FTMO Demo",
    metaapi_account_id: "mock-meta-1",
    created_at: "2026-01-10T10:00:00Z",
  },
  {
    id: "acc-2",
    broker_type: "MT4",
    account_number: "778899",
    account_name: "Personal",
    metaapi_account_id: "mock-meta-2",
    created_at: "2025-12-01T14:30:00Z",
  },
];

/** Rich AI Coach payload for mock — same sections as live UI when data is present. */
export const MOCK_AI_COACH = {
  analysisWindow: { lookbackDays: 90, minTrades: 10, lastComputed: "2026-03-22T18:00:00Z" },
  model: { label: "Preview · static", provider: "mock", temperature: 0.2 },
  scores: {
    discipline: 72,
    riskConsistency: 64,
    emotionalReactivity: 58,
    strategyAdherence: 81,
    overall: 69,
  },
  behavioral: {
    avgSizeAfterLossPct: 38,
    revengeTradesCount: 4,
    tradesOutsidePlanPct: 12,
    largestSingleLossPct: 2.1,
    consecutiveLossMax: 3,
  },
  sessionWinRate: [
    { session: "Asia", winPct: 52, trades: 18 },
    { session: "London", winPct: 64, trades: 35 },
    { session: "NY", winPct: 48, trades: 22 },
  ],
  symbolStats: [
    { symbol: "EURUSD", trades: 28, netR: 1.42, avgHoldMin: 95 },
    { symbol: "XAUUSD", trades: 14, netR: 0.88, avgHoldMin: 42 },
    { symbol: "NAS100", trades: 8, netR: -0.35, avgHoldMin: 120 },
  ],
  parameters: [
    { name: "Avg R after loss", value: "0.62", benchmark: "≥ 1.0", status: "warn" as const },
    { name: "Risk per trade vs plan", value: "0.95%", benchmark: "≤ 1.0%", status: "ok" as const },
    { name: "Trades / day (30d avg)", value: "4.2", benchmark: "≤ 6", status: "ok" as const },
    { name: "News window trades", value: "22%", benchmark: "≤ 15%", status: "warn" as const },
  ],
  insights: [
    {
      title: "Post-loss sizing",
      body: "After 2 consecutive losses you increased volume ~40% on the next trade — fixed % risk would stabilize expectancy.",
      severity: "medium" as const,
    },
    {
      title: "Session edge",
      body: "Win rate is 12 points higher in London vs NY open; consider reducing size during NY first hour.",
      severity: "low" as const,
    },
    {
      title: "Symbol concentration",
      body: "62% of R comes from EURUSD; a patch of losses on that pair drives most of the weekly swing.",
      severity: "low" as const,
    },
  ],
  weeklyFocus: [
    "Cap risk at 0.75% until 20 more trades logged",
    "No new positions in the 15m after red folder news",
    "Journal one sentence before each trade for 1 week",
  ],
  checklist: [
    { id: "c1", label: "Daily loss rule respected this week", done: true },
    { id: "c2", label: "No revenge trades after 2 losses (streak)", done: false },
    { id: "c3", label: "Reviewed largest loss and SL placement", done: true },
  ],
};

export type AiCoachModel = typeof MOCK_AI_COACH;
