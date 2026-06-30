"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api/client";

export interface TimelineEntry {
  entryId: string;
  entryType: "symptom" | "medication" | "food" | "sleep";
  createdAt: string;
  // Symptom fields
  symptomName?: string;
  severity?: number;
  // Medication fields
  medicationName?: string;
  dosageAmount?: number;
  dosageUnit?: string;
  // Food fields
  mealType?: string;
  items?: { description: string }[];
  // Sleep fields
  totalDuration?: number;
  qualityRating?: number;
}

export interface EntriesResponse {
  entries: TimelineEntry[];
  totalCount: number;
  hasMore: boolean;
}

const PAGE_SIZE = 50;

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEntrySummary(entry: TimelineEntry): string {
  switch (entry.entryType) {
    case "symptom":
      return `${entry.symptomName || "Unknown symptom"} — severity ${entry.severity ?? "?"}`;
    case "medication":
      if (entry.dosageAmount && entry.dosageUnit) {
        return `${entry.medicationName || "Unknown medication"} — ${entry.dosageAmount}${entry.dosageUnit}`;
      }
      return entry.medicationName || "Unknown medication";
    case "food":
      return entry.mealType
        ? entry.mealType.charAt(0).toUpperCase() + entry.mealType.slice(1)
        : "Meal";
    case "sleep": {
      const hours = entry.totalDuration ? Math.floor(entry.totalDuration / 60) : 0;
      const minutes = entry.totalDuration ? entry.totalDuration % 60 : 0;
      const duration =
        hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      return `${duration} — quality ${entry.qualityRating ?? "?"}`;
    }
    default:
      return "Entry";
  }
}

function getEntryTypeLabel(type: string): string {
  switch (type) {
    case "symptom":
      return "Symptom";
    case "medication":
      return "Medication";
    case "food":
      return "Food";
    case "sleep":
      return "Sleep";
    default:
      return "Entry";
  }
}

function getEntryTypeBadgeColor(type: string): string {
  switch (type) {
    case "symptom":
      return "bg-red-100 text-red-800";
    case "medication":
      return "bg-blue-100 text-blue-800";
    case "food":
      return "bg-green-100 text-green-800";
    case "sleep":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function TimelineView() {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async (pageNum: number, append: boolean) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await apiClient.get<EntriesResponse>(
        `/entries?pageSize=${PAGE_SIZE}&page=${pageNum}`
      );

      const data = response.data;

      if (append) {
        setEntries((prev) => [...prev, ...data.entries]);
      } else {
        setEntries(data.entries);
      }
      setTotalCount(data.totalCount);
      setHasMore(data.hasMore);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load entries";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries(1, false);
  }, [fetchEntries]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchEntries(nextPage, true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-label="Loading entries">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-sm text-gray-600">Loading entries...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 p-4" role="alert">
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={() => fetchEntries(1, false)}
          className="mt-2 text-sm font-medium text-red-600 hover:text-red-500 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No entries yet</p>
        <p className="text-gray-400 text-sm mt-1">
          Start logging symptoms, medications, food, or sleep to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {entries.length} of {totalCount} entries
        </p>
      </div>

      <ul className="divide-y divide-gray-200" aria-label="Timeline entries">
        {entries.map((entry) => (
          <li key={entry.entryId} className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-start gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getEntryTypeBadgeColor(entry.entryType)}`}
                >
                  {getEntryTypeLabel(entry.entryType)}
                </span>
                <span className="text-sm text-gray-900">
                  {getEntrySummary(entry)}
                </span>
              </div>
              <time
                dateTime={entry.createdAt}
                className="text-xs text-gray-500 whitespace-nowrap"
              >
                {formatTimestamp(entry.createdAt)}
              </time>
            </div>
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-300 shadow-sm hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
