"use client";

export interface PaginationProps {
  /** 1-based current page. */
  page: number;
  /** Total number of pages (>= 1). */
  totalPages: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
}

function ChevronLeft() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12.79 5.23a.75.75 0 010 1.06L9.06 10l3.73 3.71a.75.75 0 11-1.06 1.06l-4.25-4.24a.75.75 0 010-1.06l4.25-4.24a.75.75 0 011.06 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 010-1.06L10.94 10 7.21 6.29a.75.75 0 111.06-1.06l4.25 4.24a.75.75 0 010 1.06l-4.25 4.24a.75.75 0 01-1.06 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const btnBase =
  "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40";

export function Pagination({
  page,
  totalPages,
  canPrev,
  canNext,
  onPrev,
  onNext,
  disabled,
}: PaginationProps) {
  return (
    <nav
      className="flex items-center justify-between gap-3"
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={disabled || !canPrev}
        className={btnBase}
      >
        <ChevronLeft />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <span className="text-sm text-gray-500" aria-live="polite">
        Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
        {totalPages}
      </span>

      <button
        type="button"
        onClick={onNext}
        disabled={disabled || !canNext}
        className={btnBase}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight />
      </button>
    </nav>
  );
}
