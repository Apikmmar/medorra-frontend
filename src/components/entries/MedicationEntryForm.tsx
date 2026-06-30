"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api/client";

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
}

const initialFormData: MedicationFormData = {
  medicationName: "",
  dosageAmount: "",
  dosageUnit: "",
  scheduleType: "",
  timestamp: "",
  notes: "",
};

export function MedicationEntryForm() {
  const [formData, setFormData] = useState<MedicationFormData>(initialFormData);
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

    setErrors(newErrors);
    setTouched({
      medicationName: true,
      dosageAmount: true,
      scheduleType: true,
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

        await apiClient.post("/entries", payload);
        setSubmitSuccess(true);
        setFormData(initialFormData);
        setTouched({});
        setErrors({});
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to save medication entry";
        setSubmitError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validateAll]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <h2 className="text-xl font-semibold text-gray-900">
        Log Medication
      </h2>

      {submitSuccess && (
        <div
          className="rounded-md bg-green-50 p-4 text-sm text-green-700"
          role="alert"
        >
          Medication entry saved successfully.
        </div>
      )}

      {submitError && (
        <div
          className="rounded-md bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          {submitError}
        </div>
      )}

      {/* Medication Name */}
      <div>
        <label
          htmlFor="medicationName"
          className="block text-sm font-medium text-gray-700"
        >
          Medication Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="medicationName"
          name="medicationName"
          value={formData.medicationName}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={100}
          className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.medicationName && touched.medicationName
              ? "border-red-500"
              : "border-gray-300"
          }`}
          placeholder="e.g., Ibuprofen, Metformin"
          aria-invalid={!!errors.medicationName && touched.medicationName}
          aria-describedby={
            errors.medicationName ? "medicationName-error" : undefined
          }
        />
        {errors.medicationName && touched.medicationName && (
          <p
            id="medicationName-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {errors.medicationName}
          </p>
        )}
      </div>

      {/* Dosage Amount */}
      <div>
        <label
          htmlFor="dosageAmount"
          className="block text-sm font-medium text-gray-700"
        >
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
          className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.dosageAmount && touched.dosageAmount
              ? "border-red-500"
              : "border-gray-300"
          }`}
          placeholder="e.g., 500"
          aria-invalid={!!errors.dosageAmount && touched.dosageAmount}
          aria-describedby={
            errors.dosageAmount ? "dosageAmount-error" : undefined
          }
        />
        {errors.dosageAmount && touched.dosageAmount && (
          <p
            id="dosageAmount-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {errors.dosageAmount}
          </p>
        )}
      </div>

      {/* Dosage Unit */}
      <div>
        <label
          htmlFor="dosageUnit"
          className="block text-sm font-medium text-gray-700"
        >
          Dosage Unit
        </label>
        <input
          type="text"
          id="dosageUnit"
          name="dosageUnit"
          value={formData.dosageUnit}
          onChange={handleChange}
          onBlur={handleBlur}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., mg, ml, tablets"
        />
      </div>

      {/* Schedule Type */}
      <fieldset>
        <legend className="block text-sm font-medium text-gray-700">
          Schedule Type <span className="text-red-500">*</span>
        </legend>
        <div className="mt-2 flex gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="radio"
              name="scheduleType"
              value="as-needed"
              checked={formData.scheduleType === "as-needed"}
              onChange={() => handleRadioChange("as-needed")}
              onBlur={handleBlur}
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            As-needed
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="radio"
              name="scheduleType"
              value="scheduled"
              checked={formData.scheduleType === "scheduled"}
              onChange={() => handleRadioChange("scheduled")}
              onBlur={handleBlur}
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Scheduled
          </label>
        </div>
        {errors.scheduleType && touched.scheduleType && (
          <p
            id="scheduleType-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {errors.scheduleType}
          </p>
        )}
      </fieldset>

      {/* Timestamp */}
      <div>
        <label
          htmlFor="timestamp"
          className="block text-sm font-medium text-gray-700"
        >
          Timestamp
        </label>
        <input
          type="datetime-local"
          id="timestamp"
          name="timestamp"
          value={formData.timestamp}
          onChange={handleChange}
          onBlur={handleBlur}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700"
        >
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          onBlur={handleBlur}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Additional notes about this medication..."
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Saving..." : "Save Medication Entry"}
      </button>
    </form>
  );
}
