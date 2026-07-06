"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api/client";

export interface InsightActionsProps {
  insightId: string;
  status: "active" | "dismissed" | "confirmed";
  onDismiss: (insightId: string) => void;
  onConfirm: (insightId: string) => void;
}

export function InsightActions({
  insightId,
  status,
  onDismiss,
  onConfirm,
}: InsightActionsProps) {
  const [isLoading, setIsLoading] = useState<"dismiss" | "confirm" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (status === "dismissed") {
    return null;
  }

  async function handleDismiss() {
    setIsLoading("dismiss");
    setError(null);
    try {
      await apiClient.post(`/insights/${insightId}/respond`, {
        response: "dismiss",
      });
      onDismiss(insightId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to dismiss insight";
      setError(message);
    } finally {
      setIsLoading(null);
    }
  }

  async function handleConfirm() {
    setIsLoading("confirm");
    setError(null);
    try {
      await apiClient.post(`/insights/${insightId}/respond`, {
        response: "confirm",
      });
      onConfirm(insightId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to confirm insight";
      setError(message);
    } finally {
      setIsLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {status === "confirmed" ? (
          <>
            <span className="inline-flex items-center rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
              Confirmed ✓
            </span>
            <button
              type="button"
              onClick={handleDismiss}
              disabled={isLoading !== null}
              className="btn-secondary px-3 py-1.5"
              aria-label="Dismiss insight"
            >
              {isLoading === "dismiss" ? "Dismissing..." : "Dismiss"}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleDismiss}
              disabled={isLoading !== null}
              className="btn-secondary px-3 py-1.5"
              aria-label="Dismiss insight"
            >
              {isLoading === "dismiss" ? "Dismissing..." : "Dismiss"}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading !== null}
              className="btn-primary px-3 py-1.5"
              aria-label="Confirm insight"
            >
              {isLoading === "confirm" ? "Confirming..." : "Confirm"}
            </button>
          </>
        )}
      </div>
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
