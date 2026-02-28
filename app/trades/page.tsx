"use client";

import { useEffect, useState, useMemo } from "react";

const MONTHS = "jan,feb,mar,apr,may,jun,jul,aug,sep,oct,nov,dec".split(",");

function formatTradeDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = MONTHS[d.getMonth()] ?? "jan";
  const year = d.getFullYear();
  const h = d.getHours();
  const m = d.getMinutes();
  return `${day}-${month}-${year} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function normalizeType(t: string): "Buy" | "Sell" {
  const u = (t || "").toLowerCase();
  if (u === "sell" || u === "short") return "Sell";
  return "Buy";
}

function changePct(openPrice: number, closePrice: number): number | null {
  if (openPrice === 0 || !Number.isFinite(openPrice)) return null;
  return ((closePrice - openPrice) / openPrice) * 100;
}

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
};

function accountLabel(a: Account): string {
  const login = a.account_number ?? "";
  const name = a.account_name?.trim();
  return name ? `${login} · ${name}` : login;
}

export default function TradesPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [currency, setCurrency] = useState("EUR");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    (async () => {
      try {
        console.log("[Trades] Fetching /api/accounts...");
        const accRes = await fetch("/api/accounts");
        const body = await accRes.json().catch(() => ({}));
        console.log("[Trades] /api/accounts response:", { status: accRes.status, ok: accRes.ok, body });
        if (!accRes.ok) {
          console.error("[Trades] /api/accounts failed:", accRes.status, body);
          setError(body?.error ?? "Failed to load accounts");
          return;
        }
        const list = body.accounts ?? [];
        setAccounts(list);
        const first = list?.[0];
        if (first?.metaapi_account_id) setSelectedUuid(first.metaapi_account_id);
        else setSelectedUuid("");
      } catch (e) {
        console.error("[Trades] /api/accounts exception:", e);
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
        const res = await fetch(
          `/api/trades${u ? `?uuid=${encodeURIComponent(u)}` : ""}`
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to load trades");
          setTrades([]);
          return;
        }
        setTrades(data.trades ?? []);
        setCurrency(data.currency ?? "EUR");
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

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">Trades</h1>
          <p className="text-sm text-slate-500 mt-1">
            Closed orders from the selected account. Filter by account, search and date.
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
          placeholder="Search symbol, ticket..."
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500 w-48"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <label className="flex items-center gap-1.5">
            <span>From</span>
            <input
              type="date"
              className="rounded border border-slate-700 bg-slate-800/50 px-2 py-1.5 text-slate-200 text-xs outline-none focus:border-cyan-500 w-[130px]"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="dd-mm-yyyy"
            />
          </label>
          <label className="flex items-center gap-1.5">
            <span>To</span>
            <input
              type="date"
              className="rounded border border-slate-700 bg-slate-800/50 px-2 py-1.5 text-slate-200 text-xs outline-none focus:border-cyan-500 w-[130px]"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              title="dd-mm-yyyy"
            />
          </label>
        </div>
        {(search || dateFrom || dateTo) && (
          <button
            type="button"
            className="text-xs text-slate-400 hover:text-slate-200"
            onClick={() => {
              setSearch("");
              setDateFrom("");
              setDateTo("");
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-surface overflow-hidden">
        {loading && selectedUuid !== null ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading…</div>
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
                  <th className="px-4 py-3 font-medium">Close time</th>
                  <th className="px-4 py-3 font-medium">Symbol</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Lots</th>
                  <th className="px-4 py-3 font-medium">Open</th>
                  <th className="px-4 py-3 font-medium">Close</th>
                  <th className="px-4 py-3 font-medium">Profit</th>
                  <th className="px-4 py-3 font-medium">Change %</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((t) => {
                  const type = normalizeType(t.type);
                  const pct = changePct(t.openPrice, t.closePrice);
                  return (
                    <tr
                      key={t.ticket}
                      className="border-b border-slate-800/80 hover:bg-slate-800/30"
                    >
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                        {formatTradeDate(t.closeTime)}
                      </td>
                      <td className="px-4 py-3 text-slate-200 font-medium">
                        {t.symbol}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            type === "Buy"
                              ? "text-emerald-400 font-medium"
                              : "text-red-400 font-medium"
                          }
                        >
                          {type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {t.lots > 0 ? t.lots.toFixed(2) : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {t.openPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {t.closePrice.toFixed(2)}
                      </td>
                      <td
                        className={`px-4 py-3 font-medium ${
                          t.profit >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {t.profit >= 0 ? "+" : ""}
                        {t.profit.toFixed(2)} {currency}
                      </td>
                      <td className="px-4 py-3">
                        {pct != null ? (
                          <span
                            className={
                              pct >= 0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }
                          >
                            {pct >= 0 ? "+" : ""}
                            {pct.toFixed(2)}%
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {filteredTrades.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-800 text-xs text-slate-500">
            Showing {filteredTrades.length}
            {filteredTrades.length !== trades.length
              ? ` of ${trades.length} trades`
              : " trades"}
          </div>
        )}
      </div>
    </div>
  );
}
