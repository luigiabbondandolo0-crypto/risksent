"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, FileText, Send, RefreshCw } from "lucide-react";
import {
  MOCK_AI_MESSAGES, MOCK_AI_REPORT, MOCK_AI_REPORT_SECTIONS,
} from "@/lib/demo/mockData";
import { DemoActionModal } from "./DemoActionModal";
import { useDemoAction } from "@/hooks/useDemoAction";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

type Tab = "chat" | "report";

const SCORE_COLOR = (score: number) =>
  score >= 80 ? "#00e676" : score >= 65 ? "#ff8c00" : "#ff3c3c";

export function DemoAiCoach() {
  const { interceptAction, modalOpen, actionLabel, closeModal } = useDemoAction();
  const [tab, setTab] = useState<Tab>("chat");

  return (
    <div className="space-y-5">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">AI Coach</h1>
        <p className="mt-1 font-mono text-sm text-slate-500">
          Personalised trading analysis · powered by your journal data
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease }}
        className="flex gap-1 rounded-xl border border-white/[0.07] bg-white/[0.02] p-1"
        style={{ display: "inline-flex" }}
      >
        {(["chat", "report"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-mono transition-all ${
              tab === t
                ? "bg-white/[0.08] text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t === "chat" ? <Bot className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
            {t === "chat" ? "Chat" : "Performance Report"}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {tab === "chat" ? (
          <ChatTab key="chat" interceptAction={interceptAction} />
        ) : (
          <ReportTab key="report" interceptAction={interceptAction} />
        )}
      </AnimatePresence>

      <DemoActionModal open={modalOpen} action={actionLabel} onClose={closeModal} />
    </div>
  );
}

function ChatTab({ interceptAction }: { interceptAction: (fn: () => void, label?: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease }}
      className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
    >
      {/* Messages */}
      <div className="divide-y divide-white/[0.04] max-h-[520px] overflow-y-auto">
        {MOCK_AI_MESSAGES.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 px-5 py-4 ${msg.role === "assistant" ? "bg-white/[0.015]" : ""}`}
          >
            <div
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                msg.role === "assistant"
                  ? "bg-[#ff3c3c]/15 border border-[#ff3c3c]/25"
                  : "bg-white/[0.05] border border-white/[0.08]"
              }`}
            >
              {msg.role === "assistant"
                ? <Bot  className="h-3.5 w-3.5 text-[#ff3c3c]"  />
                : <User className="h-3.5 w-3.5 text-slate-400"   />
              }
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[11px] font-bold text-slate-500 mb-1">
                {msg.role === "assistant" ? "AI Coach" : "You"} · {msg.time}
              </p>
              <p className="font-mono text-xs text-slate-300 leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Locked input */}
      <div className="border-t border-white/[0.05] p-4">
        <button
          onClick={() => interceptAction(() => {}, "send a message to AI Coach")}
          className="flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm font-mono text-slate-500 transition-all hover:border-white/[0.14] hover:text-slate-300"
        >
          <span className="flex-1 text-left">Ask AI Coach about your trading…</span>
          <Send className="h-4 w-4 shrink-0" />
        </button>
        <p className="mt-2 text-center font-mono text-[10px] text-slate-600">
          Start your trial to send messages with your real trading data
        </p>
      </div>
    </motion.div>
  );
}

function ReportTab({ interceptAction }: { interceptAction: (fn: () => void, label?: string) => void }) {
  const report = MOCK_AI_REPORT;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease }}
      className="space-y-4"
    >
      {/* Score card */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-1">{report.title}</p>
            <p className="font-mono text-xs text-slate-600">{report.date}</p>
            <p className="mt-3 font-mono text-xs text-slate-400 leading-relaxed max-w-lg">{report.summary}</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.02] px-6 py-4 text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Overall Score</p>
            <p
              className="font-[family-name:var(--font-display)] text-5xl font-black mt-1"
              style={{ color: SCORE_COLOR(report.overallScore) }}
            >
              {report.overallScore}
            </p>
            <p className="font-mono text-xs text-slate-500">/ 100</p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {MOCK_AI_REPORT_SECTIONS.map((section) => (
          <div
            key={section.title}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
          >
            <div
              className="px-5 py-4"
              style={{ borderLeft: `3px solid ${section.color}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-mono text-sm font-bold text-white">{section.title}</p>
                {section.score > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-white/[0.06]">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${section.score}%`, background: section.color }}
                      />
                    </div>
                    <span className="font-mono text-xs font-bold" style={{ color: section.color }}>
                      {section.score}/100
                    </span>
                  </div>
                )}
              </div>
              {section.body && (
                <p className="font-mono text-xs text-slate-400 leading-relaxed">{section.body}</p>
              )}
              {section.recommendations && (
                <ul className="space-y-2 mt-1">
                  {section.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 font-mono text-xs text-slate-300">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: section.color }}
                      />
                      {rec}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Generate new report */}
      <button
        onClick={() => interceptAction(() => {}, "generate a new performance report")}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.03] py-3.5 text-sm font-mono text-slate-400 transition-all hover:text-slate-200"
      >
        <RefreshCw className="h-4 w-4" />
        Generate new report
      </button>
    </motion.div>
  );
}
