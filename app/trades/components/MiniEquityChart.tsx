"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";

type Point = { index: number; closeTime: string; cumulative: number; pct: number; label: string };

type MiniEquityChartProps = {
  /** Cumulative P&L points (sorted by time asc) */
  data: Point[];
  /** Indices of selected trades to highlight */
  selectedIndices: Set<number>;
  currency: string;
  height?: number;
};

export function MiniEquityChart({
  data,
  selectedIndices,
  currency,
  height = 120
}: MiniEquityChartProps) {
  const chartData = useMemo(
    () =>
      data.map((p) => ({
        ...p,
        selected: selectedIndices.has(p.index)
      })),
    [data, selectedIndices]
  );

  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-3" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="miniEquityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} />
          <YAxis tickFormatter={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(0)}`} tick={{ fontSize: 9, fill: "#94a3b8" }} width={36} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 6, fontSize: 11 }}
            formatter={(value: number) => [`${value >= 0 ? "+" : ""}${value.toFixed(2)} ${currency}`, "Cumulative P&L"]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.closeTime?.slice(0, 10) ?? ""}
          />
          <Area type="monotone" dataKey="cumulative" stroke="#22d3ee" fill="url(#miniEquityGrad)" strokeWidth={1.5} />
          {chartData.filter((d) => d.selected).map((d, i) => (
            <ReferenceDot key={i} x={d.label} y={d.cumulative} r={4} fill="#f59e0b" stroke="#fff" strokeWidth={1} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
