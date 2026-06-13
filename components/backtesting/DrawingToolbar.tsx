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
  Crosshair,
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
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <text x="1" y="12" fontSize="9" fill="currentColor" fontFamily="monospace" fontWeight="700">
        Fib
      </text>
    </svg>
  );
}

function TrendLineIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="2" y1="13" x2="14" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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
  { id: "cursor",    label: "Cursor (V)",         icon: <MousePointer2 className="h-4 w-4" /> },
  "sep",
  { id: "trendline", label: "Trend Line",          icon: <TrendLineIcon /> },
  { id: "hline",     label: "Horizontal Line",     icon: <Minus className="h-4 w-4" /> },
  { id: "rectangle", label: "Rectangle",           icon: <Square className="h-4 w-4" /> },
  { id: "fib",       label: "Fibonacci Retracement", icon: <FibIcon /> },
  { id: "text",      label: "Text Label",          icon: <Type className="h-4 w-4" /> },
  "sep",
  { id: "long",      label: "Long Position",       icon: <TrendingUp className="h-4 w-4" />,   activeColor: "#26a69a" },
  { id: "short",     label: "Short Position",      icon: <TrendingDown className="h-4 w-4" />, activeColor: "#ef5350" },
  "sep",
  { id: "eraser",    label: "Eraser",              icon: <Eraser className="h-4 w-4" /> },
];

export function DrawingToolbar({ activeTool, onToolChange, onClearAll }: Props) {
  return (
    <div
      className="flex h-full w-[46px] shrink-0 flex-col items-center border-r py-2 gap-0.5"
      style={{ background: "#FFFFFF", borderColor: "#E1E3EA" }}
    >
      {TOOL_GROUPS.map((item, i) => {
        if (item === "sep") {
          return (
            <div
              key={`sep-${i}`}
              className="my-1 h-px w-7"
              style={{ background: "#E1E3EA" }}
            />
          );
        }
        const tool = item as ToolDef;
        const isActive = activeTool === tool.id;
        const color = tool.activeColor ?? "#2962FF";
        return (
          <button
            key={tool.id}
            type="button"
            title={tool.label}
            onClick={() => onToolChange(tool.id)}
            className="flex h-9 w-9 items-center justify-center rounded transition-colors"
            style={
              isActive
                ? { background: `${color}18`, color, boxShadow: `inset 0 0 0 1px ${color}40` }
                : { color: "#6B7280" }
            }
            onMouseEnter={(e) => {
              if (!isActive) (e.currentTarget as HTMLElement).style.background = "#F1F3F8";
            }}
            onMouseLeave={(e) => {
              if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
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
        className="flex h-9 w-9 items-center justify-center rounded transition-colors"
        style={{ color: "#9CA3AF" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#EF4444"; (e.currentTarget as HTMLElement).style.background = "#FEF2F2"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
