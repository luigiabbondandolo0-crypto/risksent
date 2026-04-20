"use client";

import {
  MousePointer2,
  TrendingUp,
  Minus,
  Square,
  Type,
  Magnet,
  Eraser,
  Trash2,
} from "lucide-react";

export type DrawingTool =
  | "cursor"
  | "trendline"
  | "hline"
  | "rectangle"
  | "fib"
  | "text"
  | "magnet"
  | "eraser";

type Props = {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  onClearAll: () => void;
};

function FibIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <text
        x="0"
        y="11"
        fontSize="9"
        fill="currentColor"
        fontFamily="monospace"
        fontWeight="bold"
      >
        Fib
      </text>
    </svg>
  );
}

type ToolDef = { id: DrawingTool; label: string; icon: React.ReactNode };

const TOOLS: ToolDef[] = [
  { id: "cursor",    label: "Cursor",         icon: <MousePointer2 className="h-4 w-4" /> },
  { id: "trendline", label: "Trend Line",      icon: <TrendingUp className="h-4 w-4" /> },
  { id: "hline",     label: "Horizontal Line", icon: <Minus className="h-4 w-4" /> },
  { id: "rectangle", label: "Rectangle",       icon: <Square className="h-4 w-4" /> },
  { id: "fib",       label: "Fibonacci",       icon: <FibIcon /> },
  { id: "text",      label: "Text Label",      icon: <Type className="h-4 w-4" /> },
  { id: "magnet",    label: "Snap to Price",   icon: <Magnet className="h-4 w-4" /> },
  { id: "eraser",    label: "Eraser",          icon: <Eraser className="h-4 w-4" /> },
];

export function DrawingToolbar({ activeTool, onToolChange, onClearAll }: Props) {
  return (
    <div
      className="flex h-full w-11 shrink-0 flex-col items-center border-r border-white/[0.07] py-2 gap-0.5"
      style={{ background: "rgba(0,0,0,0.55)" }}
    >
      {TOOLS.map((tool) => {
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            type="button"
            title={tool.label}
            onClick={() => onToolChange(tool.id)}
            className={`flex h-11 w-11 items-center justify-center rounded transition-colors ${
              isActive
                ? "bg-[#ff3c3c]/20 text-[#ff3c3c] ring-1 ring-inset ring-[#ff3c3c]/30"
                : "text-slate-600 hover:bg-white/[0.08] hover:text-slate-300"
            }`}
          >
            {tool.icon}
          </button>
        );
      })}

      <div className="flex-1" />

      <button
        type="button"
        title="Clear All Drawings"
        onClick={onClearAll}
        className="flex h-11 w-11 items-center justify-center rounded text-slate-700 transition-colors hover:bg-white/[0.08] hover:text-red-400"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
