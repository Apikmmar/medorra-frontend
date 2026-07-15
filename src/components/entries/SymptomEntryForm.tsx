"use client";

import { useState, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api/client";
import { isFutureDateTime, nowLocalInputValue } from "@/lib/validation/time";

export interface SymptomFormData {
  symptomName: string;
  severity: number;
  timestamp: string;
  notes: string;
}

interface FieldErrors {
  symptomName?: string;
  severity?: string;
  notes?: string;
  timestamp?: string;
}

export interface SymptomEntryInitialData {
  entryId: string;
  version: number;
  symptomName?: string;
  severity?: number;
  timestamp?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface SymptomEntryFormProps {
  initialData?: SymptomEntryInitialData;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function SymptomEntryForm({ initialData, onSuccess, onError }: SymptomEntryFormProps) {
  const isEditMode = !!initialData;

  const [formData, setFormData] = useState<SymptomFormData>({
    symptomName: initialData?.symptomName ?? "",
    severity: initialData?.severity ?? 5,
    timestamp: initialData?.timestamp ?? "",
    notes: initialData?.notes ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validationTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const validateField = useCallback(
    (field: keyof SymptomFormData, value: string | number): string | undefined => {
      switch (field) {
        case "symptomName": {
          const strValue = String(value).trim();
          if (!strValue) {
            return "Symptom name is required";
          }
          if (strValue.length > 100) {
            return "Symptom name must be 100 characters or less";
          }
          return undefined;
        }
        case "severity": {
          const numValue = Number(value);
          if (!Number.isInteger(numValue) || numValue < 1 || numValue > 10) {
            return "Severity must be an integer between 1 and 10";
          }
          return undefined;
        }
        case "notes": {
          const strValue = String(value);
          if (strValue.length > 2000) {
            return "Notes must be 2000 characters or less";
          }
          return undefined;
        }
        default:
          return undefined;
      }
    },
    []
  );

  const scheduleValidation = useCallback(
    (field: keyof SymptomFormData, value: string | number) => {
      // Clear any existing timer for this field
      if (validationTimers.current[field]) {
        clearTimeout(validationTimers.current[field]);
      }

      // Schedule validation within 1 second
      validationTimers.current[field] = setTimeout(() => {
        const error = validateField(field, value);
        setErrors((prev) => ({ ...prev, [field]: error }));
      }, 800);
    },
    [validateField]
  );

  const handleBlur = useCallback(
    (field: keyof SymptomFormData) => {
      // Clear timer and validate immediately on blur
      if (validationTimers.current[field]) {
        clearTimeout(validationTimers.current[field]);
      }
      const error = validateField(field, formData[field]);
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    [formData, validateField]
  );

  const handleChange = useCallback(
    (field: keyof SymptomFormData, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      scheduleValidation(field, value);
    },
    [scheduleValidation]
  );

  const handleSeverityChange = useCallback(
    (value: string) => {
      const numValue = value === "" ? 0 : parseInt(value, 10);
      const clampedValue = isNaN(numValue) ? 0 : numValue;
      setFormData((prev) => ({ ...prev, severity: clampedValue }));
      scheduleValidation("severity", clampedValue);
    },
    [scheduleValidation]
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: FieldErrors = {};
    newErrors.symptomName = validateField("symptomName", formData.symptomName);
    newErrors.severity = validateField("severity", formData.severity);
    newErrors.notes = validateField("notes", formData.notes);
    newErrors.timestamp = isFutureDateTime(formData.timestamp)
      ? "Timestamp cannot be in the future"
      : undefined;

    setErrors(newErrors);
    return (
      !newErrors.symptomName &&
      !newErrors.severity &&
      !newErrors.notes &&
      !newErrors.timestamp
    );
  }, [formData, validateField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateAll()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        entryType: "symptom",
        symptomName: formData.symptomName.trim(),
        severity: formData.severity,
      };

      if (formData.timestamp) {
        payload.timestamp = new Date(formData.timestamp).toISOString();
      }

      if (formData.notes.trim()) {
        payload.notes = formData.notes.trim();
      }

      if (isEditMode && initialData) {
        payload.version = initialData.version;
        await apiClient.put(`/entries/symptom/${initialData.entryId}`, payload);
      } else {
        await apiClient.post("/entries/symptom", payload);
      }
      onSuccess?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save symptom entry";
      setSubmitError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Symptom Name */}
      <div>
        <label htmlFor="symptomName" className="label">
          Symptom Name <span className="text-danger">*</span>
        </label>
        <input
          id="symptomName"
          type="text"
          maxLength={100}
          value={formData.symptomName}
          onChange={(e) => handleChange("symptomName", e.target.value)}
          onBlur={() => handleBlur("symptomName")}
          placeholder="e.g., Headache, Nausea, Fatigue"
          className={`input mt-1 ${errors.symptomName ? "input-error" : ""}`}
          aria-invalid={!!errors.symptomName}
          aria-describedby={errors.symptomName ? "symptomName-error" : undefined}
        />
        {errors.symptomName && (
          <p id="symptomName-error" className="form-error" role="alert">
            {errors.symptomName}
          </p>
        )}
      </div>

      {/* Severity */}
      <div>
        <label htmlFor="severity" className="label">
          Severity (1-10)
        </label>
        <div className="mt-1 flex items-center gap-4">
          <input
            id="severity-slider"
            type="range"
            min={1}
            max={10}
            step={1}
            value={formData.severity}
            onChange={(e) => handleSeverityChange(e.target.value)}
            onBlur={() => handleBlur("severity")}
            className="flex-1"
            aria-label="Severity slider"
          />
          <input
            id="severity"
            type="number"
            min={1}
            max={10}
            step={1}
            value={formData.severity}
            onChange={(e) => handleSeverityChange(e.target.value)}
            onBlur={() => handleBlur("severity")}
            className={`input w-16 px-2 text-center ${errors.severity ? "input-error" : ""}`}
            aria-invalid={!!errors.severity}
            aria-describedby={errors.severity ? "severity-error" : undefined}
          />
        </div>
        {errors.severity && (
          <p id="severity-error" className="form-error" role="alert">
            {errors.severity}
          </p>
        )}
      </div>

      {/* Timestamp */}
      <div>
        <label htmlFor="timestamp" className="label">
          Timestamp{" "}
          <span className="text-faint font-normal">(optional)</span>
        </label>
        <input
          id="timestamp"
          type="datetime-local"
          max={nowLocalInputValue()}
          value={formData.timestamp}
          onChange={(e) => handleChange("timestamp", e.target.value)}
          className={`input mt-1 ${errors.timestamp ? "input-error" : ""}`}
          aria-invalid={!!errors.timestamp}
          aria-describedby={errors.timestamp ? "timestamp-error" : undefined}
        />
        {errors.timestamp ? (
          <p id="timestamp-error" className="form-error" role="alert">
            {errors.timestamp}
          </p>
        ) : (
          <p className="form-hint">Defaults to current time if left empty.</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="label">
          Notes{" "}
          <span className="text-faint font-normal">(optional)</span>
        </label>
        <textarea
          id="notes"
          maxLength={2000}
          rows={4}
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          onBlur={() => handleBlur("notes")}
          placeholder="Any additional details about this symptom..."
          className={`input mt-1 ${errors.notes ? "input-error" : ""}`}
          aria-invalid={!!errors.notes}
          aria-describedby={errors.notes ? "notes-error" : undefined}
        />
        <div className="mt-1 flex justify-between">
          {errors.notes ? (
            <p id="notes-error" className="text-sm text-danger" role="alert">
              {errors.notes}
            </p>
          ) : (
            <span />
          )}
          <span className="text-xs text-faint">
            {formData.notes.length}/2000
          </span>
        </div>
      </div>

      {/* Submit Error */}
      {submitError && (
        <div
          className="rounded-lg bg-danger/10 border border-danger/20 p-3"
          role="alert"
        >
          <p className="text-sm text-danger">{submitError}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full"
      >
        {isSubmitting ? "Saving..." : isEditMode ? "Update Entry" : "Save Symptom Entry"}
      </button>
    </form>
  );
}
