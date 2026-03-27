/** Static mock payloads for /mock preview routes only — not used by live APIs. */

export const MOCK_CURRENCY = "EUR";

export const MOCK_ACCOUNT = {
  label: "500123 · FTMO Demo",
  uuid: "mock-uuid-001",
};

export const MOCK_DASHBOARD_STATS = {
  balance: 102_450.32,
  equity: 102_180.55,
  balancePct: 2.45,
  equityPct: 2.18,
  winRate: 58.2,
  avgRiskReward: 1.35,
  avgWin: 420.5,
  avgLoss: -280.0,
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
    { date: "2026-03-20", profit: 120, trades: 3, wins: 2 },
    { date: "2026-03-21", profit: -80, trades: 5, wins: 2 },
    { date: "2026-03-22", profit: 200, trades: 4, wins: 3 },
  ],
  initialBalance: 100_000,
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

export const MOCK_POSITIONS = [
  {
    ticket: 2001,
    symbol: "EURUSD",
    type: "Buy",
    volume: 0.2,
    openPrice: 1.0855,
    profit: 45.2,
    stopLoss: 1.081,
    takeProfit: 1.092,
  },
  {
    ticket: 2002,
    symbol: "NAS100",
    type: "Sell",
    volume: 0.5,
    openPrice: 21450,
    profit: -28.4,
    stopLoss: 21580,
    takeProfit: 21100,
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

export const MOCK_AI_INSIGHTS = [
  {
    title: "Post-loss sizing",
    body: "After 2 consecutive losses you increased volume 40% on the next trade — consider a fixed risk % instead.",
  },
  {
    title: "Session focus",
    body: "Most drawdown clusters around NY open; your win rate is 12% higher in London session.",
  },
];
