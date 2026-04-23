"use client";

import Link from "next/link";
import { useState } from "react";

export default function AddAccountPage() {
  const [accountName, setAccountName] = useState("");
  const [platform, setPlatform] = useState<"MT5" | "MT4">("MT5");
  const [server, setServer] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/add-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_name: accountName.trim(),
          platform,
          server: server.trim(),
          account_number: accountNumber.trim(),
          password
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err =
          typeof data.error === "string"
            ? data.error
            : typeof data.message === "string"
              ? data.message
              : res.statusText;
        setMessage({ type: "err", text: err });
        return;
      }
      setMessage({
        type: "ok",
        text:
          typeof data.message === "string"
            ? data.message
            : "Account linked. Open the dashboard for live tracking."
      });
      setPassword("");
    } catch {
      setMessage({ type: "err", text: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 max-w-xl space-y-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">Add trading account</h1>
          <p className="mt-1 text-sm text-slate-400">
            Enter your MetaTrader credentials. We create the connection on{" "}
            <a
              href="https://metaapi.cloud"
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 hover:text-sky-300"
            >
              MetaApi.cloud
            </a>{" "}
            and start tracking. Use the exact server name from your broker (as in MetaTrader).
          </p>
        </div>
        <Link href="/app/dashboard" className="shrink-0 text-xs text-slate-400 hover:text-slate-200">
          Back to dashboard
        </Link>
      </header>

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-slate-800 bg-surface p-6 space-y-4 text-sm text-slate-300"
      >
        <div>
          <label htmlFor="acc-name" className="block text-slate-200 font-medium mb-1">
            Account name
          </label>
          <input
            id="acc-name"
            type="text"
            autoComplete="off"
            placeholder="My live account"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
            required
          />
        </div>

        <div>
          <label htmlFor="platform" className="block text-slate-200 font-medium mb-1">
            Platform
          </label>
          <select
            id="platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as "MT5" | "MT4")}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="MT5">MetaTrader 5</option>
            <option value="MT4">MetaTrader 4</option>
          </select>
        </div>

        <div>
          <label htmlFor="server" className="block text-slate-200 font-medium mb-1">
            Broker server
          </label>
          <input
            id="server"
            type="text"
            autoComplete="off"
            placeholder="e.g. ICMarketsSC-Demo"
            value={server}
            onChange={(e) => setServer(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
            required
          />
        </div>

        <div>
          <label htmlFor="login" className="block text-slate-200 font-medium mb-1">
            Account number
          </label>
          <input
            id="login"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Login / account number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
            required
          />
        </div>

        <div>
          <label htmlFor="pwd" className="block text-slate-200 font-medium mb-1">
            Password
          </label>
          <input
            id="pwd"
            type="password"
            autoComplete="new-password"
            placeholder="Trading password (or investor password for read-only)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Stored encrypted on our servers. MetaApi uses it to connect to your broker.
          </p>
        </div>

        {message ? (
          <p className={message.type === "ok" ? "text-emerald-400" : "text-red-400"}>{message.text}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-sky-600 px-4 py-2 text-white font-medium hover:bg-sky-500 disabled:opacity-50"
        >
          {loading ? "Connecting…" : "Add account"}
        </button>
      </form>

      <div className="rounded-xl border border-slate-800 bg-surface/50 p-4 text-xs text-slate-500 leading-relaxed space-y-2">
        <p className="text-slate-400 font-medium">Tips</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            Server name must match MetaTrader (copy from login dialog). Wrong server returns a MetaApi error with
            suggestions.
          </li>
          <li>
            Set <code className="text-slate-400">METAAPI_TOKEN</code>, provisioning URL, and client API URL for your
            region on{" "}
            <a href="https://app.metaapi.cloud/token" className="text-sky-500 hover:underline" target="_blank" rel="noreferrer">
              app.metaapi.cloud/token
            </a>
            .
          </li>
          <li>Accounts with OTP-only login may be rejected by MetaApi until OTP is disabled for API use.</li>
        </ul>
      </div>
    </div>
  );
}
