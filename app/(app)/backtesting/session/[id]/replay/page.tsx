"use client";

import { use } from "react";
import { BacktestingReplayView } from "@/components/backtesting/BacktestingReplayView";

export default function ReplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <BacktestingReplayView
      sessionId={id}
      backHref="/app/backtesting"
      resultsHref={`/app/backtesting/session/${id}/results`}
    />
  );
}
