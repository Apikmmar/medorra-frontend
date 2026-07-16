"use client";

import { useEffect } from "react";
import { captureClientError } from "@/lib/report-error";

/**
 * Root-level fallback. This only fires when the root layout itself throws, so
 * it must render its own <html>/<body> and can't rely on providers, theme, or
 * global CSS being applied. Kept fully self-contained with inline styles.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureClientError(error, { scope: "global", digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: "#080b0f",
          color: "#e6edf3",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "22rem" }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 16,
              background: "rgba(248,113,113,0.12)",
              color: "#f87171",
              fontSize: 28,
            }}
            aria-hidden="true"
          >
            !
          </div>
          <h1 style={{ fontSize: "1.25rem", margin: "0 0 8px" }}>
            Something went wrong
          </h1>
          <p
            style={{
              color: "#9aa8b6",
              fontSize: "0.9rem",
              lineHeight: 1.5,
              margin: "0 0 20px",
            }}
          >
            Medorra hit an unexpected error. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              border: 0,
              cursor: "pointer",
              background: "#14b8a6",
              color: "#041412",
              fontWeight: 600,
              fontSize: "0.9rem",
              padding: "10px 20px",
              borderRadius: 10,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
