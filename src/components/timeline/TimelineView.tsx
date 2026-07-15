"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import {
  Card,
  EmptyState,
  Pagination,
  getEntryVisual,
  Button,
  Skeleton,
} from "@/components/ui";
import { EntryFilters, EntryFilterState } from "./EntryFilters";
import { highlightMatch } from "@/lib/highlight";

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
  // Shared
  notes?: string;
}

export interface EntriesResponse {
  entries: TimelineEntry[];
  totalCount: number;
  hasMore: boolean;
  /** Present on the timeline (page-based) endpoint. */
  page?: number;
  pageSize?: number;
  /** Present on the by-type (cursor-based) endpoint. */
  lastKey?: string | null;
}

const PAGE_SIZE = 15;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Group header label: "Today", "Yesterday", or a formatted date. */
function formatDateHeading(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

function dateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getEntryTitle(entry: TimelineEntry): string {
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
      const hours = Math.floor(total / 60);
      const minutes = total % 60;
      return hours > 0 ? `${hours}h ${minutes}m sleep` : `${minutes}m sleep`;
    }
    default:
      return "Entry";
  }
}

function getEntryDetail(entry: TimelineEntry): string | null {
  switch (entry.entryType) {
    case "symptom":
      return entry.severity != null ? `Severity ${entry.severity}/10` : null;
    case "medication":
      if (entry.dosageAmount && entry.dosageUnit) {
        return `${entry.dosageAmount}${entry.dosageUnit}`;
      }
      return null;
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

interface EntryRowProps {
  entry: TimelineEntry;
  /** When set, occurrences of this term are highlighted (used by search). */
  highlight?: string;
}

export function EntryRow({ entry, highlight }: EntryRowProps) {
  const visual = getEntryVisual(entry.entryType);
  const detail = getEntryDetail(entry);

  return (
    <li className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2/60 sm:px-5">
      <span
        className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${visual.avatar}`}
        aria-hidden="true"
      >
        {visual.icon}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-fg">
            {highlightMatch(getEntryTitle(entry), highlight)}
          </p>
          <span
            className={`inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${visual.badge}`}
          >
            {visual.label}
          </span>
        </div>
        {detail && (
          <p className="mt-0.5 truncate text-sm text-muted">
            {highlightMatch(detail, highlight)}
          </p>
        )}
        {entry.notes && (
          <p className="mt-1 line-clamp-2 text-xs text-faint">
            {highlightMatch(entry.notes, highlight)}
          </p>
        )}
      </div>

      <time
        dateTime={entry.createdAt}
        className="flex-shrink-0 pt-0.5 text-xs tabular-nums text-faint"
      >
        {formatTime(entry.createdAt)}
      </time>
    </li>
  );
}

/** Placeholder rows shown while a page is loading. */
function TimelineSkeleton() {
  return (
    <div className="space-y-5">
      <span role="status" aria-label="Loading entries..." className="sr-only">
        Loading entries...
      </span>
      <div className="space-y-5" aria-hidden="true">
        {[0, 1].map((group) => (
          <section key={group}>
            <Skeleton className="mb-2 ml-1 h-3 w-24" />
            <Card className="divide-y divide-border overflow-hidden">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
                  <Skeleton className="h-9 w-9 flex-shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-2 py-0.5">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-3 w-10" />
                </div>
              ))}
            </Card>
          </section>
        ))}
      </div>
    </div>
  );
}

function countActiveFilters(f: EntryFilterState): number {
  let n = 0;
  if (f.entryType) n += 1;
  if (f.startDate) n += 1;
  if (f.endDate) n += 1;
  return n;
}

export function TimelineView() {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [filters, setFilters] = useState<EntryFilterState>({});
  const [pageIndex, setPageIndex] = useState(0); // 0-based
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const loadPage = useCallback(
    async (f: EntryFilterState, idx: number, stack: (string | null)[]) => {
      setIsLoading(true);
      setError(null);

      const qs = new URLSearchParams();
      qs.set("pageSize", String(PAGE_SIZE));
      if (f.startDate) qs.set("startDate", f.startDate);
      if (f.endDate) qs.set("endDate", f.endDate);

      let path: string;
      if (f.entryType) {
        // By-type endpoint: cursor-based pagination.
        qs.set("type", f.entryType);
        const cursor = stack[idx];
        if (cursor) qs.set("lastKey", cursor);
        path = `/entries?${qs.toString()}`;
      } else {
        // Timeline endpoint: page-based pagination.
        qs.set("page", String(idx + 1));
        path = `/entries/timeline?${qs.toString()}`;
      }

      try {
        const res = await apiClient.get<EntriesResponse>(path);
        const data = res.data;

        setEntries(data.entries);
        setTotalCount(data.totalCount);
        setHasMore(data.hasMore);
        setNextCursor(data.lastKey ?? null);

        setFilters(f);
        setPageIndex(idx);
        setCursorStack(stack);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load entries");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadPage({}, 0, [null]);
  }, [loadPage]);

  const handleFilterChange = useCallback(
    (next: EntryFilterState) => {
      // Any filter change resets to the first page and clears cursors.
      loadPage(next, 0, [null]);
    },
    [loadPage]
  );

  const handleNext = useCallback(() => {
    if (!hasMore) return;
    if (filters.entryType) {
      const stack = [...cursorStack];
      stack[pageIndex + 1] = nextCursor;
      loadPage(filters, pageIndex + 1, stack);
    } else {
      loadPage(filters, pageIndex + 1, cursorStack);
    }
  }, [hasMore, filters, cursorStack, pageIndex, nextCursor, loadPage]);

  const handlePrev = useCallback(() => {
    if (pageIndex === 0) return;
    loadPage(filters, pageIndex - 1, cursorStack);
  }, [pageIndex, filters, cursorStack, loadPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const activeFilters = countActiveFilters(filters);
  const rangeStart = totalCount === 0 ? 0 : pageIndex * PAGE_SIZE + 1;
  const rangeEnd = pageIndex * PAGE_SIZE + entries.length;

  // Group current page entries by day for date headings.
  const groups: { key: string; label: string; items: TimelineEntry[] }[] = [];
  for (const entry of entries) {
    const key = dateKey(entry.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(entry);
    } else {
      groups.push({ key, label: formatDateHeading(entry.createdAt), items: [entry] });
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: result summary + filter toggle */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {totalCount > 0 ? (
            <>
              <span className="font-medium text-fg">
                {rangeStart}–{rangeEnd}
              </span>{" "}
              of {totalCount}
            </>
          ) : (
            "No entries"
          )}
        </p>

        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilters > 0 && (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-accent-fg">
              {activeFilters}
            </span>
          )}
        </Button>
      </div>

      {/* Collapsible filter panel */}
      {showFilters && (
        <Card className="animate-fade-in p-4 sm:p-5">
          <EntryFilters onFilterChange={handleFilterChange} />
        </Card>
      )}

      {/* Content */}
      {isLoading ? (
        <TimelineSkeleton />
      ) : error ? (
        <div
          className="rounded-2xl border border-danger/20 bg-danger/10 p-4"
          role="alert"
        >
          <p className="text-sm text-danger">{error}</p>
          <button
            onClick={() => loadPage(filters, pageIndex, cursorStack)}
            className="mt-2 text-sm font-medium text-danger underline hover:brightness-110"
          >
            Try again
          </button>
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <EmptyState
            icon={
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            title={activeFilters > 0 ? "No entries match your filters" : "No entries yet"}
            description={
              activeFilters > 0
                ? "Try adjusting or clearing your filters to see more."
                : "Start logging symptoms, medications, food, or sleep to see them here."
            }
            action={
              activeFilters === 0 ? (
                <Link href="/entries/new" className="btn-primary">
                  Log your first entry
                </Link>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="space-y-5 animate-fade-in">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-faint">
                {group.label}
              </h2>
              <Card className="overflow-hidden">
                <ul className="divide-y divide-border" aria-label="Timeline entries">
                  {group.items.map((entry) => (
                    <EntryRow key={entry.entryId} entry={entry} />
                  ))}
                </ul>
              </Card>
            </section>
          ))}

          {totalPages > 1 && (
            <div className="pt-1">
              <Pagination
                page={pageIndex + 1}
                totalPages={totalPages}
                canPrev={pageIndex > 0}
                canNext={hasMore}
                onPrev={handlePrev}
                onNext={handleNext}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
