"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api/client";

interface SleepSegment {
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

interface SleepFormData {
  segments: SleepSegment[];
  qualityRating: number;
  notes: string;
}

interface ValidationErrors {
  segments: Record<number, string>;
  overlap: string;
  totalDuration: string;
  qualityRating: string;
  notes: string;
}

function calculateDurationMinutes(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (isNaN(start) || isNaN(end)) return 0;
  const diffMs = end - start;
  return Math.round(diffMs / 60000);
}

function formatDuration(minutes: number): string {
  if (minutes <= 0) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function segmentsOverlap(segments: SleepSegment[]): boolean {
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const a = segments[i];
      const b = segments[j];
      if (!a.startTime || !a.endTime || !b.startTime || !b.endTime) continue;
      const aStart = new Date(a.startTime).getTime();
      const aEnd = new Date(a.endTime).getTime();
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      if (isNaN(aStart) || isNaN(aEnd) || isNaN(bStart) || isNaN(bEnd)) continue;
      if (aStart < bEnd && bStart < aEnd) return true;
    }
  }
  return false;
}

const emptySegment = (): SleepSegment => ({
  startTime: "",
  endTime: "",
  durationMinutes: 0,
});

export interface SleepEntryInitialData {
  entryId: string;
  version: number;
  segments?: Array<{ startTime: string; endTime: string; durationMinutes?: number }>;
  qualityRating?: number;
  notes?: string;
  [key: string]: unknown;
}

export interface SleepEntryFormProps {
  initialData?: SleepEntryInitialData;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function SleepEntryForm({ initialData, onSuccess, onError }: SleepEntryFormProps = {}) {
  const isEditMode = !!initialData;

  const [formData, setFormData] = useState<SleepFormData>({
    segments: initialData?.segments?.length
      ? initialData.segments.map((seg) => ({
          startTime: seg.startTime,
          endTime: seg.endTime,
          durationMinutes: seg.durationMinutes ?? calculateDurationMinutes(seg.startTime, seg.endTime),
        }))
      : [emptySegment()],
    qualityRating: initialData?.qualityRating ?? 5,
    notes: initialData?.notes ?? "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({
    segments: {},
    overlap: "",
    totalDuration: "",
    qualityRating: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const totalDuration = formData.segments.reduce(
    (sum, seg) => sum + seg.durationMinutes,
    0
  );

  const validateSegment = useCallback(
    (index: number, segment: SleepSegment) => {
      if (segment.startTime && segment.endTime) {
        const duration = calculateDurationMinutes(
          segment.startTime,
          segment.endTime
        );
        if (duration <= 0) {
          return "End time must be after start time";
        }
      }
      return "";
    },
    []
  );

  const validateOverlap = useCallback((segments: SleepSegment[]) => {
    if (segmentsOverlap(segments)) {
      return "Segments must not overlap";
    }
    return "";
  }, []);

  const validateTotalDuration = useCallback((segments: SleepSegment[]) => {
    const total = segments.reduce((sum, seg) => sum + seg.durationMinutes, 0);
    if (total > 1440) {
      return "Total sleep duration cannot exceed 24 hours";
    }
    return "";
  }, []);

  const validateQualityRating = useCallback((rating: number) => {
    if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
      return "Quality rating must be an integer between 1 and 10";
    }
    return "";
  }, []);

  const validateNotes = useCallback((notes: string) => {
    if (notes.length > 1000) {
      return "Notes must be 1000 characters or fewer";
    }
    return "";
  }, []);

  const updateSegment = useCallback(
    (index: number, field: "startTime" | "endTime", value: string) => {
      setFormData((prev) => {
        const newSegments = [...prev.segments];
        const segment = { ...newSegments[index], [field]: value };
        segment.durationMinutes = calculateDurationMinutes(
          segment.startTime,
          segment.endTime
        );
        newSegments[index] = segment;
        return { ...prev, segments: newSegments };
      });

      // Debounced inline validation (within 1 second)
      setTimeout(() => {
        setFormData((current) => {
          const segment = current.segments[index];
          if (!segment) return current;

          setErrors((prevErrors) => {
            const segmentError = validateSegment(index, segment);
            const newSegmentErrors = { ...prevErrors.segments };
            if (segmentError) {
              newSegmentErrors[index] = segmentError;
            } else {
              delete newSegmentErrors[index];
            }

            const overlapError = validateOverlap(current.segments);
            const totalDurationError = validateTotalDuration(current.segments);

            return {
              ...prevErrors,
              segments: newSegmentErrors,
              overlap: overlapError,
              totalDuration: totalDurationError,
            };
          });

          return current;
        });
      }, 300);
    },
    [validateSegment, validateOverlap, validateTotalDuration]
  );

  const addSegment = useCallback(() => {
    setFormData((prev) => {
      if (prev.segments.length >= 10) return prev;
      return { ...prev, segments: [...prev.segments, emptySegment()] };
    });
  }, []);

  const removeSegment = useCallback((index: number) => {
    setFormData((prev) => {
      if (prev.segments.length <= 1) return prev;
      const newSegments = prev.segments.filter((_, i) => i !== index);
      return { ...prev, segments: newSegments };
    });
    setErrors((prev) => {
      const newSegmentErrors = { ...prev.segments };
      delete newSegmentErrors[index];
      // Re-index remaining errors
      const reindexed: Record<number, string> = {};
      Object.entries(newSegmentErrors).forEach(([key, val]) => {
        const k = Number(key);
        if (k > index) {
          reindexed[k - 1] = val;
        } else {
          reindexed[k] = val;
        }
      });
      return { ...prev, segments: reindexed };
    });
  }, []);

  const handleQualityChange = useCallback(
    (value: number) => {
      setFormData((prev) => ({ ...prev, qualityRating: value }));
      setTimeout(() => {
        setErrors((prev) => ({
          ...prev,
          qualityRating: validateQualityRating(value),
        }));
      }, 300);
    },
    [validateQualityRating]
  );

  const handleNotesChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({ ...prev, notes: value }));
      setTimeout(() => {
        setErrors((prev) => ({
          ...prev,
          notes: validateNotes(value),
        }));
      }, 300);
    },
    [validateNotes]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(false);

    // Full validation before submit
    const segmentErrors: Record<number, string> = {};
    formData.segments.forEach((seg, i) => {
      const err = validateSegment(i, seg);
      if (err) segmentErrors[i] = err;
      if (!seg.startTime || !seg.endTime) {
        segmentErrors[i] = "Start and end times are required";
      }
    });

    const overlapError = validateOverlap(formData.segments);
    const totalDurError = validateTotalDuration(formData.segments);
    const qualityError = validateQualityRating(formData.qualityRating);
    const notesError = validateNotes(formData.notes);

    const newErrors: ValidationErrors = {
      segments: segmentErrors,
      overlap: overlapError,
      totalDuration: totalDurError,
      qualityRating: qualityError,
      notes: notesError,
    };

    setErrors(newErrors);

    const hasErrors =
      Object.keys(segmentErrors).length > 0 ||
      overlapError ||
      totalDurError ||
      qualityError ||
      notesError;

    if (hasErrors) return;

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        entryType: "sleep",
        segments: formData.segments.map((seg) => ({
          startTime: seg.startTime,
          endTime: seg.endTime,
          durationMinutes: seg.durationMinutes,
        })),
        totalDuration,
        qualityRating: formData.qualityRating,
        notes: formData.notes || undefined,
      };

      if (isEditMode && initialData) {
        payload.version = initialData.version;
        await apiClient.put(`/entries/sleep/${initialData.entryId}`, payload);
      } else {
        await apiClient.post("/entries/sleep", payload);
      }
      setSubmitSuccess(true);
      if (!isEditMode) {
        setFormData({ segments: [emptySegment()], qualityRating: 5, notes: "" });
        setErrors({
          segments: {},
          overlap: "",
          totalDuration: "",
          qualityRating: "",
          notes: "",
        });
      }
      onSuccess?.();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to save sleep entry");
      onError?.(err instanceof Error ? err : new Error(err.message || "Failed to save sleep entry"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Sleep entry form">
      <h2 className="text-xl font-semibold text-gray-900">Log Sleep</h2>

      {/* Segments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">
            Sleep Segments ({formData.segments.length}/10)
          </h3>
          {formData.segments.length < 10 && (
            <button
              type="button"
              onClick={addSegment}
              className="rounded-md bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
            >
              Add Segment
            </button>
          )}
        </div>

        {formData.segments.map((segment, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Segment {index + 1}
              </span>
              {formData.segments.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSegment(index)}
                  className="text-sm text-red-600 hover:text-red-800"
                  aria-label={`Remove segment ${index + 1}`}
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 tablet:grid-cols-3">
              <div>
                <label
                  htmlFor={`segment-start-${index}`}
                  className="block text-sm text-gray-600"
                >
                  Start Time
                </label>
                <input
                  id={`segment-start-${index}`}
                  type="datetime-local"
                  value={segment.startTime}
                  onChange={(e) =>
                    updateSegment(index, "startTime", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor={`segment-end-${index}`}
                  className="block text-sm text-gray-600"
                >
                  End Time
                </label>
                <input
                  id={`segment-end-${index}`}
                  type="datetime-local"
                  value={segment.endTime}
                  onChange={(e) =>
                    updateSegment(index, "endTime", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <span className="block text-sm text-gray-600">Duration</span>
                <p
                  className="mt-1 rounded-md bg-white border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  data-testid={`segment-duration-${index}`}
                >
                  {formatDuration(segment.durationMinutes)}
                </p>
              </div>
            </div>

            {errors.segments[index] && (
              <p className="text-sm text-red-600" role="alert">
                {errors.segments[index]}
              </p>
            )}
          </div>
        ))}

        {errors.overlap && (
          <p className="text-sm text-red-600" role="alert">
            {errors.overlap}
          </p>
        )}
      </div>

      {/* Total Duration */}
      <div>
        <span className="block text-sm font-medium text-gray-700">
          Total Duration
        </span>
        <p
          className="mt-1 text-lg font-semibold text-gray-900"
          data-testid="total-duration"
        >
          {formatDuration(totalDuration)}
        </p>
        {errors.totalDuration && (
          <p className="text-sm text-red-600" role="alert">
            {errors.totalDuration}
          </p>
        )}
      </div>

      {/* Quality Rating */}
      <div>
        <label
          htmlFor="quality-rating"
          className="block text-sm font-medium text-gray-700"
        >
          Sleep Quality (1-10)
        </label>
        <div className="mt-1 flex items-center gap-3">
          <input
            id="quality-rating"
            type="range"
            min={1}
            max={10}
            step={1}
            value={formData.qualityRating}
            onChange={(e) => handleQualityChange(Number(e.target.value))}
            className="flex-1"
          />
          <input
            type="number"
            min={1}
            max={10}
            step={1}
            value={formData.qualityRating}
            onChange={(e) => handleQualityChange(Number(e.target.value))}
            className="w-16 rounded-md border border-gray-300 px-2 py-1 text-center text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            aria-label="Quality rating number input"
          />
        </div>
        {errors.qualityRating && (
          <p className="text-sm text-red-600" role="alert">
            {errors.qualityRating}
          </p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor="sleep-notes"
          className="block text-sm font-medium text-gray-700"
        >
          Notes (optional)
        </label>
        <textarea
          id="sleep-notes"
          value={formData.notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          maxLength={1000}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          placeholder="Any notes about your sleep..."
        />
        <p className="mt-1 text-xs text-gray-500">
          {formData.notes.length}/1000 characters
        </p>
        {errors.notes && (
          <p className="text-sm text-red-600" role="alert">
            {errors.notes}
          </p>
        )}
      </div>

      {/* Submit */}
      {submitError && (
        <p className="text-sm text-red-600" role="alert">
          {submitError}
        </p>
      )}
      {submitSuccess && (
        <p className="text-sm text-green-600" role="status">
          Sleep entry saved successfully!
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Saving..." : isEditMode ? "Update Entry" : "Save Sleep Entry"}
      </button>
    </form>
  );
}
