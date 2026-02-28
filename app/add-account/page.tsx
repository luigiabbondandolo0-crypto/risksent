"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type BrokerType = "MT4" | "MT5";

export default function AddAccountPage() {
  const [brokerType, setBrokerType] = useState<BrokerType>("MT5");
  const [server, setServer] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [successId, setSuccessId] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setProblems([]);
    setSuccessId(null);

    try {
      const res = await fetch("/api/add-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brokerType,
          server: server.trim(),
          accountNumber: accountNumber.trim(),
          investorPassword: password,
          name: name.trim() || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setResult(data.message ?? "Failed.");
        setProblems(data.problems ?? []);
      } else {
        setResult(data.message ?? "Account added.");
        setSuccessId(data.accountId ?? null);
      }
    } catch (err) {
      setResult("Request failed.");
      setProblems([err instanceof Error ? err.message : String(err)]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-6 mt-4">
      <div className="flex-1 space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-50">Add trading account</h1>
            <p className="text-xs text-slate-500 mt-1">
              Connect MT4 or MT5 via MetatraderApi.dev. We test the connection and save the account to your dashboard.
            </p>
          </div>
          <Link href="/dashboard" className="text-xs text-slate-400 hover:text-slate-200">
            Back to dashboard
          </Link>
        </header>

        <div className="rounded-xl border border-slate-800 bg-surface p-5">
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">Platform</label>
                <select
                  value={brokerType}
                  onChange={(e) => setBrokerType(e.target.value as BrokerType)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                >
                  <option value="MT4">MT4</option>
                  <option value="MT5">MT5</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">Broker server</label>
                <input
                  type="text"
                  required
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                  placeholder="e.g. ICMarketsSC-MT5-4"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">Login (account number)</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                  placeholder="e.g. 11582083"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                  placeholder="••••••••"
                />
                <p className="text-[11px] text-slate-500">Stored encrypted. Use investor (read-only) if possible.</p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">Account name (optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                  placeholder="e.g. My IC Markets"
                />
              </div>
            </div>

            <div className="space-y-3 border-l border-slate-800 pl-4 md:pl-6">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Testing & adding…" : "Test and add account"}
              </button>
              {result && (
                <div className="space-y-1">
                  <p className={`text-sm ${successId ? "text-emerald-400" : "text-amber-400"}`}>{result}</p>
                  {successId && (
                    <p className="text-xs text-slate-500">Account ID: <code className="text-slate-400">{successId}</code></p>
                  )}
                </div>
              )}
              {problems.length > 0 && (
                <ul className="list-disc list-inside text-xs text-slate-400">
                  {problems.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              )}
            </div>
          </form>
        </div>
      </div>

      <aside className="hidden lg:block w-64">
        <div className="rounded-xl border border-slate-800 bg-surface/80 p-4 text-[11px] text-slate-400">
          <div className="text-slate-300 font-medium mb-2">How it works</div>
          <p className="mb-2">
            We call MetatraderApi.dev <code className="text-slate-500">RegisterAccount</code>, then save the account and encrypted password to your RiskSent account.
          </p>
          <p>Set <code className="text-slate-500">ENCRYPTION_KEY</code> (32+ chars) and <code className="text-slate-500">METATRADERAPI_API_KEY</code> in Vercel.</p>
        </div>
      </aside>
    </div>
  );
}
