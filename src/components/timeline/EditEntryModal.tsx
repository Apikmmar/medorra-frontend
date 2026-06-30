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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      <div className="mx-4 my-8 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2
            id="edit-modal-title"
            className="text-lg font-semibold text-gray-900"
          >
            Edit {entry.entryType.charAt(0).toUpperCase() + entry.entryType.slice(1)} Entry
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="mb-4 rounded-md bg-yellow-50 border border-yellow-200 p-3"
            role="alert"
          >
            <p className="text-sm text-yellow-800">{conflictError}</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-2 rounded-md bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              Refresh
            </button>
          </div>
        )}

        {notFoundError && (
          <div
            className="mb-4 rounded-md bg-red-50 border border-red-200 p-3"
            role="alert"
          >
            <p className="text-sm text-red-700">{notFoundError}</p>
          </div>
        )}

        {!conflictError && !notFoundError && renderForm()}
      </div>
    </div>
  );
}
