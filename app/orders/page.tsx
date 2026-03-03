"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Account = {
  id: string;
  broker_type: string;
  account_number: string;
  account_name?: string | null;
  metaapi_account_id: string | null;
  created_at: string;
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

function accountLabel(a: Account): string {
  const login = a.account_number ?? "";
  const name = a.account_name?.trim();
  return name ? `${login} · ${name}` : login;
}

export default function OrdersPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedUuid, setSelectedUuid] = useState<string>("");
  const [symbol, setSymbol] = useState("");
  const [operation, setOperation] = useState<string>("Buy");
  const [volume, setVolume] = useState("0.01");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

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
      const body: { uuid?: string; symbol: string; operation: string; volume: number; price?: number } = {
        symbol: symbol.trim(),
        operation,
        volume: vol
      };
      if (selectedUuid) body.uuid = selectedUuid;
      if (needsPrice) body.price = parseFloat(price);

      const res = await fetch("/api/orders/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error ?? "Order failed.");
        setIsError(true);
      } else {
        setMessage("Order sent successfully.");
        setPrice("");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Request failed.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-6 mt-4">
      <div className="flex-1 space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-50">Open order</h1>
            <p className="text-xs text-slate-500 mt-1">
              Place market or pending orders via mtapi.io. Select account, symbol, type and volume.
            </p>
          </div>
          <Link href="/dashboard" className="text-xs text-slate-400 hover:text-slate-200">
            Back to dashboard
          </Link>
        </header>

        {accounts.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-5 text-slate-400 text-sm">
            No accounts linked. <Link href="/add-account" className="text-cyan-400 hover:text-cyan-300">Add an account</Link> first.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-5">
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 max-w-xl">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs text-slate-400">Account</label>
                  <select
                    value={selectedUuid}
                    onChange={(e) => setSelectedUuid(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.metaapi_account_id ?? ""}>
                        {accountLabel(a)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs text-slate-400">Symbol</label>
                  <input
                    type="text"
                    required
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="e.g. EURUSD"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs text-slate-400">Order type</label>
                  <select
                    value={operation}
                    onChange={(e) => setOperation(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
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
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
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
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                    />
                  </div>
                )}
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
          </div>
        )}
      </div>

      <aside className="hidden lg:block w-64">
        <div className="rounded-xl border border-slate-800 bg-slate-800/30 p-4 text-[11px] text-slate-400">
          <div className="text-slate-300 font-medium mb-2">Order types</div>
          <p className="mb-2"><strong>Market</strong> (Buy/Sell): executed at current price.</p>
          <p className="mb-2"><strong>Limit</strong>: buy/sell when price reaches your level.</p>
          <p><strong>Stop</strong>: buy/sell when price breaks the level. Use the demo account (mtapi.io docs) to test.</p>
        </div>
      </aside>
    </div>
  );
}
