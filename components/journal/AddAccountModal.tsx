"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { jn } from "@/lib/journal/jnClasses";

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
          <div>
            <label className={jn.label}>Broker server</label>
            <input
              className={jn.input}
              value={brokerServer}
              onChange={(e) => setBrokerServer(e.target.value)}
              placeholder="ICMarkets-Demo"
            />
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
