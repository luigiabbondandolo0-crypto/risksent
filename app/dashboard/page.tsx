"use client";

import { useEffect, useState } from "react";

type Account = {
  id: string;
  broker_type: string;
  account_number: string;
  metaapi_account_id: string | null;
  created_at: string;
};

type Stats = {
  balance: number;
  equity: number;
  winRate: number | null;
  maxDd: number | null;
  equityCurve: { t: number; v: number }[];
  currency?: string;
  error?: string;
};

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    setStats(null);
    const u = selectedUuid || undefined;
    (async () => {
      try {
        const res = await fetch(`/api/dashboard-stats${u ? `?uuid=${encodeURIComponent(u)}` : ""}`);
        const data = await res.json();
        if (!res.ok) {
          setStats({ balance: 0, equity: 0, winRate: null, maxDd: null, equityCurve: [], error: data.error });
          return;
        }
        setStats(data);
      } catch {
        setStats({ balance: 0, equity: 0, winRate: null, maxDd: null, equityCurve: [], error: "Request failed" });
      }
    })();
  }, [selectedUuid]);

  const currency = stats?.currency ?? "EUR";
  const curve = stats?.equityCurve ?? [];
  const maxV = Math.max(...curve.map((c) => c.v), 1);
  const minV = Math.min(...curve.map((c) => c.v), 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Balance, equity, win rate and max drawdown. Data from MetatraderApi.dev when an account is linked.
          </p>
        </div>
        <select
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500"
          value={selectedUuid ?? ""}
          onChange={(e) => setSelectedUuid(e.target.value || null)}
          disabled={loading}
        >
          <option value="">Default account (env)</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.metaapi_account_id ?? ""}>
              {a.broker_type} • {a.account_number.slice(-4)}
            </option>
          ))}
        </select>
      </header>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-surface p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Balance</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {stats == null ? "—" : stats.error ? "—" : `${stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-surface p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Equity</div>
          <div className="mt-1 text-2xl font-semibold text-cyan-400">
            {stats == null ? "—" : stats.error ? "—" : `${stats.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-surface p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Win rate</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {stats == null ? "—" : stats.winRate != null ? `${stats.winRate}%` : "—"}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">From trades (mock until synced)</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-surface p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Max DD</div>
          <div className="mt-1 text-2xl font-semibold text-red-400">
            {stats == null ? "—" : stats.maxDd != null ? `${stats.maxDd}%` : "—"}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">From history (mock until synced)</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-surface p-5">
        <div className="text-xs text-slate-400 uppercase tracking-wide mb-4">Equity curve</div>
        {stats?.error && (
          <p className="text-sm text-amber-400">{stats.error}</p>
        )}
        {curve.length === 0 && !stats?.error && (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
            {stats == null ? "Loading…" : "No data. Link an account in Add Account."}
          </div>
        )}
        {curve.length > 0 && (
          <div className="h-48 w-full flex items-end gap-0.5">
            {curve.map((p, i) => (
              <div
                key={i}
                className="flex-1 min-w-[4px] rounded-t bg-gradient-to-t from-cyan-500/80 to-cyan-400/40 transition-opacity hover:opacity-90"
                style={{
                  height: `${maxV > minV ? ((p.v - minV) / (maxV - minV)) * 100 : 50}%`
                }}
                title={`${p.v.toFixed(2)} ${currency}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
