"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";
import { captureClientError } from "@/lib/report-error";

/**
 * Route-level error boundary for the app. Next renders this in place of the
 * page subtree when a render/data error is thrown, while the root layout
 * (nav, providers, theme) stays mounted so the user can recover.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureClientError(error, { digest: error.digest });
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
      <span
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger"
        aria-hidden="true"
      >
        <AlertTriangle className="h-7 w-7" />
      </span>
      <h1 className="text-xl font-bold tracking-tight text-fg">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-muted">
        An unexpected error occurred while loading this page. Your logged data is
        safe. You can try again or head back to your dashboard.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-faint">
          Reference: <span className="font-mono">{error.digest}</span>
        </p>
      )}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button onClick={reset}>Try again</Button>
        <Button variant="secondary" asChild>
          <Link href="/">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
