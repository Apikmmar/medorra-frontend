"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { CountSeries } from "./TrendsPanel";
import { formatShortDate } from "./format";

export interface EntryCountChartProps {
  dates: string[];
  medication: CountSeries;
  food: CountSeries;
}

export function EntryCountChart({ dates, medication, food }: EntryCountChartProps) {
  const data = dates.map((date, i) => ({
    date,
    label: formatShortDate(date),
    medication: medication.count[i] ?? 0,
    food: food.count[i] ?? 0,
  }));

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5">
      <h3 className="text-sm font-semibold text-fg">Entries Logged</h3>
      <p className="mt-0.5 text-xs text-muted">Medication doses and meals logged per day</p>
      <div className="mt-4 h-64" role="img" aria-label="Bar chart of medication and food entries logged per day">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(34 43 54)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "rgb(154 168 182)" }}
              tickLine={false}
              axisLine={{ stroke: "rgb(34 43 54)" }}
            />
            <YAxis
              allowDecimals={false}
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
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="medication" name="Medication" fill="rgb(56 189 248)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="food" name="Food" fill="rgb(52 211 153)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
