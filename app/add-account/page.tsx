"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type BrokerType = "MT4" | "MT5" | "cTrader" | "Tradelocker";

export default function AddAccountPage() {
  const [brokerType, setBrokerType] = useState<BrokerType>("MT5");
  const [accountNumber, setAccountNumber] = useState("");
  const [investorPassword, setInvestorPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [problems, setProblems] = useState<string[]>([]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setProblems([]);

    try {
      const res = await fetch("/api/add-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          brokerType,
          accountNumber,
          investorPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("[AddAccount] Client-side connection error:", data);
        setResult(data.message ?? "Connection failed.");
        setProblems(data.problems ?? []);
      } else {
        console.log("[AddAccount] Client-side connection success:", data);
        setResult(data.message ?? "Connection ok.");
        setProblems(data.warnings ?? []);
      }
    } catch (error) {
      console.error("[AddAccount] Unexpected client error:", error);
      setResult("Unexpected error while calling the API.");
      setProblems([
        "Check browser console for more details.",
        "Verify that the backend route /api/add-account is reachable."
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-6 mt-4">
      {/* Main content */}
      <div className="flex-1 space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-50">
              Add trading account
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Connect an MT4/MT5/cTrader/Tradelocker account using investor
              (read-only) password. This is a mock MetaTrader connection check.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Back to dashboard
          </Link>
        </header>

        <div className="rounded-xl border border-slate-800 bg-surface p-5">
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">
                  Broker platform
                </label>
                <select
                  value={brokerType}
                  onChange={(e) =>
                    setBrokerType(e.target.value as BrokerType)
                  }
                  className="w-full rounded-md border border-slate-800 bg-black/40 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500"
                >
                  <option value="MT4">MT4</option>
                  <option value="MT5">MT5</option>
                  <option value="cTrader">cTrader</option>
                  <option value="Tradelocker">Tradelocker</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">
                  Account number
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full rounded-md border border-slate-800 bg-black/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                  placeholder="e.g. 12345678"
                />
              </div>
            </div>

            {/* Right column "sidebar" with investor password */}
            <div className="space-y-3 border-l border-slate-900 pl-4 md:pl-6">
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">
                  Investor password (read-only)
                </label>
                <input
                  type="password"
                  required
                  value={investorPassword}
                  onChange={(e) => setInvestorPassword(e.target.value)}
                  className="w-full rounded-md border border-slate-800 bg-black/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                  placeholder="••••••••"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  This password is never shared. In production it will be
                  encrypted at rest before being stored in `trading_account`.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 inline-flex items-center justify-center rounded-md bg-emerald-500 px-3 py-2 text-xs font-medium text-black hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Checking connection..." : "Test and add account"}
              </button>

              {result && (
                <p className="text-[11px] text-slate-300 mt-2">{result}</p>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Side debug panel */}
      <aside className="hidden lg:block w-64">
        <div className="rounded-xl border border-slate-800 bg-surface/80 p-4 text-[11px] text-slate-400">
          <div className="text-slate-300 font-medium mb-2">
            Connection debug (mock)
          </div>
          <p className="mb-2">
            Potential connection problems are logged both on the{" "}
            <span className="text-slate-200">browser console</span> and on the{" "}
            <span className="text-slate-200">server logs</span>.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Missing or wrong <code>METATRADER_API_KEY</code> env.</li>
            <li>Unsupported broker type / wrong account mapping.</li>
            <li>Invalid investor password (no investor-only access).</li>
            <li>Network / provider downtime from MetaApi.</li>
          </ul>
          {problems.length > 0 && (
            <div className="mt-3 border-t border-slate-800 pt-2">
              <div className="text-slate-300 mb-1">Last check details:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                {problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

