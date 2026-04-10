/** Symbol dropdown groups for new session form (exact lists per product spec). */

export const SESSION_SYMBOL_GROUPS: { label: string; symbols: string[] }[] = [
  {
    label: "Forex majors",
    symbols: ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD"]
  },
  {
    label: "Forex minors",
    symbols: [
      "EURGBP",
      "EURJPY",
      "EURCHF",
      "EURAUD",
      "EURCAD",
      "EURNZD",
      "GBPJPY",
      "GBPCHF",
      "GBPAUD",
      "GBPCAD",
      "GBPNZD",
      "AUDJPY",
      "AUDCHF",
      "AUDCAD",
      "AUDNZD",
      "CADJPY",
      "CADCHF",
      "NZDJPY",
      "NZDCHF",
      "CHFJPY"
    ]
  },
  {
    label: "Indices",
    symbols: ["US30", "US500", "US100", "UK100", "GER40", "FRA40", "JPN225", "AUS200", "HK50", "ESP35"]
  },
  {
    label: "Commodities",
    symbols: ["XAUUSD", "XAGUSD", "XPTUSD", "USOIL", "UKOIL", "NATGAS"]
  },
  {
    label: "Crypto CFD",
    symbols: ["BTCUSD", "ETHUSD", "LTCUSD", "XRPUSD", "SOLUSD"]
  }
];

export const DEFAULT_SESSION_SYMBOL = "EURUSD";
