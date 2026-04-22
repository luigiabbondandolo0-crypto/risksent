"use client";

import { use } from "react";
import { BacktestingReplayView } from "@/components/backtesting/BacktestingReplayView";

export default function MockReplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <BacktestingReplayView
      sessionId={id}
      mode="mock"
      backHref="/mock/backtesting"
      resultsHref={`/mock/backtesting/session/${id}/results`}
    />
  );
}
