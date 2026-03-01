"use client";

import { Suspense, useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { MiniEquityChart } from "./components/MiniEquityChart";
import { SanityBadge, getSanityLevel } from "./components/SanityBadge";

function formatTradeDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function profitPctOfBalance(profit: number, balance: number): number | null {
  if (!Number.isFinite(balance) || balance <= 0) return null;
  return (profit / balance) * 100;
}

function normalizeType(t: string): "Buy" | "Sell" {
  const u = (t || "").toLowerCase();
  if (u === "sell" || u === "short" || u === "dealsell") return "Sell";
  if (u === "buy" || u === "dealbuy") return "Buy";
  return "Buy";
}

const CONTRACT_SIZE = 100_000;
const PAGE_SIZE = 50;

type Account = {
  id: string;
  broker_type: string;
  account_number: string;
  account_name?: string | null;
  metaapi_account_id: string | null;
};

type Trade = {
  ticket: number;
  openTime: string;
  closeTime: string;
  type: string;
  symbol: string;
  lots: number;
  openPrice: number;
  closePrice: number;
  profit: number;
  comment?: string;
  stopLoss?: number | null;
};

type Rules = {
  max_risk_per_trade_pct: number;
  revenge_threshold_trades: number;
  max_exposure_pct: number;
};

function accountLabel(a: Account): string {
  const login = a.account_number ?? "";
  const name = a.account_name?.trim();
  return name ? `${login} · ${name}` : login;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

function TradesPageContent() {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [currency, setCurrency] = useState("EUR");
  const [balance, setBalance] = useState(0);
  const [rules, setRules] = useState<Rules | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [selectedTickets, setSelectedTickets] = useState<Set<number>>(new Set());
  const [aiModal, setAiModal] = useState<{ open: true; insight: { summary: string; patterns: string[]; emotional: string[] } } | { open: false }>({ open: false });
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const date = searchParams.get("date");
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setDateFrom(date);
      setDateTo(date);
    }
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      try {
        const accRes = await fetch("/api/accounts");
        const body = await accRes.json().catch(() => ({}));
        if (!accRes.ok) {
          setError(body?.error ?? "Failed to load accounts");
          return;
        }
        const list = body.accounts ?? [];
        setAccounts(list);
        const uuidFromUrl = searchParams.get("uuid");
        if (uuidFromUrl && list.some((a: Account) => a.metaapi_account_id === uuidFromUrl)) {
          setSelectedUuid(uuidFromUrl);
        } else {
          const first = list?.[0];
          if (first?.metaapi_account_id) setSelectedUuid(first.metaapi_account_id);
          else setSelectedUuid("");
        }
      } catch {
        setError("Failed to load accounts");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedUuid === null) return;
    setTrades([]);
    setError(null);
    const u = selectedUuid || "";
    (async () => {
      try {
        const res = await fetch(`/api/trades${u ? `?uuid=${encodeURIComponent(u)}` : ""}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to load trades");
          setTrades([]);
          return;
        }
        setTrades(data.trades ?? []);
        setCurrency(data.currency ?? "EUR");
        setBalance(Number(data.balance) || 0);
        if (data.rules) {
          setRules({
            max_risk_per_trade_pct: Number(data.rules.max_risk_per_trade_pct) ?? 1,
            revenge_threshold_trades: Number(data.rules.revenge_threshold_trades) ?? 2,
            max_exposure_pct: Number(data.rules.max_exposure_pct) ?? 6
          });
        } else {
          setRules(null);
        }
      } catch {
        setError("Request failed");
        setTrades([]);
      }
    })();
  }, [selectedUuid]);

  const filteredTrades = useMemo(() => {
    let list = trades;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          (t.comment ?? "").toLowerCase().includes(q) ||
          String(t.ticket).includes(q)
      );
    }
    if (dateFrom) {
      const from = dateFrom + "T00:00:00";
      list = list.filter((t) => t.closeTime >= from);
    }
    if (dateTo) {
      const to = dateTo + "T23:59:59";
      list = list.filter((t) => t.closeTime <= to);
    }
    return list;
  }, [trades, search, dateFrom, dateTo]);

  const sortedByTime = useMemo(() => {
    const copy = [...filteredTrades];
    copy.sort((a, b) => new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime());
    return copy;
  }, [filteredTrades]);

  const totalProfit = useMemo(() => sortedByTime.reduce((s, t) => s + t.profit, 0), [sortedByTime]);
  const initialBalance = balance - totalProfit;

  const equityCurveData = useMemo(() => {
    let cum = 0;
    return sortedByTime.map((t, index) => {
      cum += t.profit;
      const equity = initialBalance + cum;
      const pct = equity > 0 ? (cum / equity) * 100 : 0;
      return {
        index,
        closeTime: t.closeTime,
        cumulative: Math.round(cum * 100) / 100,
        pct,
        label: t.closeTime.slice(0, 10)
      };
    });
  }, [sortedByTime, initialBalance]);

  const riskPctAndEquity = useMemo(() => {
    let runningEquity = initialBalance;
    return sortedByTime.map((t) => {
      const equity = runningEquity;
      runningEquity += t.profit;
      let riskPct: number | null = null;
      if (
        t.stopLoss != null &&
        Number.isFinite(t.stopLoss) &&
        t.lots > 0 &&
        equity > 0
      ) {
        const riskAmount = t.lots * CONTRACT_SIZE * Math.abs(t.openPrice - t.stopLoss);
        riskPct = (riskAmount / equity) * 100;
      }
      return { riskPct, equity };
    });
  }, [sortedByTime, initialBalance]);

  const consecutiveLossesBefore = useMemo(() => {
    const out: number[] = [];
    let streak = 0;
    for (let i = 0; i < sortedByTime.length; i++) {
      out.push(streak);
      if (sortedByTime[i].profit < 0) streak += 1;
      else streak = 0;
    }
    return out;
  }, [sortedByTime]);

  const summary = useMemo(() => {
    const n = filteredTrades.length;
    if (n === 0)
      return {
        total: 0,
        wins: 0,
        winPct: 0,
        avgWin: 0,
        avgLoss: 0,
        maxLoss: 0
      };
    const wins = filteredTrades.filter((t) => t.profit > 0);
    const losses = filteredTrades.filter((t) => t.profit < 0);
    const avgWin = wins.length ? wins.reduce((s, t) => s + t.profit, 0) / wins.length : 0;
    const avgLoss = losses.length ? losses.reduce((s, t) => s + t.profit, 0) / losses.length : 0;
    const maxLoss = losses.length ? Math.min(...losses.map((t) => t.profit)) : 0;
    return {
      total: n,
      wins: wins.length,
      winPct: (wins.length / n) * 100,
      avgWin,
      avgLoss,
      maxLoss
    };
  }, [filteredTrades]);

  const paginatedTrades = useMemo(() => {
    const start = page * PAGE_SIZE;
    return sortedByTime.slice(start, start + PAGE_SIZE);
  }, [sortedByTime, page]);

  const totalPages = Math.ceil(sortedByTime.length / PAGE_SIZE) || 1;

  const toggleSelect = useCallback((ticket: number) => {
    setSelectedTickets((prev) => {
      const next = new Set(prev);
      if (next.has(ticket)) next.delete(ticket);
      else next.add(ticket);
      return next;
    });
  }, []);

  const runAiInsight = useCallback(async () => {
    const tickets = Array.from(selectedTickets);
    if (tickets.length === 0 || tickets.length > 15) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/trade-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketIds: tickets })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Errore analisi");
        return;
      }
      setAiModal({
        open: true,
        insight: {
          summary: data.summary ?? "",
          patterns: Array.isArray(data.patterns) ? data.patterns : [],
          emotional: Array.isArray(data.emotional) ? data.emotional : []
        }
      });
    } catch {
      alert("Errore di rete");
    } finally {
      setAiLoading(false);
    }
  }, [selectedTickets]);

  const selectedIndicesForChart = useMemo(() => {
    const set = new Set<number>();
    selectedTickets.forEach((ticket) => {
      const globalIndex = sortedByTime.findIndex((x) => x.ticket === ticket);
      if (globalIndex >= 0) set.add(globalIndex);
    });
    return set;
  }, [selectedTickets, sortedByTime]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">Trades</h1>
          <p className="text-sm text-slate-500 mt-1">
            Closed orders. Sanity badge, equity curve and AI insight.
          </p>
        </div>
        <select
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500 min-w-[200px]"
          value={selectedUuid ?? ""}
          onChange={(e) => setSelectedUuid(e.target.value || null)}
          disabled={loading}
        >
          <option value="">Select account</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.metaapi_account_id ?? ""}>
              {accountLabel(a)}
            </option>
          ))}
        </select>
      </header>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search symbol, ticket, comment..."
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500 w-52"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <label className="flex items-center gap-1.5 text-slate-400 text-xs">
          <span>From</span>
          <input
            type="date"
            className="rounded border border-slate-700 bg-slate-800/50 px-2 py-1.5 text-slate-200 text-xs outline-none focus:border-cyan-500 w-[130px]"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-1.5 text-slate-400 text-xs">
          <span>To</span>
          <input
            type="date"
            className="rounded border border-slate-700 bg-slate-800/50 px-2 py-1.5 text-slate-200 text-xs outline-none focus:border-cyan-500 w-[130px]"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </label>
        {(searchInput || dateFrom || dateTo) && (
          <button
            type="button"
            className="text-xs text-slate-400 hover:text-slate-200"
            onClick={() => {
              setSearchInput("");
              setDateFrom("");
              setDateTo("");
              setPage(0);
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {filteredTrades.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Trades</p>
              <p className="text-lg font-semibold text-slate-200">{summary.total}</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Win %</p>
              <p className="text-lg font-semibold text-emerald-400">{summary.winPct.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Avg Win</p>
              <p className="text-lg font-semibold text-emerald-400">
                +{summary.avgWin.toFixed(2)} {currency}
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Avg Loss</p>
              <p className="text-lg font-semibold text-red-400">
                {summary.avgLoss.toFixed(2)} {currency}
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Max loss</p>
              <p className="text-lg font-semibold text-red-400">{summary.maxLoss.toFixed(2)} {currency}</p>
            </div>
          </div>

          <MiniEquityChart
            data={equityCurveData}
            selectedIndices={selectedIndicesForChart}
            currency={currency}
            height={140}
          />

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={selectedTickets.size === 0 || selectedTickets.size > 15 || aiLoading}
              onClick={runAiInsight}
              className="rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:pointer-events-none px-3 py-2 text-sm font-medium text-white"
            >
              {aiLoading ? "Analisi…" : `Analizza selezionati (${selectedTickets.size})`}
            </button>
            {selectedTickets.size > 0 && (
              <button
                type="button"
                className="text-xs text-slate-400 hover:text-slate-200"
                onClick={() => setSelectedTickets(new Set())}
              >
                Deseleziona
              </button>
            )}
          </div>
        </>
      )}

      <div className="rounded-xl border border-slate-800 bg-surface overflow-hidden">
        {loading && selectedUuid !== null ? (
          <div className="p-8 flex flex-col items-center justify-center gap-4 min-h-[280px]">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-slate-700" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500 animate-spin" />
            </div>
            <p className="text-sm text-slate-400 animate-pulse">Loading trades…</p>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            {trades.length === 0 && !error
              ? "No trades. Connect an account and ensure it has closed orders."
              : "No trades match the current filters."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left text-slate-400 uppercase tracking-wide text-xs">
                  <th className="px-2 py-3 font-medium w-8" title="Select for AI">Sel</th>
                  <th className="px-4 py-3 font-medium">Close time</th>
                  <th className="px-4 py-3 font-medium">Symbol</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Lots</th>
                  <th className="px-4 py-3 font-medium">Open</th>
                  <th className="px-4 py-3 font-medium">Close</th>
                  <th className="px-4 py-3 font-medium">Profit</th>
                  <th className="px-4 py-3 font-medium" title="Sanity: verde ok, giallo borderline, rosso revenge/risk">Sanity</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTrades.map((t, idx) => {
                  const globalIndex = sortedByTime.findIndex((x) => x.ticket === t.ticket);
                  const type = normalizeType(t.type);
                  const pct = profitPctOfBalance(t.profit, balance);
                  const { riskPct } = riskPctAndEquity[globalIndex] ?? { riskPct: null };
                  const consec = consecutiveLossesBefore[globalIndex] ?? 0;
                  const maxRisk = rules?.max_risk_per_trade_pct ?? 1;
                  const revengeThr = rules?.revenge_threshold_trades ?? 2;
                  const sanity = getSanityLevel({
                    consecutiveLossesBefore: consec,
                    riskPct,
                    maxRiskPct: maxRisk,
                    revengeThreshold: revengeThr
                  });
                  const rowTitle = `Ticket ${t.ticket}${t.comment ? ` · ${t.comment}` : ""}`;

                  return (
                    <tr
                      key={t.ticket}
                      className={`border-b border-slate-800/80 hover:bg-slate-800/40 ${
                        idx % 2 === 0 ? "bg-slate-900/50" : "bg-slate-800/30"
                      }`}
                    >
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={selectedTickets.has(t.ticket)}
                          onChange={() => toggleSelect(t.ticket)}
                          title="Seleziona per Analizza selezionati"
                          className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap" title={rowTitle}>
                        {formatTradeDate(t.closeTime)}
                      </td>
                      <td className="px-4 py-3 text-slate-200 font-medium" title={t.symbol}>
                        {t.symbol}
                      </td>
                      <td className="px-4 py-3">
                        <span className={type === "Buy" ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>
                          {type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300" title={`Lots: ${t.lots}`}>
                        {t.lots > 0 ? t.lots.toFixed(2) : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{t.openPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-300">{t.closePrice.toFixed(2)}</td>
                      <td
                        className={`px-4 py-3 font-medium ${t.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}
                        title={`Ticket ${t.ticket}. ${t.profit >= 0 ? "+" : ""}${t.profit.toFixed(2)} ${currency}${pct != null ? ` (${(t.profit >= 0 ? "+" : "")}${pct.toFixed(2)}% sul conto)` : ""}`}
                      >
                        {t.profit >= 0 ? "+" : ""}
                        {t.profit.toFixed(2)} {currency}
                        {pct != null && (
                          <span className="text-slate-500 ml-1">
                            ({t.profit >= 0 ? "+" : ""}{pct.toFixed(2)}%)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3" title={sanity.tooltip}>
                        <SanityBadge level={sanity.level} tooltip={sanity.tooltip} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredTrades.length > 0 && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-300 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-slate-400 text-sm">
                Page {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {aiModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setAiModal({ open: false })}
        >
          <div
            className="rounded-xl border border-slate-700 bg-slate-900 p-6 max-w-lg w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-100 mb-3">AI Insight</h3>
            <p className="text-sm text-slate-300 whitespace-pre-wrap mb-4">{aiModal.insight.summary}</p>
            {aiModal.insight.patterns.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-slate-500 uppercase mb-1">Pattern</p>
                <ul className="list-disc list-inside text-sm text-slate-300">
                  {aiModal.insight.patterns.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            {aiModal.insight.emotional.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-slate-500 uppercase mb-1">Emotivo</p>
                <ul className="list-disc list-inside text-sm text-slate-300">
                  {aiModal.insight.emotional.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              className="mt-4 rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-slate-200"
              onClick={() => setAiModal({ open: false })}
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TradesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-8 w-48 rounded bg-slate-800 animate-pulse" />
          <div className="h-64 rounded-xl border border-slate-800 bg-slate-800/30 flex items-center justify-center text-slate-500 text-sm">
            Loading…
          </div>
        </div>
      }
    >
      <TradesPageContent />
    </Suspense>
  );
}
