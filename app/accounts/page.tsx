"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, Trash2, CreditCard } from "lucide-react";

type Account = {
  id: string;
  broker_type: string;
  account_number: string;
  metaapi_account_id: string | null;
  created_at: string;
};

export default function ManageAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/accounts");
      if (!res.ok) {
        setError("Failed to load accounts");
        return;
      }
      const { accounts: list } = await res.json();
      setAccounts(list ?? []);
    } catch {
      setError("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this MT account from RiskSent? It will be disconnected from MetatraderApi.dev.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Delete failed");
        return;
      }
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">Manage MT accounts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Each MT account is linked to your trader profile. Add, view, or remove accounts here.
          </p>
        </div>
        <Link
          href="/add-account"
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black hover:bg-cyan-400 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Add account
        </Link>
      </header>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-surface p-8 text-center">
          <CreditCard className="mx-auto h-10 w-10 text-slate-600" />
          <p className="mt-2 text-slate-400">No MT accounts yet</p>
          <p className="text-xs text-slate-500 mt-1">Add an MT4 or MT5 account to see balance and equity on the dashboard.</p>
          <Link
            href="/add-account"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-cyan-500/50 px-4 py-2 text-sm text-cyan-400 hover:bg-cyan-500/10"
          >
            <PlusCircle className="h-4 w-4" />
            Add account
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs text-slate-400 uppercase tracking-wide">
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Account (masked)</th>
                <th className="px-4 py-3">Provider ID</th>
                <th className="px-4 py-3">Added</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-b border-slate-800/60 last:border-0">
                  <td className="px-4 py-3 text-slate-200">{a.broker_type}</td>
                  <td className="px-4 py-3 text-slate-400">
                    ****{a.account_number.slice(-4)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 truncate max-w-[180px]">
                    {a.metaapi_account_id ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(a.id)}
                      disabled={deletingId === a.id}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
                      title="Remove account"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
