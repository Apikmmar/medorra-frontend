"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ApiClientError } from "@/lib/api/client";
import {
  SymptomEntryForm,
  MedicationEntryForm,
  FoodEntryForm,
  SleepEntryForm,
} from "@/components/entries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
} from "@/components/ui";

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
    const initialData = {
      ...entry,
      entryId: entry.entryId,
      version: entry.version,
    };

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

  const title = `Edit ${
    entry.entryType.charAt(0).toUpperCase() + entry.entryType.slice(1)
  } Entry`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent hideCloseButton className="max-w-lg">
        <DialogHeader className="flex-row items-center justify-between">
          <DialogTitle>{title}</DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-faint transition-colors hover:bg-surface-2 hover:text-fg focus:outline-none focus:ring-2 focus:ring-accent/60"
            aria-label="Close edit modal"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        {conflictError && (
          <div
            className="rounded-lg border border-warning/20 bg-warning/10 p-3"
            role="alert"
          >
            <p className="text-sm text-warning">{conflictError}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              className="mt-2 border-warning/30 bg-warning/15 text-warning hover:bg-warning/25"
            >
              Refresh
            </Button>
          </div>
        )}

        {notFoundError && (
          <div
            className="rounded-lg border border-danger/20 bg-danger/10 p-3"
            role="alert"
          >
            <p className="text-sm text-danger">{notFoundError}</p>
          </div>
        )}

        {!conflictError && !notFoundError && renderForm()}
      </DialogContent>
    </Dialog>
  );
}
