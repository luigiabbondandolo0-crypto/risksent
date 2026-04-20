"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Layers, Plus, Trash2, Pencil } from "lucide-react";
import type { Strategy, Session } from "@/lib/backtesting/types";
import { SessionCard } from "./SessionCard";

type Props = {
  strategy: Strategy;
  sessions: Session[];
  onNewSession: (strategyId: string) => void;
  onDeleteStrategy: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onEditStrategy: (strategy: Strategy) => void;
};

export function StrategyCard({ strategy, sessions, onNewSession, onDeleteStrategy, onDeleteSession, onEditStrategy }: Props) {
  const [expanded, setExpanded] = useState(true);

  const totalTrades = 0; // computed from sessions in parent if needed
  const sessionCount = sessions.length;

  return (
    <div className="rs-card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#6366f1]/15">
          <Layers className="h-4 w-4 text-[#818cf8]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold text-white truncate">{strategy.name}</p>
          {strategy.description && (
            <p className="mt-0.5 font-mono text-[11px] text-slate-500 truncate">{strategy.description}</p>
          )}
        </div>
        <div className="hidden md:flex items-center gap-4 mr-3">
          <div className="text-right">
            <p className="font-mono text-sm font-semibold text-slate-200">{sessionCount}</p>
            <p className="font-mono text-[10px] text-slate-600">sessions</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEditStrategy(strategy); }}
            className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-white/[0.06] hover:text-slate-300"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDeleteStrategy(strategy.id); }}
            className="rounded-lg p-1.5 text-slate-700 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <div className={`flex h-6 w-6 items-center justify-center rounded-md transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </div>
        </div>
      </button>

      {/* Sessions list */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="border-t border-white/[0.05] px-4 pb-3 pt-2">
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <p className="font-mono text-sm text-slate-600">No sessions yet</p>
                  <button
                    type="button"
                    onClick={() => onNewSession(strategy.id)}
                    className="font-mono text-[12px] text-[#6366f1] underline decoration-[#6366f1]/40 hover:decoration-[#6366f1]"
                  >
                    Create first session
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 pt-1">
                  {sessions.map((s) => (
                    <SessionCard key={s.id} session={s} onDelete={onDeleteSession} />
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => onNewSession(strategy.id)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.1] py-2.5 font-mono text-[11px] text-slate-600 transition-all hover:border-[#6366f1]/40 hover:text-[#818cf8]"
              >
                <Plus className="h-3.5 w-3.5" />
                New session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
