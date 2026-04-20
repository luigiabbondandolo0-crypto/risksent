"use client";

import { SkipBack, ChevronLeft, ChevronRight, SkipForward, Play, Pause } from "lucide-react";

export type ReplaySpeed = 1 | 2 | 5 | 10;

type Props = {
  currentIndex: number;
  total: number;
  playing: boolean;
  speed: ReplaySpeed;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  onEnd: () => void;
  onTogglePlay: () => void;
  onSpeedChange: (s: ReplaySpeed) => void;
};

const SPEEDS: ReplaySpeed[] = [1, 2, 5, 10];

export function ReplayControls({
  currentIndex, total, playing, speed,
  onPrev, onNext, onReset, onEnd, onTogglePlay, onSpeedChange,
}: Props) {
  const atStart = currentIndex <= 0;
  const atEnd = currentIndex >= total - 1;
  const progress = total > 1 ? (currentIndex / (total - 1)) * 100 : 0;

  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-t border-white/[0.06] bg-[#080809] px-4">

      {/* Transport */}
      <div className="flex items-center gap-0.5">
        <Btn title="Reset" onClick={onReset} disabled={atStart}>
          <SkipBack className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="−10 candles" onClick={() => { for (let i = 0; i < 10; i++) onPrev(); }} disabled={atStart}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Btn>

        <button
          type="button"
          onClick={onTogglePlay}
          disabled={!total || atEnd}
          className="mx-1 flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366f1]/20 text-[#818cf8] ring-1 ring-[#6366f1]/30 transition-all hover:bg-[#6366f1]/30 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>

        <Btn title="+1 candle [Space]" onClick={onNext} disabled={atEnd}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="+10 candles" onClick={() => { for (let i = 0; i < 10; i++) onNext(); }} disabled={atEnd}>
          <SkipForward className="h-3.5 w-3.5" />
        </Btn>
      </div>

      {/* Speed */}
      <div className="flex items-center gap-0.5 border-l border-white/[0.06] pl-2">
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSpeedChange(s)}
            className={`rounded px-2 py-0.5 font-mono text-[11px] transition-colors ${
              s === speed ? "bg-[#6366f1]/20 text-[#818cf8]" : "text-slate-700 hover:text-slate-400"
            }`}
          >
            {s}×
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="flex min-w-0 flex-1 items-center gap-2 border-l border-white/[0.06] pl-2">
        <div
          className="h-1 flex-1 min-w-0 cursor-pointer rounded-full"
          style={{ background: `linear-gradient(to right, #6366f1 ${progress}%, rgba(255,255,255,0.06) ${progress}%)` }}
        />
        <span className="shrink-0 font-mono text-[11px] text-slate-700 tabular-nums">
          {currentIndex + 1}<span className="text-slate-800">/{total}</span>
        </span>
      </div>
    </div>
  );
}

function Btn({ children, title, onClick, disabled }: {
  children: React.ReactNode; title?: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded text-slate-600 transition-colors hover:bg-white/[0.06] hover:text-slate-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-25"
    >
      {children}
    </button>
  );
}
