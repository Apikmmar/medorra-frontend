"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { SleepSeries } from "./TrendsPanel";
import { formatShortDate } from "./format";

export interface SleepChartProps {
  dates: string[];
  sleep: SleepSeries;
}

export function SleepChart({ dates, sleep }: SleepChartProps) {
  const data = dates.map((date, i) => ({
    date,
    label: formatShortDate(date),
    // Duration is stored in minutes; render in hours for readability.
    avgDurationHours:
      sleep.avgDuration[i] != null ? Math.round((sleep.avgDuration[i]! / 60) * 10) / 10 : null,
    avgQuality: sleep.avgQuality[i],
  }));

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5">
      <h3 className="text-sm font-semibold text-fg">Sleep</h3>
      <p className="mt-0.5 text-xs text-muted">Average duration (hours) and quality per day</p>
      <div className="mt-4 h-64" role="img" aria-label="Line chart of sleep duration and quality over time">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(34 43 54)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "rgb(154 168 182)" }}
              tickLine={false}
              axisLine={{ stroke: "rgb(34 43 54)" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "rgb(154 168 182)" }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip
              contentStyle={{
                background: "rgb(17 22 29)",
                border: "1px solid rgb(34 43 54)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "rgb(230 237 243)" }}
            />
            <Line
              type="monotone"
              dataKey="avgDurationHours"
              name="Avg duration (hrs)"
              stroke="rgb(139 92 246)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="avgQuality"
              name="Avg quality"
              stroke="rgb(96 165 250)"
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
