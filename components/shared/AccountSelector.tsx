"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Plus } from "lucide-react";
import type { JournalAccountPublic } from "@/lib/journal/journalTypes";

export type JournalAccount = JournalAccountPublic;

const STORAGE_KEY = "risksent_selected_account";

type Props = {
  accounts: JournalAccount[];
  selectedId: string | null;
  onChange: (id: string) => void;
  onAddAccount?: () => void;
};

function statusDotClass(status: string) {
  return status === "active" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-slate-500";
}

export function AccountSelector({ accounts, selectedId, onChange, onAddAccount }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selected =
    selectedId === "all" || selectedId == null
      ? null
      : accounts.find((a) => a.id === selectedId) ?? null;

  const label =
    selectedId === "all" || selectedId == null || !selected
      ? "All accounts"
      : selected.nickname || `Account ${selected.account_number.slice(-4)}`;

  return (
    <div ref={rootRef} className="relative z-30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full min-w-[200px] max-w-sm items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-black/35 px-4 py-2.5 text-left transition-colors hover:border-white/[0.12] hover:bg-black/45 sm:w-auto"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${selected ? statusDotClass(selected.status) : "bg-cyan-400/80"}`}
          />
          <span className="truncate font-[family-name:var(--font-mono)] text-sm font-medium text-slate-100">
            {label}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="absolute right-0 top-[calc(100%+6px)] w-[min(100vw-2rem,320px)] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c0e]/95 py-1 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl"
          >
            <button
              type="button"
              onClick={() => {
                onChange("all");
                try {
                  localStorage.setItem(STORAGE_KEY, "all");
                } catch {
                  /* ignore */
                }
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-[family-name:var(--font-mono)] transition-colors hover:bg-white/[0.05] ${
                selectedId === "all" || selectedId == null ? "text-cyan-300" : "text-slate-300"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-cyan-400/80" />
              All accounts
            </button>
            <div className="mx-2 my-1 h-px bg-white/[0.06]" />
            {accounts.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  onChange(a.id);
                  try {
                    localStorage.setItem(STORAGE_KEY, a.id);
                  } catch {
                    /* ignore */
                  }
                  setOpen(false);
                }}
                className={`flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.05] ${
                  selectedId === a.id ? "bg-white/[0.04]" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(a.status)}`} />
                  <span className="truncate font-medium text-slate-100">{a.nickname}</span>
                  <span className="rounded border border-white/[0.08] px-1.5 py-0.5 text-[10px] font-mono uppercase text-slate-400">
                    {a.platform}
                  </span>
                </div>
                <span className="pl-4 text-[11px] text-slate-500 font-[family-name:var(--font-mono)]">
                  {a.broker_server}
                </span>
              </button>
            ))}
            {onAddAccount && (
              <>
                <div className="mx-2 my-1 h-px bg-white/[0.06]" />
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onAddAccount();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-[family-name:var(--font-mono)] text-cyan-300 transition-colors hover:bg-white/[0.05]"
                >
                  <Plus className="h-4 w-4" />
                  Add account
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function readStoredAccountSelection(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export { STORAGE_KEY as RISKSENT_ACCOUNT_STORAGE_KEY };
