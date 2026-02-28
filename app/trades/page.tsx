"use client";

import { useEffect, useState, useMemo } from "react";

type Account = {
  id: string;
  broker_type: string;
  account_number: string;
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
        const accRes = await fetch("/api/accounts");
        if (!accRes.ok) {
          setError("Failed to load accounts");
          return;
        }
        const { accounts: list } = await accRes.json();
        setAccounts(list ?? []);
        const first = list?.[0];
        if (first?.metaapi_account_id) setSelectedUuid(first.metaapi_account_id);
        else setSelectedUuid("");
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
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500"
          value={selectedUuid ?? ""}
          onChange={(e) => setSelectedUuid(e.target.value || null)}
          disabled={loading}
        >
          <option value="">Select account</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.metaapi_account_id ?? ""}>
              {a.broker_type} • {a.account_number.slice(-4)}
            </option>
          ))}
        </select>
      </header>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search symbol, comment, ticket..."
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500 w-56"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="date"
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          title="From date"
        />
        <input
          type="date"
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          title="To date"
        />
        {(search || dateFrom || dateTo) && (
          <button
            type="button"
            className="text-sm text-slate-400 hover:text-slate-200"
            onClick={() => {
              setSearch("");
              setDateFrom("");
              setDateTo("");
            }}
          >
            Clear filters
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
                  <th className="px-4 py-3 font-medium">Volume</th>
                  <th className="px-4 py-3 font-medium">Open</th>
                  <th className="px-4 py-3 font-medium">Close</th>
                  <th className="px-4 py-3 font-medium">Profit</th>
                  <th className="px-4 py-3 font-medium">Comment</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((t) => (
                  <tr
                    key={t.ticket}
                    className="border-b border-slate-800/80 hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                      {new Date(t.closeTime).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-200 font-medium">
                      {t.symbol}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{t.type}</td>
                    <td className="px-4 py-3 text-slate-300">{t.lots}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {t.openPrice.toFixed(5)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {t.closePrice.toFixed(5)}
                    </td>
                    <td
                      className={`px-4 py-3 font-medium ${
                        t.profit >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {t.profit >= 0 ? "+" : ""}
                      {t.profit.toFixed(2)} {currency}
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[120px] truncate">
                      {t.comment ?? "—"}
                    </td>
                  </tr>
                ))}
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
