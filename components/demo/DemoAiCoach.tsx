"use client";

import { motion } from "framer-motion";
import { Bot, User, FileText, Lock } from "lucide-react";
import { MOCK_AI_MESSAGES, MOCK_AI_REPORT } from "@/lib/demo/mockData";
import { DemoActionModal } from "./DemoActionModal";
import { useDemoAction } from "@/hooks/useDemoAction";

export function DemoAiCoach() {
  const { interceptAction, modalOpen, actionLabel, closeModal } = useDemoAction();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
          AI Coach
        </h1>
        <p className="mt-1 font-mono text-sm text-slate-500">
          Demo conversation — start your trial to chat with your real trading data
        </p>
      </motion.div>

      {/* Sample report */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
      >
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-amber-400" />
          <span className="font-mono text-sm text-slate-300">{MOCK_AI_REPORT.title}</span>
          <span className="ml-auto font-mono text-xs text-slate-500">{MOCK_AI_REPORT.date}</span>
        </div>
        <p className="font-mono text-xs text-slate-400 leading-relaxed mb-3">{MOCK_AI_REPORT.summary}</p>
        <ul className="space-y-1.5">
          {MOCK_AI_REPORT.insights.map((ins, i) => (
            <li key={i} className="flex items-start gap-2 font-mono text-xs text-slate-300">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              {ins}
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Chat */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-[#ff3c3c]" />
            <span className="font-mono text-sm text-slate-300">Sample Conversation</span>
          </div>
        </div>

        <div className="space-y-0 divide-y divide-white/[0.04]">
          {MOCK_AI_MESSAGES.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 px-5 py-4 ${msg.role === "assistant" ? "bg-white/[0.01]" : ""}`}
            >
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  msg.role === "assistant"
                    ? "bg-[#ff3c3c]/15 border border-[#ff3c3c]/25"
                    : "bg-white/[0.05] border border-white/[0.08]"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Bot className="h-3.5 w-3.5 text-[#ff3c3c]" />
                ) : (
                  <User className="h-3.5 w-3.5 text-slate-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-slate-400 leading-relaxed">{msg.content}</p>
                <p className="mt-1 font-mono text-[10px] text-slate-600">{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Locked input */}
        <div className="border-t border-white/[0.05] p-4">
          <button
            onClick={() => interceptAction(() => {}, "chat with AI Coach using your real trading data")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.1] py-3.5 font-mono text-sm text-slate-500 transition-colors hover:border-white/[0.2] hover:text-slate-300"
          >
            <Lock className="h-3.5 w-3.5" />
            Start your trial to chat with AI Coach
          </button>
        </div>
      </motion.div>

      <DemoActionModal open={modalOpen} action={actionLabel} onClose={closeModal} />
    </div>
  );
}
