import { Suspense } from "react";
import { BacktestingSessionNew } from "@/components/backtesting/BacktestingSessionNew";

export default function MockBacktestingSessionNewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[30vh] items-center justify-center text-sm text-slate-500 font-mono">
          Loading…
        </div>
      }
    >
      <BacktestingSessionNew basePath="/mock/backtesting" />
    </Suspense>
  );
}
