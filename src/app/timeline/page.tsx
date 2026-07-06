"use client";

import Link from "next/link";
import { TimelineView } from "@/components/timeline/TimelineView";

export default function TimelinePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">
            Timeline
          </h1>
          <p className="mt-1 text-sm text-muted">
            All your entries, newest first.
          </p>
        </div>
        <Link
          href="/entries/new"
          className="btn-primary flex-shrink-0"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 5a.75.75 0 01.75.75v3.5h3.5a.75.75 0 010 1.5h-3.5v3.5a.75.75 0 01-1.5 0v-3.5h-3.5a.75.75 0 010-1.5h3.5v-3.5A.75.75 0 0110 5z" />
          </svg>
          <span className="hidden sm:inline">New Entry</span>
        </Link>
      </div>
      <TimelineView />
    </div>
  );
}
