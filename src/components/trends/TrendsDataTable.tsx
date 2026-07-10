"use client";

import type { TrendsResponse } from "./TrendsPanel";
import { formatShortDate } from "./format";

export interface TrendsDataTableProps {
  trends: TrendsResponse;
}

function fmt(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : String(value);
}

/**
 * Visually-hidden table mirroring the chart data, so screen reader users get
 * the same information conveyed visually by the line/bar charts above.
 */
export function TrendsDataTable({ trends }: TrendsDataTableProps) {
  return (
    <div className="sr-only">
      <table>
        <caption>Health trends data for the last {trends.range} days</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Avg severity</th>
            <th scope="col">Max severity</th>
            <th scope="col">Top symptom</th>
            <th scope="col">Avg sleep duration (minutes)</th>
            <th scope="col">Avg sleep quality</th>
            <th scope="col">Medication entries</th>
            <th scope="col">Food entries</th>
          </tr>
        </thead>
        <tbody>
          {trends.dates.map((date, i) => (
            <tr key={date}>
              <th scope="row">{formatShortDate(date)}</th>
              <td>{fmt(trends.symptom.avgSeverity[i])}</td>
              <td>{fmt(trends.symptom.maxSeverity[i])}</td>
              <td>{trends.symptom.topSymptom[i] ?? "—"}</td>
              <td>{fmt(trends.sleep.avgDuration[i])}</td>
              <td>{fmt(trends.sleep.avgQuality[i])}</td>
              <td>{trends.medication.count[i]}</td>
              <td>{trends.food.count[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
