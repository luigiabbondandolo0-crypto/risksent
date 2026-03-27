"use client";

import { FormEvent, useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Account = {
  id: string;
  broker_type: string;
  account_number: string;
  account_name?: string | null;
  metaapi_account_id: string | null;
  created_at: string;
};

type PositionRow = {
  ticket: number;
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
  profit: number;
  stopLoss: number | null;
  takeProfit: number | null;
  openTime?: string;
};

type Overview = {
  summary: { balance: number; equity: number; currency: string } | null;
  positions: PositionRow[];
  error?: string;
};

const OPERATIONS = [
  { value: "Buy", label: "Market Buy" },
  { value: "Sell", label: "Market Sell" },
  { value: "BuyLimit", label: "Buy Limit" },
  { value: "SellLimit", label: "Sell Limit" },
  { value: "BuyStop", label: "Buy Stop" },
  { value: "SellStop", label: "Sell Stop" }
] as const;

const PENDING_OPS = ["BuyLimit", "SellLimit", "BuyStop", "SellStop"];
const POLL_INTERVAL_MS = 5000;

function accountLabel(a: Account): string {
  const login = a.account_number ?? "";
  const name = a.account_name?.trim();
  return name ? `${login} · ${name}` : login;
}

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value) + " " + currency;
}

export default function OrdersPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedUuid, setSelectedUuid] = useState<string>("");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [operation, setOperation] = useState<string>("Buy");
  const [volume, setVolume] = useState("0.01");
  const [price, setPrice] = useState("");
  const [stoploss, setStoploss] = useState("");
  const [takeprofit, setTakeprofit] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const fetchOverview = useCallback(async (uuid: string) => {
    setOverviewLoading(true);
    try {
      const res = await fetch(`/api/orders/overview?uuid=${encodeURIComponent(uuid)}`);
      const data = await res.json().catch(() => ({}));
      setOverview({
        summary: data.summary ?? null,
        positions: Array.isArray(data.positions) ? data.positions : [],
        error: data.error
      });
    } catch {
      setOverview((prev) => ({ ...prev, summary: null, positions: [], error: "Request failed" }));
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/accounts");
      const data = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (res.ok && Array.isArray(data.accounts)) {
        setAccounts(data.accounts);
        const first = data.accounts[0] as Account | undefined;
        if (first?.metaapi_account_id && !selectedUuid) {
          setSelectedUuid(first.metaapi_account_id);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedUuid) {
      setOverview(null);
      return;
    }
    fetchOverview(selectedUuid);
    const t = setInterval(() => fetchOverview(selectedUuid), POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [selectedUuid, fetchOverview]);

  const needsPrice = PENDING_OPS.includes(operation);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    setIsError(false);

    const vol = parseFloat(volume);
    if (!Number.isFinite(vol) || vol <= 0) {
      setMessage("Volume must be a positive number.");
      setIsError(true);
      setLoading(false);
      return;
    }
    if (needsPrice) {
      const p = parseFloat(price);
      if (!Number.isFinite(p) || p <= 0) {
        setMessage("Price is required for limit/stop orders.");
        setIsError(true);
        setLoading(false);
        return;
      }
    }

    try {
      const body: { uuid?: string; symbol: string; operation: string; volume: number; price?: number; stoploss?: number; takeprofit?: number } = {
        symbol: symbol.trim(),
        operation,
        volume: vol
      };
      if (selectedUuid) body.uuid = selectedUuid;
      if (needsPrice) body.price = parseFloat(price);
      const sl = parseFloat(stoploss);
      const tp = parseFloat(takeprofit);
      if (Number.isFinite(sl) && sl > 0) body.stoploss = sl;
      if (Number.isFinite(tp) && tp > 0) body.takeprofit = tp;

      const res = await fetch("/api/orders/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        const err = data.error ?? "Order failed.";
        const isMarginError = /not enough money|insufficient|margin|saldo/i.test(err);
        setMessage(isMarginError ? `${err} Prova a ridurre il volume (es. 0.01 lotti) o controlla il saldo del conto.` : err);
        setIsError(true);
      } else {
        setMessage("Order sent successfully.");
        setPrice("");
        if (selectedUuid) fetchOverview(selectedUuid);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Request failed.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <header>
          <h1 className="rs-page-title">Orders</h1>
          <p className="rs-page-sub">Trading terminal: open positions and new orders.</p>
        </header>
        <div className="rs-card p-6 text-sm text-slate-400 shadow-rs-soft">
          No accounts linked.{" "}
          <Link href="/add-account" className="font-medium text-cyan-400 hover:text-cyan-300">
            Add an account
          </Link>{" "}
          first.
        </div>
      </div>
    );
  }

  const summary = overview?.summary;
  const positions = overview?.positions ?? [];
  const currency = summary?.currency ?? "";

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="rs-page-title">Orders</h1>
          <p className="rs-page-sub">
            Positions and orders in real time. Data refreshes every {POLL_INTERVAL_MS / 1000}s.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-400 transition-colors hover:text-cyan-300"
        >
          ← Dashboard
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-[220px] max-w-md">
          <label htmlFor="orders-account" className="rs-section-title mb-2 block">
            Account
          </label>
          <select
            id="orders-account"
            value={selectedUuid}
            onChange={(e) => setSelectedUuid(e.target.value)}
            className="rs-input"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.metaapi_account_id ?? ""}>
                {accountLabel(a)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedUuid && (
        <>
          <section className="rs-card overflow-hidden shadow-rs-soft">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-200">Account summary</h2>
              {overviewLoading && (
                <span className="text-[11px] text-slate-500 animate-pulse">Updating…</span>
              )}
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Balance</p>
                <p className="text-lg font-semibold text-slate-100">
                  {summary != null ? formatMoney(summary.balance, currency) : overviewLoading ? "—" : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Equity</p>
                <p className="text-lg font-semibold text-slate-100">
                  {summary != null ? formatMoney(summary.equity, currency) : overviewLoading ? "—" : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Currency</p>
                <p className="text-lg font-medium text-slate-300">{currency || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Open positions</p>
                <p className="text-lg font-medium text-slate-300">{positions.length}</p>
              </div>
            </div>
            {overview?.error && (
              <div className="px-4 pb-3">
                <p className="text-xs text-amber-400">{overview.error}</p>
              </div>
            )}
          </section>

          <section className="rs-card overflow-hidden shadow-rs-soft">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-200">Open positions</h2>
              {overviewLoading && (
                <span className="text-[11px] text-slate-500 animate-pulse">Updating…</span>
              )}
            </div>
            <div className="overflow-x-auto">
              {positions.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  {overviewLoading ? "Loading…" : "No open positions."}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-left text-[11px] uppercase tracking-wider">
                      <th className="px-4 py-2.5 font-medium">Ticket</th>
                      <th className="px-4 py-2.5 font-medium">Symbol</th>
                      <th className="px-4 py-2.5 font-medium">Type</th>
                      <th className="px-4 py-2.5 font-medium text-right">Volume</th>
                      <th className="px-4 py-2.5 font-medium text-right">Open price</th>
                      <th className="px-4 py-2.5 font-medium text-right">Profit</th>
                      <th className="px-4 py-2.5 font-medium text-right">SL</th>
                      <th className="px-4 py-2.5 font-medium text-right">TP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((p) => (
                      <tr
                        key={p.ticket || `${p.symbol}-${p.openPrice}-${p.type}`}
                        className="border-b border-slate-800/80 hover:bg-slate-800/30"
                      >
                        <td className="px-4 py-2 text-slate-400">{p.ticket || "—"}</td>
                        <td className="px-4 py-2 font-medium text-slate-200">{p.symbol}</td>
                        <td className="px-4 py-2">
                          <span className={p.type.toLowerCase() === "sell" ? "text-rose-400" : "text-emerald-400"}>
                            {p.type}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-slate-300">{p.volume}</td>
                        <td className="px-4 py-2 text-right text-slate-300">
                          {p.openPrice > 0 ? p.openPrice.toFixed(5) : "—"}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className={p.profit >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            {formatMoney(p.profit, currency)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-slate-500">
                          {p.stopLoss != null ? p.stopLoss.toFixed(5) : "—"}
                        </td>
                        <td className="px-4 py-2 text-right text-slate-500">
                          {p.takeProfit != null ? p.takeProfit.toFixed(5) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </>
      )}

      <section className="rs-card p-5 sm:p-6 shadow-rs-soft">
        <h2 className="mb-4 text-base font-semibold text-slate-100">New order</h2>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 max-w-2xl">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs text-slate-400">Symbol</label>
              <input
                type="text"
                required
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g. EURUSD"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs text-slate-400">Order type</label>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
              >
                {OPERATIONS.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs text-slate-400">Volume (lots)</label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>
            {needsPrice && (
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">Price (trigger / limit)</label>
                <input
                  type="number"
                  required={needsPrice}
                  min="0"
                  step="0.00001"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 1.0850"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">Stop Loss (optional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.00001"
                  value={stoploss}
                  onChange={(e) => setStoploss(e.target.value)}
                  placeholder="price"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">Take Profit (optional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.00001"
                  value={takeprofit}
                  onChange={(e) => setTakeprofit(e.target.value)}
                  placeholder="price"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500">SL/TP: price levels (e.g. 1.0800). Used by broker to close the position.</p>
          </div>
          <div className="space-y-3 flex flex-col justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Sending…" : "Send order"}
            </button>
            {message && (
              <p className={`text-sm ${isError ? "text-amber-400" : "text-emerald-400"}`}>
                {message}
              </p>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
