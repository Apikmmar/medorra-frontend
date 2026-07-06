"use client";

import { useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api/client";
import {
  SymptomEntryForm,
  MedicationEntryForm,
  FoodEntryForm,
  SleepEntryForm,
} from "@/components/entries";

export interface EditableEntry {
  entryId: string;
  entryType: "symptom" | "medication" | "food" | "sleep";
  version: number;
  [key: string]: unknown;
}

export interface EditEntryModalProps {
  entry: EditableEntry;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditEntryModal({
  entry,
  isOpen,
  onClose,
  onSuccess,
}: EditEntryModalProps) {
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [notFoundError, setNotFoundError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEditSuccess = () => {
    setConflictError(null);
    setNotFoundError(null);
    onSuccess();
  };

  const handleEditError = (error: Error) => {
    if (error instanceof ApiClientError) {
      if (error.status === 409) {
        setConflictError(
          "This entry was modified elsewhere. Please close and refresh to see the latest version."
        );
        return;
      }
      if (error.status === 404) {
        setNotFoundError("Entry not found. It may have been deleted.");
        return;
      }
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const renderForm = () => {
    const initialData = { ...entry, entryId: entry.entryId, version: entry.version };

    switch (entry.entryType) {
      case "symptom":
        return (
          <SymptomEntryForm
            initialData={initialData}
            onSuccess={handleEditSuccess}
            onError={handleEditError}
          />
        );
      case "medication":
        return (
          <MedicationEntryForm
            initialData={initialData}
            onSuccess={handleEditSuccess}
            onError={handleEditError}
          />
        );
      case "food":
        return (
          <FoodEntryForm
            initialData={initialData}
            onSuccess={handleEditSuccess}
            onError={handleEditError}
          />
        );
      case "sleep":
        return (
          <SleepEntryForm
            initialData={initialData}
            onSuccess={handleEditSuccess}
            onError={handleEditError}
          />
        );
      default:
        return <p>Unknown entry type</p>;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      <div className="mx-4 my-8 w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2
            id="edit-modal-title"
            className="text-lg font-semibold text-fg"
          >
            Edit {entry.entryType.charAt(0).toUpperCase() + entry.entryType.slice(1)} Entry
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted transition-colors hover:text-fg"
            aria-label="Close edit modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {conflictError && (
          <div
            className="mb-4 rounded-lg bg-warning/10 border border-warning/20 p-3"
            role="alert"
          >
            <p className="text-sm text-warning">{conflictError}</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-2 rounded-lg bg-warning/15 px-3 py-1 text-sm font-medium text-warning hover:bg-warning/25"
            >
              Refresh
            </button>
          </div>
        )}

        {notFoundError && (
          <div
            className="mb-4 rounded-lg bg-danger/10 border border-danger/20 p-3"
            role="alert"
          >
            <p className="text-sm text-danger">{notFoundError}</p>
          </div>
        )}

        {!conflictError && !notFoundError && renderForm()}
      </div>
    </div>
  );
}
