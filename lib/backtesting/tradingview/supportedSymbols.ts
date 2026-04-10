/**
 * User-facing symbols supported for search / resolve in the backtesting chart.
 * Twelve Data normalization (e.g. EURUSD → EUR/USD) is handled server-side.
 */
export type SupportedSymbolMeta = {
  symbol: string;
  full_name: string;
  description: string;
  exchange: string;
  ticker: string;
  type: string;
};

const FOREX_MAJORS_MINORS: SupportedSymbolMeta[] = [
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "USDCHF",
  "AUDUSD",
  "USDCAD",
  "NZDUSD",
  "EURGBP",
  "EURJPY",
  "GBPJPY",
  "EURCHF",
  "EURAUD",
  "EURCAD",
  "EURNZD",
  "GBPCHF",
  "GBPAUD",
  "GBPCAD",
  "GBPNZD",
  "AUDJPY",
  "CADJPY",
  "CHFJPY",
  "NZDJPY",
  "AUDNZD",
  "AUDCAD",
  "CADCHF"
].map((symbol) => ({
  symbol,
  full_name: `FOREX:${symbol}`,
  description: `${symbol.slice(0, 3)}/${symbol.slice(3)}`,
  exchange: "FOREX",
  ticker: symbol,
  type: "forex"
}));

const INDICES_COMMODITIES_CRYPTO: SupportedSymbolMeta[] = [
  { symbol: "US30", full_name: "INDEX:US30", description: "Dow Jones 30", exchange: "INDEX", ticker: "US30", type: "index" },
  { symbol: "US500", full_name: "INDEX:US500", description: "S&P 500", exchange: "INDEX", ticker: "US500", type: "index" },
  { symbol: "US100", full_name: "INDEX:US100", description: "Nasdaq 100", exchange: "INDEX", ticker: "US100", type: "index" },
  { symbol: "UK100", full_name: "INDEX:UK100", description: "FTSE 100", exchange: "INDEX", ticker: "UK100", type: "index" },
  { symbol: "GER40", full_name: "INDEX:GER40", description: "DAX 40", exchange: "INDEX", ticker: "GER40", type: "index" },
  { symbol: "FRA40", full_name: "INDEX:FRA40", description: "CAC 40", exchange: "INDEX", ticker: "FRA40", type: "index" },
  { symbol: "JPN225", full_name: "INDEX:JPN225", description: "Nikkei 225", exchange: "INDEX", ticker: "JPN225", type: "index" },
  { symbol: "AUS200", full_name: "INDEX:AUS200", description: "ASX 200", exchange: "INDEX", ticker: "AUS200", type: "index" },
  { symbol: "HK50", full_name: "INDEX:HK50", description: "Hang Seng", exchange: "INDEX", ticker: "HK50", type: "index" },
  { symbol: "ESP35", full_name: "INDEX:ESP35", description: "IBEX 35", exchange: "INDEX", ticker: "ESP35", type: "index" },
  { symbol: "XAUUSD", full_name: "METAL:XAUUSD", description: "Gold / USD", exchange: "METAL", ticker: "XAUUSD", type: "metal" },
  { symbol: "XAGUSD", full_name: "METAL:XAGUSD", description: "Silver / USD", exchange: "METAL", ticker: "XAGUSD", type: "metal" },
  { symbol: "XPTUSD", full_name: "METAL:XPTUSD", description: "Platinum / USD", exchange: "METAL", ticker: "XPTUSD", type: "metal" },
  { symbol: "USOIL", full_name: "COMMODITY:USOIL", description: "WTI Crude", exchange: "COMMODITY", ticker: "USOIL", type: "commodity" },
  { symbol: "UKOIL", full_name: "COMMODITY:UKOIL", description: "Brent Crude", exchange: "COMMODITY", ticker: "UKOIL", type: "commodity" },
  { symbol: "NATGAS", full_name: "COMMODITY:NATGAS", description: "Natural Gas", exchange: "COMMODITY", ticker: "NATGAS", type: "commodity" },
  { symbol: "BTCUSD", full_name: "CRYPTO:BTCUSD", description: "Bitcoin / USD", exchange: "CRYPTO", ticker: "BTCUSD", type: "crypto" },
  { symbol: "ETHUSD", full_name: "CRYPTO:ETHUSD", description: "Ethereum / USD", exchange: "CRYPTO", ticker: "ETHUSD", type: "crypto" },
  { symbol: "LTCUSD", full_name: "CRYPTO:LTCUSD", description: "Litecoin / USD", exchange: "CRYPTO", ticker: "LTCUSD", type: "crypto" },
  { symbol: "XRPUSD", full_name: "CRYPTO:XRPUSD", description: "XRP / USD", exchange: "CRYPTO", ticker: "XRPUSD", type: "crypto" },
  { symbol: "SOLUSD", full_name: "CRYPTO:SOLUSD", description: "Solana / USD", exchange: "CRYPTO", ticker: "SOLUSD", type: "crypto" }
];

export const SUPPORTED_SYMBOLS: SupportedSymbolMeta[] = [...FOREX_MAJORS_MINORS, ...INDICES_COMMODITIES_CRYPTO];

const BY_TICKER = new Map(SUPPORTED_SYMBOLS.map((s) => [s.ticker.toUpperCase(), s]));

export function findSupportedSymbolMeta(ticker: string): SupportedSymbolMeta | undefined {
  return BY_TICKER.get(ticker.trim().toUpperCase());
}

export function guessSymbolMeta(ticker: string): SupportedSymbolMeta {
  const u = ticker.trim().toUpperCase();
  const known = BY_TICKER.get(u);
  if (known) return known;

  if (u.length === 6 && /^[A-Z]{6}$/.test(u)) {
    return {
      symbol: u,
      full_name: `FOREX:${u}`,
      description: `${u.slice(0, 3)}/${u.slice(3)}`,
      exchange: "FOREX",
      ticker: u,
      type: "forex"
    };
  }

  return {
    symbol: u,
    full_name: `CUSTOM:${u}`,
    description: u,
    exchange: "CUSTOM",
    ticker: u,
    type: "cfd"
  };
}
