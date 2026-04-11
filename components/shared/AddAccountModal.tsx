"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, X } from "lucide-react";

const CURRENCIES = ["USD", "EUR", "GBP", "CHF", "JPY", "AUD"] as const;

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AddAccountModal({ open, onClose }: Props) {
  const [nickname, setNickname] = useState("");
  const [platform, setPlatform] = useState<"MT4" | "MT5">("MT5");
  const [brokerServer, setBrokerServer] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [initialBalance, setInitialBalance] = useState("10000");
  const [currency, setCurrency] = useState<string>("USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      onClose();
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const bal = Number(String(initialBalance).replace(",", "."));
    try {
      const res = await fetch("/api/journal/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nickname: nickname.trim(),
          broker_server: brokerServer.trim(),
          account_number: accountNumber.trim(),
          account_password: password,
          platform,
          currency: currency.toUpperCase(),
          initial_balance: Number.isFinite(bal) ? bal : 0
        })
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not create account.");
        setLoading(false);
        return;
      }
      onClose();
      window.location.reload();
    } catch {
      setError("Request failed. Try again.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={handleClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="rs-card relative z-[1] w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85)]"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold tracking-tight text-white">Connect account</h2>
                <p className="mt-1 text-xs text-slate-500 font-[family-name:var(--font-mono)]">
                  Journal &amp; dashboard use this record for your workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-200 disabled:opacity-40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="rs-kpi-label mb-1.5 block">Nickname</label>
                <input
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500/40 font-[family-name:var(--font-mono)]"
                  placeholder="IC Markets Demo"
                />
              </div>

              <div>
                <label className="rs-kpi-label mb-1.5 block">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as "MT4" | "MT5")}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500/40 font-[family-name:var(--font-mono)]"
                >
                  <option value="MT4">MT4</option>
                  <option value="MT5">MT5</option>
                </select>
              </div>

              <div>
                <label className="rs-kpi-label mb-1.5 block">Broker server</label>
                <input
                  required
                  value={brokerServer}
                  onChange={(e) => setBrokerServer(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500/40 font-[family-name:var(--font-mono)]"
                  placeholder="ICMarkets-Demo02"
                />
              </div>

              <div>
                <label className="rs-kpi-label mb-1.5 block">Account number</label>
                <input
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500/40 font-[family-name:var(--font-mono)]"
                  placeholder="12345678"
                />
              </div>

              <div>
                <label className="rs-kpi-label mb-1.5 block">Password</label>
                <div className="relative">
                  <input
                    required
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/30 py-2.5 pl-3 pr-11 text-sm text-slate-100 outline-none focus:border-cyan-500/40 font-[family-name:var(--font-mono)]"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-white/[0.06] hover:text-slate-300"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="rs-kpi-label mb-1.5 block">Initial balance</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min={0}
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500/40 font-[family-name:var(--font-mono)]"
                  />
                </div>
                <div>
                  <label className="rs-kpi-label mb-1.5 block">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500/40 font-[family-name:var(--font-mono)]"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 font-[family-name:var(--font-mono)]">
                  {error}
                </p>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.99 }}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-[#ff3c3c] to-[#c92a2a] py-3 text-sm font-semibold text-white shadow-lg shadow-[#ff3c3c]/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Saving…" : "Save account"}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
