"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Card, EmptyState, Pagination, Skeleton } from "@/components/ui";
import {
  EntryRow,
  type EntriesResponse,
  type TimelineEntry,
} from "@/components/timeline/TimelineView";
import { EntryFilters, type EntryFilterState } from "@/components/timeline/EntryFilters";

const PAGE_SIZE = 15;
const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

function ResultsSkeleton() {
  return (
    <Card className="divide-y divide-border overflow-hidden" aria-hidden="true">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
          <Skeleton className="h-9 w-9 flex-shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2 py-0.5">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </Card>
  );
}

export function SearchView() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filters, setFilters] = useState<EntryFilterState>({});
  const [showFilters, setShowFilters] = useState(false);

  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the raw query into the value we actually search on.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const runSearch = useCallback(
    async (term: string, f: EntryFilterState, pageNum: number) => {
      setIsLoading(true);
      setError(null);

      const qs = new URLSearchParams();
      qs.set("q", term);
      qs.set("page", String(pageNum));
      qs.set("pageSize", String(PAGE_SIZE));
      if (f.entryType) qs.set("type", f.entryType);
      if (f.startDate) qs.set("startDate", f.startDate);
      if (f.endDate) qs.set("endDate", f.endDate);

      try {
        const res = await apiClient.get<EntriesResponse>(
          `/entries/search?${qs.toString()}`
        );
        setEntries(res.data.entries);
        setTotalCount(res.data.totalCount);
        setHasMore(res.data.hasMore);
        setHasSearched(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fire a search whenever the debounced term or filters change (page resets).
  useEffect(() => {
    if (debounced.length < MIN_QUERY_LENGTH) {
      setEntries([]);
      setTotalCount(0);
      setHasMore(false);
      setHasSearched(false);
      setPage(1);
      return;
    }
    setPage(1);
    runSearch(debounced, filters, 1);
  }, [debounced, filters, runSearch]);

  const handlePage = useCallback(
    (next: number) => {
      setPage(next);
      runSearch(debounced, filters, next);
    },
    [debounced, filters, runSearch]
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const tooShort = debounced.length > 0 && debounced.length < MIN_QUERY_LENGTH;

  return (
    <div className="space-y-4">
      {/* Search box */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search symptoms, meds, food, notes…"
          className="input pl-9 pr-9"
          aria-label="Search entries"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-faint transition-colors hover:bg-surface-2 hover:text-fg"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter toggle */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted" aria-live="polite">
          {hasSearched && !isLoading
            ? `${totalCount} ${totalCount === 1 ? "result" : "results"}`
            : tooShort
              ? `Type at least ${MIN_QUERY_LENGTH} characters`
              : " "}
        </p>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="text-sm font-medium text-accent-text hover:brightness-110"
          aria-expanded={showFilters}
        >
          {showFilters ? "Hide filters" : "Filters"}
        </button>
      </div>

      {showFilters && (
        <Card className="animate-fade-in p-4 sm:p-5">
          <EntryFilters onFilterChange={setFilters} />
        </Card>
      )}

      {/* Results */}
      {error ? (
        <div
          className="rounded-2xl border border-danger/20 bg-danger/10 p-4"
          role="alert"
        >
          <p className="text-sm text-danger">{error}</p>
          <button
            onClick={() => runSearch(debounced, filters, page)}
            className="mt-2 text-sm font-medium text-danger underline hover:brightness-110"
          >
            Try again
          </button>
        </div>
      ) : isLoading ? (
        <ResultsSkeleton />
      ) : debounced.length < MIN_QUERY_LENGTH ? (
        <Card>
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="Search your entries"
            description="Find any symptom, medication, meal, or note you've logged. Narrow it down by type or date with filters."
          />
        </Card>
      ) : entries.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="No matches"
            description={`Nothing found for “${debounced}”. Try a different term or adjust your filters.`}
          />
        </Card>
      ) : (
        <div className="animate-fade-in space-y-4">
          <Card className="overflow-hidden">
            <ul className="divide-y divide-border" aria-label="Search results">
              {entries.map((entry) => (
                <EntryRow
                  key={entry.entryId}
                  entry={entry}
                  highlight={debounced}
                />
              ))}
            </ul>
          </Card>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              canPrev={page > 1}
              canNext={hasMore}
              onPrev={() => handlePage(page - 1)}
              onNext={() => handlePage(page + 1)}
            />
          )}
        </div>
      )}
    </div>
  );
}
