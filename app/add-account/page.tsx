"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type BrokerType = "MT4" | "MT5";

export default function AddAccountPage() {
  const [brokerType, setBrokerType] = useState<BrokerType>("MT5");
  const [brokerHost, setBrokerHost] = useState("");
  const [brokerPort, setBrokerPort] = useState("");
  const [brokerServer, setBrokerServer] = useState("");
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
          brokerHost: brokerHost.trim(),
          brokerPort: brokerPort.trim(),
          brokerServer: brokerServer.trim() || undefined,
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
              Connect MT4 or MT5 via mtapi.io. Use the <strong>investor (read-only) password</strong>. For MT5 you can use either <strong>host + port</strong> or the <strong>server name</strong> (as in MT5 terminal: File → Open an account).
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
              {brokerType === "MT5" && (
                <div className="space-y-1">
                  <label className="block text-xs text-slate-400">Server name (MT5, optional)</label>
                  <input
                    type="text"
                    value={brokerServer}
                    onChange={(e) => setBrokerServer(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                    placeholder="e.g. MetaQuotes-Demo or YourBroker-Live"
                  />
                  <p className="text-[11px] text-slate-500">If host:port fails, try the exact server name from MT5 (File → Open an account).</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs text-slate-400">Broker host</label>
                  <input
                    type="text"
                    required={!brokerServer}
                    value={brokerHost}
                    onChange={(e) => setBrokerHost(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                    placeholder="e.g. 78.140.180.198"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs text-slate-400">Broker port</label>
                  <input
                    type="text"
                    required={!brokerServer}
                    value={brokerPort}
                    onChange={(e) => setBrokerPort(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                    placeholder="443 or 4430"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">Host and port, or use server name above for MT5. If 443 fails, try port 4430.</p>
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
                {loading ? "Connecting…" : "Connect and add account"}
              </button>
              {result && (
                <div className="space-y-1">
                  <p className={`text-sm ${successId ? "text-emerald-400" : "text-amber-400"}`}>{result}</p>
                  {successId && (
                    <p className="text-xs text-slate-500">Session saved.</p>
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
            We use <strong>mtapi.io</strong>: you enter broker host + port and login. We call <code className="text-slate-500">Connect</code> and store the session token. Dashboard, open positions and risk alerts use it.
          </p>
          <p>Set <code className="text-slate-500">ENCRYPTION_KEY</code> (32+ chars). Optional: <code className="text-slate-500">MTAPI_BASE_URL</code> (default mt5.mtapi.io).</p>
        </div>
      </aside>
    </div>
  );
}
