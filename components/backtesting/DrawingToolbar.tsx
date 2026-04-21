"use client";

import {
  MousePointer2,
  TrendingUp,
  TrendingDown,
  Minus,
  Square,
  Type,
  Eraser,
  Trash2,
} from "lucide-react";

export type DrawingTool =
  | "cursor"
  | "long"
  | "short"
  | "trendline"
  | "hline"
  | "rectangle"
  | "fib"
  | "text"
  | "eraser";

type Props = {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  onClearAll: () => void;
};

function FibIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <text x="0" y="11" fontSize="9" fill="currentColor" fontFamily="monospace" fontWeight="bold">
        Fib
      </text>
    </svg>
  );
}

type ToolDef = {
  id: DrawingTool;
  label: string;
  icon: React.ReactNode;
  activeColor?: string;
};

const TOOL_GROUPS: (ToolDef | "sep")[] = [
  { id: "cursor",    label: "Cursor",          icon: <MousePointer2 className="h-4 w-4" /> },
  "sep",
  { id: "long",      label: "Long Position",   icon: <TrendingUp className="h-4 w-4" />,   activeColor: "#26a69a" },
  { id: "short",     label: "Short Position",  icon: <TrendingDown className="h-4 w-4" />, activeColor: "#ef5350" },
  "sep",
  { id: "trendline", label: "Trend Line",      icon: <TrendingUp className="h-4 w-4" /> },
  { id: "hline",     label: "Horiz. Line",     icon: <Minus className="h-4 w-4" /> },
  { id: "rectangle", label: "Rectangle",       icon: <Square className="h-4 w-4" /> },
  { id: "fib",       label: "Fibonacci",       icon: <FibIcon /> },
  { id: "text",      label: "Text Label",      icon: <Type className="h-4 w-4" /> },
  "sep",
  { id: "eraser",    label: "Eraser",          icon: <Eraser className="h-4 w-4" /> },
];

export function DrawingToolbar({ activeTool, onToolChange, onClearAll }: Props) {
  return (
    <div
      className="flex h-full w-11 shrink-0 flex-col items-center border-r border-white/[0.07] py-2 gap-0.5"
      style={{ background: "rgba(0,0,0,0.55)" }}
    >
      {TOOL_GROUPS.map((item, i) => {
        if (item === "sep") {
          return <div key={`sep-${i}`} className="my-0.5 h-px w-6 bg-white/[0.06]" />;
        }
        const tool = item as ToolDef;
        const isActive = activeTool === tool.id;
        const color = tool.activeColor ?? "#6366f1";
        return (
          <button
            key={tool.id}
            type="button"
            title={tool.label}
            onClick={() => onToolChange(tool.id)}
            className={`flex h-9 w-9 items-center justify-center rounded transition-colors ${
              isActive ? "ring-1 ring-inset" : "text-slate-600 hover:bg-white/[0.08] hover:text-slate-300"
            }`}
            style={
              isActive
                ? { background: `${color}22`, color, boxShadow: `inset 0 0 0 1px ${color}44` }
                : undefined
            }
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
        className="flex h-9 w-9 items-center justify-center rounded text-slate-700 transition-colors hover:bg-white/[0.08] hover:text-red-400"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
