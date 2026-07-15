"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import { isFutureDateTime, nowLocalInputValue } from "@/lib/validation/time";

export interface MedicationFormData {
  medicationName: string;
  dosageAmount: string;
  dosageUnit: string;
  scheduleType: "as-needed" | "scheduled" | "";
  timestamp: string;
  notes: string;
}

export interface MedicationFormErrors {
  medicationName?: string;
  dosageAmount?: string;
  scheduleType?: string;
  timestamp?: string;
}

const initialFormData: MedicationFormData = {
  medicationName: "",
  dosageAmount: "",
  dosageUnit: "",
  scheduleType: "",
  timestamp: "",
  notes: "",
};

export interface MedicationEntryInitialData {
  entryId: string;
  version: number;
  medicationName?: string;
  dosageAmount?: number;
  dosageUnit?: string;
  scheduleType?: "as-needed" | "scheduled";
  timestamp?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface MedicationEntryFormProps {
  initialData?: MedicationEntryInitialData;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function MedicationEntryForm({ initialData, onSuccess, onError }: MedicationEntryFormProps) {
  const isEditMode = !!initialData;

  const [formData, setFormData] = useState<MedicationFormData>({
    medicationName: initialData?.medicationName ?? "",
    dosageAmount: initialData?.dosageAmount != null ? String(initialData.dosageAmount) : "",
    dosageUnit: initialData?.dosageUnit ?? "",
    scheduleType: initialData?.scheduleType ?? "",
    timestamp: initialData?.timestamp ?? "",
    notes: initialData?.notes ?? "",
  });
  const [errors, setErrors] = useState<MedicationFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateField = useCallback(
    (field: keyof MedicationFormData, value: string): string | undefined => {
      switch (field) {
        case "medicationName":
          if (!value || value.trim() === "") {
            return "Medication name is required";
          }
          if (value.length > 100) {
            return "Medication name must be 100 characters or less";
          }
          return undefined;

        case "dosageAmount":
          if (value === "") {
            return undefined; // optional field
          }
          const num = parseFloat(value);
          if (isNaN(num) || num < 0.01 || num > 99999) {
            return "Dosage must be between 0.01 and 99999";
          }
          return undefined;

        case "scheduleType":
          if (!value) {
            return "Schedule type must be selected";
          }
          return undefined;

        default:
          return undefined;
      }
    },
    []
  );

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      setSubmitSuccess(false);
      setSubmitError(null);

      // Validate on change if field was already touched
      if (touched[name]) {
        const error = validateField(name as keyof MedicationFormData, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(
    (
      e: React.FocusEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, value } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name as keyof MedicationFormData, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [validateField]
  );

  const handleRadioChange = useCallback(
    (value: "as-needed" | "scheduled") => {
      setFormData((prev) => ({ ...prev, scheduleType: value }));
      setTouched((prev) => ({ ...prev, scheduleType: true }));
      setErrors((prev) => ({ ...prev, scheduleType: undefined }));
      setSubmitSuccess(false);
      setSubmitError(null);
    },
    []
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: MedicationFormErrors = {};

    const nameError = validateField("medicationName", formData.medicationName);
    if (nameError) newErrors.medicationName = nameError;

    const dosageError = validateField("dosageAmount", formData.dosageAmount);
    if (dosageError) newErrors.dosageAmount = dosageError;

    const scheduleError = validateField("scheduleType", formData.scheduleType);
    if (scheduleError) newErrors.scheduleType = scheduleError;

    if (isFutureDateTime(formData.timestamp)) {
      newErrors.timestamp = "Timestamp cannot be in the future";
    }

    setErrors(newErrors);
    setTouched({
      medicationName: true,
      dosageAmount: true,
      scheduleType: true,
      timestamp: true,
    });

    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateAll()) {
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const payload: Record<string, unknown> = {
          entryType: "medication",
          medicationName: formData.medicationName.trim(),
          scheduleType: formData.scheduleType,
        };

        if (formData.dosageAmount) {
          payload.dosageAmount = parseFloat(formData.dosageAmount);
        }

        if (formData.dosageUnit) {
          payload.dosageUnit = formData.dosageUnit;
        }

        if (formData.timestamp) {
          payload.timestamp = formData.timestamp;
        }

        if (formData.notes) {
          payload.notes = formData.notes;
        }

        if (isEditMode && initialData) {
          payload.version = initialData.version;
          await apiClient.put(`/entries/medication/${initialData.entryId}`, payload);
        } else {
          await apiClient.post("/entries/medication", payload);
        }
        setSubmitSuccess(true);
        if (!isEditMode) {
          setFormData({
            medicationName: "",
            dosageAmount: "",
            dosageUnit: "",
            scheduleType: "",
            timestamp: "",
            notes: "",
          });
          setTouched({});
          setErrors({});
        }
        onSuccess?.();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to save medication entry";
        setSubmitError(message);
        onError?.(err instanceof Error ? err : new Error(message));
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validateAll, isEditMode, initialData, onSuccess, onError]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <h2 className="text-xl font-semibold text-fg">
        Log Medication
      </h2>

      {submitSuccess && (
        <div
          className="rounded-lg bg-success/10 p-4 text-sm text-success"
          role="alert"
        >
          Medication entry saved successfully.
        </div>
      )}

      {submitError && (
        <div
          className="rounded-lg bg-danger/10 p-4 text-sm text-danger"
          role="alert"
        >
          {submitError}
        </div>
      )}

      {/* Medication Name */}
      <div>
        <label htmlFor="medicationName" className="label">
          Medication Name <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          id="medicationName"
          name="medicationName"
          value={formData.medicationName}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={100}
          className={`input mt-1 ${
            errors.medicationName && touched.medicationName ? "input-error" : ""
          }`}
          placeholder="e.g., Ibuprofen, Metformin"
          aria-invalid={!!errors.medicationName && touched.medicationName}
          aria-describedby={
            errors.medicationName ? "medicationName-error" : undefined
          }
        />
        {errors.medicationName && touched.medicationName && (
          <p id="medicationName-error" className="form-error" role="alert">
            {errors.medicationName}
          </p>
        )}
      </div>

      {/* Dosage Amount */}
      <div>
        <label htmlFor="dosageAmount" className="label">
          Dosage Amount
        </label>
        <input
          type="number"
          id="dosageAmount"
          name="dosageAmount"
          value={formData.dosageAmount}
          onChange={handleChange}
          onBlur={handleBlur}
          min={0.01}
          max={99999}
          step="any"
          className={`input mt-1 ${
            errors.dosageAmount && touched.dosageAmount ? "input-error" : ""
          }`}
          placeholder="e.g., 500"
          aria-invalid={!!errors.dosageAmount && touched.dosageAmount}
          aria-describedby={
            errors.dosageAmount ? "dosageAmount-error" : undefined
          }
        />
        {errors.dosageAmount && touched.dosageAmount && (
          <p id="dosageAmount-error" className="form-error" role="alert">
            {errors.dosageAmount}
          </p>
        )}
      </div>

      {/* Dosage Unit */}
      <div>
        <label htmlFor="dosageUnit" className="label">
          Dosage Unit
        </label>
        <input
          type="text"
          id="dosageUnit"
          name="dosageUnit"
          value={formData.dosageUnit}
          onChange={handleChange}
          onBlur={handleBlur}
          className="input mt-1"
          placeholder="e.g., mg, ml, tablets"
        />
      </div>

      {/* Schedule Type */}
      <fieldset>
        <legend className="label">
          Schedule Type <span className="text-danger">*</span>
        </legend>
        <div className="mt-2 flex gap-6">
          <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
            <input
              type="radio"
              name="scheduleType"
              value="as-needed"
              checked={formData.scheduleType === "as-needed"}
              onChange={() => handleRadioChange("as-needed")}
              onBlur={handleBlur}
              className="h-4 w-4"
            />
            As-needed
          </label>
          <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
            <input
              type="radio"
              name="scheduleType"
              value="scheduled"
              checked={formData.scheduleType === "scheduled"}
              onChange={() => handleRadioChange("scheduled")}
              onBlur={handleBlur}
              className="h-4 w-4"
            />
            Scheduled
          </label>
        </div>
        {errors.scheduleType && touched.scheduleType && (
          <p id="scheduleType-error" className="form-error" role="alert">
            {errors.scheduleType}
          </p>
        )}
      </fieldset>

      {/* Timestamp */}
      <div>
        <label htmlFor="timestamp" className="label">
          Timestamp
        </label>
        <input
          type="datetime-local"
          id="timestamp"
          name="timestamp"
          max={nowLocalInputValue()}
          value={formData.timestamp}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`input mt-1 ${errors.timestamp ? "input-error" : ""}`}
          aria-invalid={!!errors.timestamp}
          aria-describedby={errors.timestamp ? "timestamp-error" : undefined}
        />
        {errors.timestamp && (
          <p id="timestamp-error" className="form-error" role="alert">
            {errors.timestamp}
          </p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="label">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          onBlur={handleBlur}
          rows={3}
          className="input mt-1"
          placeholder="Additional notes about this medication..."
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full"
      >
        {isSubmitting ? "Saving..." : isEditMode ? "Update Entry" : "Save Medication Entry"}
      </button>
    </form>
  );
}
