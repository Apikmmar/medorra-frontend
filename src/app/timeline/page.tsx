"use client";

import { TimelineView } from "@/components/timeline/TimelineView";

export default function TimelinePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Timeline</h1>
        <p className="mt-1 text-sm text-gray-600">
          View all your diary entries in reverse chronological order.
        </p>
      </div>
      <TimelineView />
    </div>
  );
}
