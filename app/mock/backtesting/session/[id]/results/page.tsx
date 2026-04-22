"use client";

import { use, useEffect, useState } from "react";
import { BacktestingSessionResultsView } from "@/components/backtesting/BacktestingSessionResultsView";
import { getMockResultsBundle } from "@/lib/demo/mockBacktestingData";
import type { Session, Trade, SessionStats } from "@/lib/backtesting/types";

export default function MockResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const b = getMockResultsBundle(id);
    if (b) {
      setSession(b.session);
      setTrades(b.trades);
      setStats(b.stats);
    } else {
      setSession(null);
      setTrades([]);
      setStats(null);
    }
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="relative flex h-[60vh] items-center justify-center">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute -top-32 left-1/4 h-80 w-80 rounded-full opacity-[0.06] blur-3xl"
            style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
          />
        </div>
        <span className="relative z-10 h-1.5 w-1.5 animate-pulse rounded-full bg-[#6366f1]" />
      </div>
    );
  }

  if (!session || !stats) {
    return (
      <div className="relative flex h-[60vh] items-center justify-center font-mono text-sm text-slate-600">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute -top-32 left-1/4 h-80 w-80 rounded-full opacity-[0.06] blur-3xl"
            style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
          />
        </div>
        <span className="relative z-10">Session not found</span>
      </div>
    );
  }

  return (
    <BacktestingSessionResultsView
      session={session}
      trades={trades}
      stats={stats}
      sessionId={id}
      backToLabHref="/mock/backtesting"
      replayHref={`/mock/backtesting/session/${id}/replay`}
    />
  );
}
