"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, Settings2, ListChecks, Shield } from "lucide-react";

type Tab = "strategies" | "checklist" | "rules";

const MOCK_STRATEGIES = [
  { id: "s1", name: "London breakout", description: "Trade highs/lows of the Asian range." },
  { id: "s2", name: "NY reversal", description: "Reversal at NY session open." },
  { id: "s3", name: "Liquidity sweep", description: "Sweep + FVG entry on H1." },
];

const MOCK_CHECKLIST = [
  "HTF structure aligned",
  "Liquidity identified",
  "POI confluence",
  "Risk ≤ 1% of account",
  "Journal entry filled",
];

const MOCK_RULES = [
  "No trades outside London / NY sessions",
  "Max 3 trades per day",
  "No revenge trading after 2 losses",
  "Stop trading after -2% daily loss",
];

export default function MockJournalingSettingsPage() {
  const [tab, setTab] = useState<Tab>("strategies");

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4">
      <Link
        href="/mock/journaling"
        className="inline-flex items-center gap-1 text-sm font-mono text-slate-500 hover:text-slate-300"
      >
        <ChevronLeft className="h-4 w-4" /> Back to journal
      </Link>

      <header>
        <h1 className="font-[family-name:var(--font-display)] flex items-center gap-2 text-2xl font-bold text-white">
          <Settings2 className="h-6 w-6 text-[#6366f1]" />
          Journal settings
        </h1>
        <p className="mt-1 font-mono text-sm text-slate-500">
          Demo mode — read-only. Strategies, checklist and rules are persisted in the live app.
        </p>
      </header>

      <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 w-fit">
        <TabButton active={tab === "strategies"} onClick={() => setTab("strategies")}>
          <Settings2 className="h-3.5 w-3.5" /> Strategies
        </TabButton>
        <TabButton active={tab === "checklist"} onClick={() => setTab("checklist")}>
          <ListChecks className="h-3.5 w-3.5" /> Checklist
        </TabButton>
        <TabButton active={tab === "rules"} onClick={() => setTab("rules")}>
          <Shield className="h-3.5 w-3.5" /> Rules
        </TabButton>
      </div>

      {tab === "strategies" && (
        <ul className="space-y-2.5">
          {MOCK_STRATEGIES.map((s) => (
            <li
              key={s.id}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3"
            >
              <p className="font-medium text-slate-100">{s.name}</p>
              <p className="mt-0.5 text-xs font-mono text-slate-500">{s.description}</p>
            </li>
          ))}
        </ul>
      )}

      {tab === "checklist" && (
        <ul className="space-y-2">
          {MOCK_CHECKLIST.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm text-slate-200"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#6366f1]" />
              {item}
            </li>
          ))}
        </ul>
      )}

      {tab === "rules" && (
        <ul className="space-y-2">
          {MOCK_RULES.map((rule) => (
            <li
              key={rule}
              className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm text-slate-200"
            >
              <Shield className="h-3.5 w-3.5 text-amber-400" />
              {rule}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono transition-colors ${
        active
          ? "bg-[#6366f1]/15 text-[#a5b4fc]"
          : "text-slate-500 hover:text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}
