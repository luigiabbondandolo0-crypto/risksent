import type { BacktestSession, BacktestStrategy } from "./types";

export type BacktestingNamespace = "live" | "mock";

type StoreShape = {
  strategies: BacktestStrategy[];
  sessions: BacktestSession[];
};

const KEY = (ns: BacktestingNamespace) => `risksent.backtesting.v1.${ns}`;

function emptyStore(): StoreShape {
  return { strategies: [], sessions: [] };
}

export function loadStore(ns: BacktestingNamespace): StoreShape {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(KEY(ns));
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as StoreShape;
    if (!parsed || !Array.isArray(parsed.strategies) || !Array.isArray(parsed.sessions)) {
      return emptyStore();
    }
    return parsed;
  } catch {
    return emptyStore();
  }
}

export function saveStore(ns: BacktestingNamespace, data: StoreShape): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY(ns), JSON.stringify(data));
  } catch {
    /* quota */
  }
}

export function upsertStrategy(
  ns: BacktestingNamespace,
  strategy: BacktestStrategy
): StoreShape {
  const s = loadStore(ns);
  const i = s.strategies.findIndex((x) => x.id === strategy.id);
  if (i >= 0) s.strategies[i] = strategy;
  else s.strategies.push(strategy);
  saveStore(ns, s);
  return s;
}

export function upsertSession(ns: BacktestingNamespace, session: BacktestSession): StoreShape {
  const s = loadStore(ns);
  const i = s.sessions.findIndex((x) => x.id === session.id);
  if (i >= 0) s.sessions[i] = session;
  else s.sessions.push(session);
  saveStore(ns, s);
  return s;
}
