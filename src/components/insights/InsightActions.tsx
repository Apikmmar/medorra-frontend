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
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              Confirmed ✓
            </span>
            <button
              type="button"
              onClick={handleDismiss}
              disabled={isLoading !== null}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Dismiss insight"
            >
              {isLoading === "dismiss" ? "Dismissing..." : "Dismiss"}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading !== null}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Confirm insight"
            >
              {isLoading === "confirm" ? "Confirming..." : "Confirm"}
            </button>
          </>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
