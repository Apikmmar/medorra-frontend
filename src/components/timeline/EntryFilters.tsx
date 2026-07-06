"use client";

import { useState, useCallback } from "react";

export interface EntryFilterState {
  entryType?: string;
  startDate?: string;
  endDate?: string;
}

export interface EntryFiltersProps {
  onFilterChange: (filters: EntryFilterState) => void;
}

const ENTRY_TYPES = ["symptom", "medication", "food", "sleep"] as const;

export function EntryFilters({ onFilterChange }: EntryFiltersProps) {
  const [selectedType, setSelectedType] = useState<string | undefined>(
    undefined
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);

  const emitFilterChange = useCallback(
    (type: string | undefined, start: string, end: string) => {
      const filters: EntryFilterState = {};
      if (type) {
        filters.entryType = type;
      }
      if (start) {
        filters.startDate = start;
      }
      if (end) {
        filters.endDate = end;
      }
      onFilterChange(filters);
    },
    [onFilterChange]
  );

  const validateDateRange = useCallback(
    (start: string, end: string): boolean => {
      if (start && end && start > end) {
        setDateError("Start date must not be after end date");
        return false;
      }
      setDateError(null);
      return true;
    },
    []
  );

  const handleTypeSelect = useCallback(
    (type: string | undefined) => {
      setSelectedType(type);
      if (!dateError) {
        emitFilterChange(type, startDate, endDate);
      }
    },
    [startDate, endDate, dateError, emitFilterChange]
  );

  const handleStartDateChange = useCallback(
    (value: string) => {
      setStartDate(value);
      const valid = validateDateRange(value, endDate);
      if (valid) {
        emitFilterChange(selectedType, value, endDate);
      }
    },
    [endDate, selectedType, validateDateRange, emitFilterChange]
  );

  const handleEndDateChange = useCallback(
    (value: string) => {
      setEndDate(value);
      const valid = validateDateRange(startDate, value);
      if (valid) {
        emitFilterChange(selectedType, startDate, value);
      }
    },
    [startDate, selectedType, validateDateRange, emitFilterChange]
  );

  const handleClearDates = useCallback(() => {
    setStartDate("");
    setEndDate("");
    setDateError(null);
    emitFilterChange(selectedType, "", "");
  }, [selectedType, emitFilterChange]);

  return (
    <div className="space-y-4">
      {/* Entry Type Filter */}
      <div>
        <label className="label mb-2">
          Entry Type
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleTypeSelect(undefined)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
              !selectedType
                ? "bg-accent text-accent-fg border-accent"
                : "bg-surface-2 text-muted border-border hover:bg-surface-3"
            }`}
            aria-pressed={!selectedType}
          >
            All
          </button>
          {ENTRY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeSelect(type)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md border capitalize transition-colors ${
                selectedType === type
                  ? "bg-accent text-accent-fg border-accent"
                  : "bg-surface-2 text-muted border-border hover:bg-surface-3"
              }`}
              aria-pressed={selectedType === type}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Filter */}
      <div>
        <label className="label mb-2">
          Date Range
        </label>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <div className="flex-1 w-full">
            <label htmlFor="filter-start-date" className="sr-only">
              Start date
            </label>
            <input
              id="filter-start-date"
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className={`input ${dateError ? "input-error" : ""}`}
              aria-label="Start date"
              aria-invalid={!!dateError}
              aria-describedby={dateError ? "date-range-error" : undefined}
            />
          </div>
          <span className="text-muted text-sm">to</span>
          <div className="flex-1 w-full">
            <label htmlFor="filter-end-date" className="sr-only">
              End date
            </label>
            <input
              id="filter-end-date"
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className={`input ${dateError ? "input-error" : ""}`}
              aria-label="End date"
              aria-invalid={!!dateError}
              aria-describedby={dateError ? "date-range-error" : undefined}
            />
          </div>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={handleClearDates}
              className="text-sm text-muted hover:text-fg underline whitespace-nowrap"
            >
              Clear dates
            </button>
          )}
        </div>
        {dateError && (
          <p id="date-range-error" className="form-error" role="alert">
            {dateError}
          </p>
        )}
      </div>
    </div>
  );
}
