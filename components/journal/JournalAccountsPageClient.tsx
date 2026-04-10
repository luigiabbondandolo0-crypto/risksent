"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { JournalAccountPublic } from "@/lib/journal/journalTypes";
import { jn } from "@/lib/journal/jnClasses";
import { AddAccountModal } from "./AddAccountModal";

function maskNumber(n: string) {
  if (n.length <= 4) return "••••";
  return `••••${n.slice(-4)}`;
}

export function JournalAccountsPageClient() {
  const [accounts, setAccounts] = useState<JournalAccountPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [editing, setEditing] = useState<JournalAccountPublic | null>(null);
  const [editNickname, setEditNickname] = useState("");
  const [editBalance, setEditBalance] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "disconnected">("active");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/journal/accounts");
      const j = await res.json();
      if (res.ok) setAccounts(j.accounts ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onSync = async (id: string) => {
    setSyncing(id);
    try {
      await fetch(`/api/journal/accounts/${id}/sync`, { method: "POST" });
      await load();
    } finally {
      setSyncing(null);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this account and all its trades?")) return;
    await fetch(`/api/journal/accounts/${id}`, { method: "DELETE" });
    await load();
  };

  const openEdit = (a: JournalAccountPublic) => {
    setEditing(a);
    setEditNickname(a.nickname);
    setEditBalance(String(a.current_balance));
    setEditStatus(a.status as "active" | "disconnected");
  };

  const saveEdit = async () => {
    if (!editing) return;
    await fetch(`/api/journal/accounts/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: editNickname,
        current_balance: Number(editBalance),
        status: editStatus
      })
    });
    setEditing(null);
    await load();
  };

  return (
    <div className={`${jn.page} space-y-6`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className={jn.h1}>Accounts</h1>
          <p className={jn.sub}>Broker connections, balances, and sync status.</p>
        </div>
        <button type="button" className={jn.btnPrimary} onClick={() => setModal(true)}>
          <Plus className="h-4 w-4" />
          Add account
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500 font-[family-name:var(--font-mono)] text-sm">Loading…</p>
      ) : accounts.length === 0 ? (
        <div className={jn.card}>
          <p className="text-slate-400">No accounts yet. Connect a broker to import trades.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {accounts.map((a) => (
            <li key={a.id} className={jn.card}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-lg font-bold text-white">
                    {a.nickname}
                  </p>
                  <p className={`mt-1 text-sm text-slate-500 ${jn.mono}`}>
                    {a.platform} · {a.broker_server} · {maskNumber(a.account_number)}
                  </p>
                  <p className={`mt-2 text-sm ${jn.mono} text-slate-300`}>
                    Balance{" "}
                    <span className="text-white">
                      {Number(a.current_balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                      {a.currency}
                    </span>
                  </p>
                  <p className={`mt-1 text-xs text-slate-600 ${jn.mono}`}>
                    Last sync:{" "}
                    {a.last_synced_at
                      ? new Date(a.last_synced_at).toLocaleString()
                      : "Never"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-mono uppercase ${
                      a.status === "active"
                        ? "bg-[#00e676]/15 text-[#00e676]"
                        : "bg-slate-600/30 text-slate-400"
                    }`}
                  >
                    {a.status}
                  </span>
                  <button
                    type="button"
                    className={jn.btnGhost}
                    disabled={syncing === a.id}
                    onClick={() => void onSync(a.id)}
                  >
                    <RefreshCw className={`h-4 w-4 ${syncing === a.id ? "animate-spin" : ""}`} />
                    Sync
                  </button>
                  <button type="button" className={jn.btnGhost} onClick={() => openEdit(a)}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/20"
                    onClick={() => void onDelete(a.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddAccountModal open={modal} onClose={() => setModal(false)} onCreated={() => void load()} />

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md ${jn.card}`} style={{ background: "rgba(8,8,9,0.95)" }}>
            <h2 className={`${jn.h1} text-xl`}>Edit account</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className={jn.label}>Nickname</label>
                <input className={jn.input} value={editNickname} onChange={(e) => setEditNickname(e.target.value)} />
              </div>
              <div>
                <label className={jn.label}>Current balance</label>
                <input className={jn.input} value={editBalance} onChange={(e) => setEditBalance(e.target.value)} />
              </div>
              <div>
                <label className={jn.label}>Status</label>
                <select
                  className={jn.input}
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as typeof editStatus)}
                >
                  <option value="active">active</option>
                  <option value="disconnected">disconnected</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className={jn.btnGhost} onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="button" className={jn.btnPrimary} onClick={() => void saveEdit()}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
