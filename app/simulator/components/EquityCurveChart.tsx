"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

/** Single point on equity curve (after each trade or by day) */
export type EquityPoint = {
  index: number;
  date: string;
  balance: number;
  pct: number;
};

type EquityCurveChartProps = {
  data: EquityPoint[];
  /** Projected curve with what-if rules applied (same length as data) */
  projectedData?: EquityPoint[];
  initialBalance: number;
  targetPct?: number;
  height?: number;
  className?: string;
};

export function EquityCurveChart({
  data,
  projectedData,
  initialBalance,
  targetPct,
  height = 200,
  className = ""
}: EquityCurveChartProps) {
  const chartData = useMemo(() => {
    if (!data.length) return [];
    if (!projectedData || projectedData.length !== data.length) return data.map((p) => ({ ...p, projectedPct: undefined }));
    return data.map((p, i) => ({ ...p, projectedPct: projectedData[i]?.pct }));
  }, [data, projectedData]);

  if (!data.length) {
    return (
      <div
        className={"rounded-xl border border-slate-800 bg-surface flex items-center justify-center text-slate-500 text-sm " + className}
        style={{ height }}
      >
        No trade data for equity curve
      </div>
    );
  }

  const hasProjected = chartData.some((d) => d.projectedPct !== undefined);

  return (
    <div className={"rounded-xl border border-slate-800 bg-surface p-4 " + className}>
      <p className="text-xs text-slate-500 mb-2">
        {hasProjected ? "Current equity vs projected (with what-if settings)" : "Equity curve (from closed trades)"}
      </p>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickFormatter={(d) => (d.length >= 10 ? d.slice(5, 10) : d)}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickFormatter={(v) => `${v.toFixed(1)}%`}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#0b0b10", border: "1px solid #334155" }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(value: number, name: string) => [value != null ? `${Number(value).toFixed(2)}%` : "", name === "pct" ? "Current" : name === "projectedPct" ? "Projected" : name]}
            labelFormatter={(label) => label}
          />
          {targetPct != null && (
            <ReferenceLine y={targetPct} stroke="#22d3ee" strokeDasharray="3 3" />
          )}
          <Area
            type="monotone"
            dataKey="pct"
            stroke="#22d3ee"
            fill="url(#equityGrad)"
            strokeWidth={2}
            name="Current"
          />
          {hasProjected && (
            <Line
              type="monotone"
              dataKey="projectedPct"
              stroke="#f59e0b"
              strokeDasharray="4 2"
              dot={false}
              strokeWidth={2}
              name="Projected"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
