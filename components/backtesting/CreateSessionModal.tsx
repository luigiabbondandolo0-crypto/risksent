"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, ChevronDown } from "lucide-react";
import { SYMBOL_GROUPS } from "@/lib/backtesting/symbolMap";
import type { Strategy } from "@/lib/backtesting/types";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
  strategies: Strategy[];
  defaultStrategyId?: string;
};

export function CreateSessionModal({ open, onClose, strategies, defaultStrategyId }: Props) {
  const router = useRouter();
  const [strategyId, setStrategyId] = useState(defaultStrategyId ?? "");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("EURUSD");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [balance, setBalance] = useState("10000");
  const [symbolSearch, setSymbolSearch] = useState("");
  const [showSymbols, setShowSymbols] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (defaultStrategyId) setStrategyId(defaultStrategyId);
  }, [defaultStrategyId]);

  useEffect(() => {
    if (!open) { setErr(""); setLoading(false); }
  }, [open]);

  const filteredGroups = symbolSearch.trim()
    ? SYMBOL_GROUPS.map((g) => ({
        ...g,
        symbols: g.symbols.filter((s) => s.toLowerCase().includes(symbolSearch.toLowerCase())),
      })).filter((g) => g.symbols.length > 0)
    : SYMBOL_GROUPS;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!strategyId) { setErr("Select a strategy"); return; }
    if (!name.trim()) { setErr("Session name is required"); return; }
    if (!dateFrom || !dateTo) { setErr("Date range is required"); return; }
    if (dateFrom >= dateTo) { setErr("Start date must be before end date"); return; }

    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/backtesting/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy_id: strategyId,
          name: name.trim(),
          symbol,
          timeframe: "H1",
          date_from: dateFrom,
          date_to: dateTo,
          initial_balance: Number(balance) || 10000,
        }),
      });
      const json = await res.json() as { session?: { id: string }; error?: string };
      if (!res.ok) { setErr(json.error ?? "Failed to create session"); return; }
      onClose();
      router.push(`/app/backtesting/session/${json.session!.id}/replay`);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0d0d18] p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00e676]/15">
                  <TrendingUp className="h-4 w-4 text-[#00e676]" />
                </div>
                <h2 className="font-display text-lg font-bold text-white">New Session</h2>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-300">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={(e) => void submit(e)} className="space-y-4">
              {/* Strategy */}
              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate-500">Strategy *</label>
                <select
                  value={strategyId}
                  onChange={(e) => setStrategyId(e.target.value)}
                  className="rs-input w-full max-w-none bg-[#0d0d18] font-mono"
                >
                  <option value="">Select strategy…</option>
                  {strategies.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate-500">Session Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. June 2024 Range Test"
                  maxLength={100}
                  className="rs-input w-full max-w-none"
                />
              </div>

              {/* Symbol picker */}
              <div className="relative">
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate-500">Symbol *</label>
                <button
                  type="button"
                  onClick={() => setShowSymbols((v) => !v)}
                  className="rs-input flex w-full max-w-none items-center justify-between"
                >
                  <span className="font-mono font-semibold text-white">{symbol}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${showSymbols ? "rotate-180" : ""}`} />
                </button>
                {showSymbols && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0d0d18] shadow-2xl">
                    <div className="sticky top-0 border-b border-white/[0.05] bg-[#0d0d18] p-2">
                      <input
                        type="text"
                        value={symbolSearch}
                        onChange={(e) => setSymbolSearch(e.target.value)}
                        placeholder="Search symbols…"
                        className="w-full rounded-lg bg-white/[0.04] px-3 py-1.5 font-mono text-sm text-slate-200 outline-none placeholder:text-slate-600"
                        autoFocus
                      />
                    </div>
                    {filteredGroups.map((g) => (
                      <div key={g.label}>
                        <p className="px-3 pt-2 pb-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-600">{g.label}</p>
                        {g.symbols.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => { setSymbol(s); setShowSymbols(false); setSymbolSearch(""); }}
                            className={`flex w-full items-center px-3 py-1.5 font-mono text-sm transition-colors ${
                              s === symbol ? "bg-[#6366f1]/20 text-[#818cf8]" : "text-slate-300 hover:bg-white/[0.05]"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate-500">From *</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rs-input w-full max-w-none font-mono" />
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate-500">To *</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rs-input w-full max-w-none font-mono" />
                </div>
              </div>

              {/* Initial balance */}
              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate-500">Initial Balance ($)</label>
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  min={100}
                  max={10000000}
                  step={100}
                  className="rs-input w-full max-w-none font-mono"
                />
              </div>

              {err && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 font-mono text-[12px] text-red-400">{err}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/[0.08] py-2.5 font-mono text-sm text-slate-400 transition-colors hover:border-white/[0.15] hover:text-slate-200">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-[#00e676]/90 py-2.5 font-mono text-sm font-semibold text-black transition-all hover:bg-[#00e676] disabled:opacity-50"
                >
                  {loading ? "Creating…" : "Start Session →"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
