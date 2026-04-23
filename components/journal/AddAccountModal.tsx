"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronDown, X } from "lucide-react";
import { jn } from "@/lib/journal/jnClasses";
import {
  POPULAR_BROKER_SERVERS,
  SUPPORT_BROKER_REQUEST_MAILTO
} from "@/lib/journal/popularBrokerServers";
import { toast } from "@/lib/toast";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export function AddAccountModal({ open, onClose, onCreated }: Props) {
  const [nickname, setNickname] = useState("");
  const [platform, setPlatform] = useState<"MT4" | "MT5">("MT5");
  const [brokerServer, setBrokerServer] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [brokerMenuOpen, setBrokerMenuOpen] = useState(false);
  const brokerWrapRef = useRef<HTMLDivElement>(null);

  const filteredBrokers = useMemo(() => {
    const q = brokerServer.trim().toLowerCase();
    if (!q) return POPULAR_BROKER_SERVERS;
    return POPULAR_BROKER_SERVERS.filter(
      (b) =>
        b.server.toLowerCase().includes(q) || b.broker.toLowerCase().includes(q)
    );
  }, [brokerServer]);

  useEffect(() => {
    if (!brokerMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBrokerMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [brokerMenuOpen]);

  useEffect(() => {
    if (!brokerMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      const el = brokerWrapRef.current;
      if (el && !el.contains(e.target as Node)) setBrokerMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [brokerMenuOpen]);

  if (!open || typeof document === "undefined") return null;

  const submit = async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/journal/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          broker_server: brokerServer,
          account_number: accountNumber,
          account_password: password,
          platform
        })
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error ?? "Failed");
        return;
      }
      if (j.metaapi_sync_pending) {
        toast.warning(
          "Account linked",
          "Balance and currency will update when MetaApi connects to your broker (often under a minute). If it persists, check METAAPI_BASE_URL matches your MetaApi region."
        );
      }
      onCreated();
      onClose();
      setNickname("");
      setBrokerServer("");
      setAccountNumber("");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const showBrokerHelp =
    brokerServer.trim().length > 0 && filteredBrokers.length === 0;

  return createPortal(
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-md ${jn.card} max-h-[90vh] overflow-y-auto`}
        style={{ background: "rgba(8,8,9,0.95)" }}
      >
        <button
          type="button"
          aria-label="Close"
          className="absolute right-3 top-3 rounded-lg p-1 text-slate-500 hover:bg-white/5 hover:text-slate-200"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className={`${jn.h1} text-xl`}>Add broker account</h2>
        <p className={jn.sub}>
          We connect via MetaApi and set balance and currency from your live account automatically.
        </p>

        {err && (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {err}
          </p>
        )}

        <div className="mt-4 space-y-3">
          <div>
            <label className={jn.label}>Nickname</label>
            <input
              className={jn.input}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="IC Markets Demo"
            />
          </div>
          <div>
            <label className={jn.label}>Platform</label>
            <select
              className={jn.input}
              value={platform}
              onChange={(e) => setPlatform(e.target.value as "MT4" | "MT5")}
            >
              <option value="MT5">MT5</option>
              <option value="MT4">MT4</option>
            </select>
          </div>
          <div ref={brokerWrapRef} className="relative">
            <label className={jn.label}>Broker server</label>
            <div className="relative">
              <input
                className={`${jn.input} pr-10`}
                value={brokerServer}
                onChange={(e) => {
                  setBrokerServer(e.target.value);
                  setBrokerMenuOpen(true);
                }}
                onFocus={() => setBrokerMenuOpen(true)}
                placeholder="Search or type your MT server (e.g. ICMarketsSC-Demo)"
                autoComplete="off"
                aria-expanded={brokerMenuOpen}
                aria-controls="broker-server-listbox"
                aria-autocomplete="list"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:bg-white/5 hover:text-slate-300"
                aria-label="Toggle broker list"
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setBrokerMenuOpen((o) => !o)}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${brokerMenuOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>
            {brokerMenuOpen && (
              <div
                id="broker-server-listbox"
                role="listbox"
                className="absolute left-0 right-0 top-full z-[600] mt-1 max-h-56 overflow-y-auto rounded-xl border border-white/[0.1] bg-[#0c0c0e] py-1 shadow-xl shadow-black/40"
              >
                {filteredBrokers.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-slate-500 font-mono">
                    No preset match — you can still type the exact server from your
                    MetaTrader terminal.
                  </div>
                ) : (
                  filteredBrokers.map((b) => (
                    <button
                      key={`${b.broker}-${b.server}`}
                      type="button"
                      role="option"
                      className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-white/[0.06]"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setBrokerServer(b.server);
                        setBrokerMenuOpen(false);
                      }}
                    >
                      <span className="font-medium text-slate-200">{b.broker}</span>
                      <span className="font-mono text-xs text-slate-500">{b.server}</span>
                    </button>
                  ))
                )}
                {showBrokerHelp && (
                  <div className="border-t border-white/[0.06] px-3 py-2.5">
                    <a
                      href={SUPPORT_BROKER_REQUEST_MAILTO}
                      className="text-xs font-mono text-indigo-400 hover:text-indigo-300"
                    >
                      Can&apos;t find your broker?
                    </a>
                    <span className="mx-1.5 text-slate-600">·</span>
                    <Link
                      href="/support"
                      className="text-xs font-mono text-slate-500 hover:text-slate-400"
                    >
                      Support
                    </Link>
                  </div>
                )}
              </div>
            )}
            {!brokerMenuOpen && showBrokerHelp && (
              <p className="mt-2 text-xs font-mono">
                <a
                  href={SUPPORT_BROKER_REQUEST_MAILTO}
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  Can&apos;t find your broker?
                </a>
                <span className="mx-1.5 text-slate-600">·</span>
                <Link href="/support" className="text-slate-500 hover:text-slate-400">
                  Support
                </Link>
              </p>
            )}
          </div>
          <div>
            <label className={jn.label}>Account number</label>
            <input
              className={jn.input}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </div>
          <div>
            <label className={jn.label}>Password</label>
            <input
              className={jn.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={jn.btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={jn.btnPrimary}
            disabled={loading}
            onClick={() => void submit()}
          >
            {loading ? "Saving…" : "Connect account"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
