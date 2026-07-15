"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { TimelineView } from "@/components/timeline/TimelineView";
import { Button } from "@/components/ui";

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
        <Button asChild className="flex-shrink-0">
          <Link href="/entries/new">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Entry</span>
          </Link>
        </Button>
      </div>
      <TimelineView />
    </div>
  );
}
