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
import type { SymptomSeries } from "./TrendsPanel";
import { formatShortDate } from "./format";

export interface SeverityChartProps {
  dates: string[];
  symptom: SymptomSeries;
}

export function SeverityChart({ dates, symptom }: SeverityChartProps) {
  const data = dates.map((date, i) => ({
    date,
    label: formatShortDate(date),
    avgSeverity: symptom.avgSeverity[i],
    maxSeverity: symptom.maxSeverity[i],
  }));

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5">
      <h3 className="text-sm font-semibold text-fg">Symptom Severity</h3>
      <p className="mt-0.5 text-xs text-muted">Average and peak severity per day (0–10 scale)</p>
      <div className="mt-4 h-64" role="img" aria-label="Line chart of symptom severity over time">
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
              domain={[0, 10]}
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
              dataKey="avgSeverity"
              name="Avg severity"
              stroke="rgb(20 184 166)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="maxSeverity"
              name="Max severity"
              stroke="rgb(248 113 113)"
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
