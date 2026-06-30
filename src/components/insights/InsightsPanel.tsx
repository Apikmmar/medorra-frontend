"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import { InsightActions } from "./InsightActions";

export interface Insight {
  userId: string;
  insightId: string;
  trigger: {
    entryType: string;
    identifier: string;
  };
  correlatedSymptom: string;
  averageDelay: string;
  confidenceScore: number;
  summary: string;
  supportingEntryIds: string[];
  hasDeletedEntries?: boolean;
  status: "active" | "dismissed" | "confirmed";
  createdAt: string;
  updatedAt: string;
}

export interface InsightsResponse {
  insights: Insight[];
  thresholdMet: boolean;
  daysRemaining: number;
  totalDistinctDays: number;
}

function getConfidenceColor(score: number): string {
  if (score >= 0.8) return "bg-green-100 text-green-800";
  if (score >= 0.5) return "bg-yellow-100 text-yellow-800";
  return "bg-orange-100 text-orange-800";
}

function getConfidenceWidth(score: number): string {
  return `${Math.round(score * 100)}%`;
}

export function InsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [thresholdMet, setThresholdMet] = useState<boolean>(true);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<InsightsResponse>("/insights");
      const data = response.data;

      setInsights(data.insights);
      setThresholdMet(data.thresholdMet);
      setDaysRemaining(data.daysRemaining);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load insights";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleDismiss = useCallback((insightId: string) => {
    setInsights((prev) => prev.filter((i) => i.insightId !== insightId));
  }, []);

  const handleConfirm = useCallback((insightId: string) => {
    setInsights((prev) =>
      prev.map((i) =>
        i.insightId === insightId ? { ...i, status: "confirmed" as const } : i
      )
    );
  }, []);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-12"
        role="status"
        aria-label="Loading insights"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-sm text-gray-600">Loading insights...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 p-4" role="alert">
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={() => fetchInsights()}
          className="mt-2 text-sm font-medium text-red-600 hover:text-red-500 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Disclaimer - always shown */}
      <div
        className="rounded-md bg-blue-50 border border-blue-200 p-4"
        role="note"
        aria-label="Insights disclaimer"
      >
        <p className="text-sm text-blue-800">
          Insights are observational patterns based on your logged data. They are
          not medical diagnoses. Please consult a healthcare provider for medical
          advice.
        </p>
      </div>

      {/* Threshold not met */}
      {!thresholdMet && (
        <div className="text-center py-8">
          <p className="text-gray-600 text-lg">
            {daysRemaining} more days of logging needed before pattern analysis
            can begin.
          </p>
        </div>
      )}

      {/* Threshold met but no insights */}
      {thresholdMet && insights.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No patterns detected yet.</p>
          <p className="text-gray-400 text-sm mt-1">
            Keep logging entries and we&apos;ll analyze your data for
            correlations.
          </p>
        </div>
      )}

      {/* Insights list */}
      {thresholdMet && insights.length > 0 && (
        <ul className="space-y-4" aria-label="Insights list">
          {insights.map((insight) => (
            <li
              key={insight.insightId}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3">
                {/* Confidence score */}
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getConfidenceColor(insight.confidenceScore)}`}
                  >
                    Confidence: {insight.confidenceScore.toFixed(2)}
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: getConfidenceWidth(insight.confidenceScore) }}
                      role="progressbar"
                      aria-valuenow={insight.confidenceScore}
                      aria-valuemin={0}
                      aria-valuemax={1}
                      aria-label={`Confidence ${insight.confidenceScore.toFixed(2)}`}
                    ></div>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-sm text-gray-900">{insight.summary}</p>

                {/* Details row */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-gray-700">
                    Trigger: {insight.trigger.identifier} ({insight.trigger.entryType})
                  </span>
                  <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-gray-700">
                    Symptom: {insight.correlatedSymptom}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-gray-700">
                    Avg delay: {insight.averageDelay}
                  </span>
                </div>

                {/* Supporting entries */}
                <div className="flex items-center gap-2">
                  <a
                    href="/timeline"
                    className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    {insight.supportingEntryIds.length} supporting{" "}
                    {insight.supportingEntryIds.length === 1 ? "entry" : "entries"}
                  </a>
                </div>

                {/* Deleted entries warning */}
                {insight.hasDeletedEntries && (
                  <div
                    className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 rounded-md px-2 py-1"
                    role="alert"
                  >
                    <svg
                      className="h-4 w-4 text-amber-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Some supporting entries have been deleted</span>
                  </div>
                )}

                {/* Dismiss/Confirm actions */}
                <InsightActions
                  insightId={insight.insightId}
                  status={insight.status}
                  onDismiss={handleDismiss}
                  onConfirm={handleConfirm}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
