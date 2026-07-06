"use client";

export interface DeleteConfirmDialogProps {
  entry: {
    entryId: string;
    entryType: "symptom" | "medication" | "food" | "sleep";
  };
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  entry,
  isOpen,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <h2
          id="delete-dialog-title"
          className="text-lg font-semibold text-fg"
        >
          Delete Entry
        </h2>
        <p className="mt-2 text-sm text-muted">
          Are you sure you want to delete this {entry.entryType} entry? This
          action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="btn-danger">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
