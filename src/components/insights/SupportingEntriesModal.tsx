"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import { Spinner, getEntryVisual } from "@/components/ui";

interface SupportingEntry {
  entryId: string;
  entryType: "symptom" | "medication" | "food" | "sleep";
  createdAt: string;
  symptomName?: string;
  severity?: number;
  medicationName?: string;
  dosageAmount?: number;
  dosageUnit?: string;
  mealType?: string;
  items?: { description: string }[];
  totalDuration?: number;
  qualityRating?: number;
  notes?: string;
}

interface BatchEntriesResponse {
  entries: SupportingEntry[];
  totalCount: number;
  missingIds: string[];
}

export interface SupportingEntriesModalProps {
  entryIds: string[];
  isOpen: boolean;
  onClose: () => void;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTitle(entry: SupportingEntry): string {
  switch (entry.entryType) {
    case "symptom":
      return entry.symptomName || "Symptom";
    case "medication":
      return entry.medicationName || "Medication";
    case "food":
      return entry.mealType
        ? entry.mealType.charAt(0).toUpperCase() + entry.mealType.slice(1)
        : "Meal";
    case "sleep": {
      const total = entry.totalDuration ?? 0;
      const h = Math.floor(total / 60);
      const m = total % 60;
      return h > 0 ? `${h}h ${m}m sleep` : `${m}m sleep`;
    }
    default:
      return "Entry";
  }
}

function getDetail(entry: SupportingEntry): string | null {
  switch (entry.entryType) {
    case "symptom":
      return entry.severity != null ? `Severity ${entry.severity}/10` : null;
    case "medication":
      return entry.dosageAmount && entry.dosageUnit
        ? `${entry.dosageAmount}${entry.dosageUnit}`
        : null;
    case "food": {
      const items = entry.items?.map((i) => i.description).filter(Boolean) ?? [];
      return items.length ? items.join(", ") : null;
    }
    case "sleep":
      return entry.qualityRating != null ? `Quality ${entry.qualityRating}/10` : null;
    default:
      return null;
  }
}

export function SupportingEntriesModal({
  entryIds,
  isOpen,
  onClose,
}: SupportingEntriesModalProps) {
  const [entries, setEntries] = useState<SupportingEntry[]>([]);
  const [missingCount, setMissingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.post<BatchEntriesResponse>("/entries/batch", {
        entryIds,
      });
      setEntries(res.data.entries || []);
      setMissingCount(res.data.missingIds?.length || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entries");
    } finally {
      setIsLoading(false);
    }
  }, [entryIds]);

  useEffect(() => {
    if (isOpen) fetchEntries();
  }, [isOpen, fetchEntries]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="supporting-entries-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 id="supporting-entries-title" className="text-lg font-semibold text-fg">
            Supporting entries
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {isLoading ? (
            <div className="py-8">
              <Spinner label="Loading entries..." />
            </div>
          ) : error ? (
            <div className="rounded-xl bg-danger/10 border border-danger/20 p-4" role="alert">
              <p className="text-sm text-danger">{error}</p>
              <button
                onClick={fetchEntries}
                className="mt-2 text-sm font-medium text-danger underline hover:brightness-110"
              >
                Try again
              </button>
            </div>
          ) : entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              These supporting entries are no longer available.
            </p>
          ) : (
            <>
              <ul className="divide-y divide-border" aria-label="Supporting entries">
                {entries.map((entry) => {
                  const visual = getEntryVisual(entry.entryType);
                  const detail = getDetail(entry);
                  return (
                    <li key={entry.entryId} className="flex items-start gap-3 py-3">
                      <span
                        className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${visual.avatar}`}
                        aria-hidden="true"
                      >
                        {visual.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-fg">
                            {getTitle(entry)}
                          </p>
                          <span
                            className={`inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${visual.badge}`}
                          >
                            {visual.label}
                          </span>
                        </div>
                        {detail && <p className="mt-0.5 truncate text-sm text-muted">{detail}</p>}
                        {entry.notes && (
                          <p className="mt-1 line-clamp-2 text-xs text-faint">{entry.notes}</p>
                        )}
                      </div>
                      <time
                        dateTime={entry.createdAt}
                        className="flex-shrink-0 pt-0.5 text-xs tabular-nums text-faint"
                      >
                        {formatDateTime(entry.createdAt)}
                      </time>
                    </li>
                  );
                })}
              </ul>

              {missingCount > 0 && (
                <p className="mt-3 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning" role="note">
                  {missingCount} supporting {missingCount === 1 ? "entry has" : "entries have"} been deleted.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
