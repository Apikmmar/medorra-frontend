"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { apiClient } from "@/lib/api/client";
import { Spinner, EmptyState } from "@/components/ui";
import { TrendsDataTable } from "./TrendsDataTable";

// Recharts measures the DOM (ResponsiveContainer) and doesn't play well with
// SSR/hydration, so the chart components are loaded client-side only.
const SeverityChart = dynamic(
  () => import("./SeverityChart").then((mod) => mod.SeverityChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const SleepChart = dynamic(
  () => import("./SleepChart").then((mod) => mod.SleepChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const EntryCountChart = dynamic(
  () => import("./EntryCountChart").then((mod) => mod.EntryCountChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

function ChartSkeleton() {
  return (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-surface shadow-card">
      <Spinner label="Loading chart..." />
    </div>
  );
}

export interface SymptomSeries {
  avgSeverity: (number | null)[];
  maxSeverity: (number | null)[];
  topSymptom: (string | null)[];
}

export interface SleepSeries {
  avgDuration: (number | null)[];
  avgQuality: (number | null)[];
}

export interface CountSeries {
  count: number[];
}

export interface TrendsResponse {
  range: number;
  timezone: string;
  dates: string[];
  symptom: SymptomSeries;
  sleep: SleepSeries;
  medication: CountSeries;
  food: CountSeries;
}

const RANGE_OPTIONS = [7, 30, 90] as const;
type RangeOption = (typeof RANGE_OPTIONS)[number];

function hasAnyData(trends: TrendsResponse): boolean {
  const hasSymptom = trends.symptom.avgSeverity.some((v) => v !== null);
  const hasSleep = trends.sleep.avgDuration.some((v) => v !== null);
  const hasMedication = trends.medication.count.some((v) => v > 0);
  const hasFood = trends.food.count.some((v) => v > 0);
  return hasSymptom || hasSleep || hasMedication || hasFood;
}

export function TrendsPanel() {
  const [range, setRange] = useState<RangeOption>(30);
  const [trends, setTrends] = useState<TrendsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = useCallback(async (selectedRange: RangeOption) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<TrendsResponse>(
        `/analysis/trends?range=${selectedRange}`
      );
      setTrends(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load trends";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrends(range);
  }, [range, fetchTrends]);

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex items-center gap-2" role="group" aria-label="Select date range">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setRange(option)}
            aria-pressed={range === option}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              range === option
                ? "bg-accent text-accent-fg border-accent"
                : "bg-surface-2 text-muted border-border hover:bg-surface-3"
            }`}
          >
            {option} days
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12" role="status" aria-label="Loading trends">
          <Spinner label="Loading trends..." />
        </div>
      ) : error ? (
        <div className="rounded-xl bg-danger/10 border border-danger/20 p-4" role="alert">
          <p className="text-sm text-danger">{error}</p>
          <button
            onClick={() => fetchTrends(range)}
            className="mt-2 text-sm font-medium text-danger hover:brightness-110 underline"
          >
            Try again
          </button>
        </div>
      ) : !trends || !hasAnyData(trends) ? (
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
          <EmptyState
            title="No data in this range"
            description="Log symptoms, medications, food, or sleep to see trends here."
          />
        </div>
      ) : (
        <div className="space-y-6">
          <SeverityChart dates={trends.dates} symptom={trends.symptom} />
          <SleepChart dates={trends.dates} sleep={trends.sleep} />
          <EntryCountChart
            dates={trends.dates}
            medication={trends.medication}
            food={trends.food}
          />
          {/* Accessible text alternative to the visual charts. */}
          <TrendsDataTable trends={trends} />
        </div>
      )}
    </div>
  );
}
