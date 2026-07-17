"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api/client";

export type FeedbackCategory =
  | "bug"
  | "feature"
  | "improvement"
  | "general"
  | "praise";

const CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: "bug", label: "Bug report" },
  { value: "feature", label: "Feature request" },
  { value: "improvement", label: "Improvement" },
  { value: "general", label: "General" },
  { value: "praise", label: "Praise" },
];

const MAX_SUBJECT = 120;
const MAX_MESSAGE = 2000;

interface FeedbackFormData {
  category: FeedbackCategory;
  subject: string;
  message: string;
  rating: number | null;
}

interface ValidationErrors {
  category: string;
  subject: string;
  message: string;
  rating: string;
}

const emptyErrors: ValidationErrors = {
  category: "",
  subject: "",
  message: "",
  rating: "",
};

export interface FeedbackFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function FeedbackForm({ onSuccess, onError }: FeedbackFormProps = {}) {
  const [formData, setFormData] = useState<FeedbackFormData>({
    category: "general",
    subject: "",
    message: "",
    rating: null,
  });

  const [errors, setErrors] = useState<ValidationErrors>(emptyErrors);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateSubject = useCallback((subject: string) => {
    if (subject.length > MAX_SUBJECT) {
      return `Subject must be ${MAX_SUBJECT} characters or fewer`;
    }
    return "";
  }, []);

  const validateMessage = useCallback((message: string) => {
    if (!message.trim()) {
      return "Feedback message is required";
    }
    if (message.length > MAX_MESSAGE) {
      return `Message must be ${MAX_MESSAGE} characters or fewer`;
    }
    return "";
  }, []);

  const handleSubjectChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({ ...prev, subject: value }));
      setErrors((prev) => ({ ...prev, subject: validateSubject(value) }));
    },
    [validateSubject]
  );

  const handleMessageChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({ ...prev, message: value }));
      setErrors((prev) => ({ ...prev, message: validateMessage(value) }));
    },
    [validateMessage]
  );

  const handleRatingChange = useCallback((value: number) => {
    setFormData((prev) => ({
      ...prev,
      rating: prev.rating === value ? null : value,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(false);

    const newErrors: ValidationErrors = {
      category: "",
      subject: validateSubject(formData.subject),
      message: validateMessage(formData.message),
      rating: "",
    };
    setErrors(newErrors);

    if (newErrors.subject || newErrors.message) return;

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        category: formData.category,
        message: formData.message.trim(),
        subject: formData.subject.trim() || undefined,
        rating: formData.rating ?? undefined,
      };

      await apiClient.post("/feedback", payload);

      setSubmitSuccess(true);
      setFormData({ category: "general", subject: "", message: "", rating: null });
      setErrors(emptyErrors);
      onSuccess?.();
    } catch (err: any) {
      const message = err?.message || "Failed to submit feedback";
      setSubmitError(message);
      onError?.(err instanceof Error ? err : new Error(message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Feedback form">
      <h2 className="text-xl font-semibold text-fg">Share your feedback</h2>

      {/* Category */}
      <div>
        <label htmlFor="feedback-category" className="label">
          Category
        </label>
        <select
          id="feedback-category"
          value={formData.category}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              category: e.target.value as FeedbackCategory,
            }))
          }
          className="input mt-1"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="feedback-subject" className="label">
          Subject (optional)
        </label>
        <input
          id="feedback-subject"
          type="text"
          value={formData.subject}
          onChange={(e) => handleSubjectChange(e.target.value)}
          maxLength={MAX_SUBJECT}
          className="input mt-1"
          placeholder="Short summary"
        />
        <p className="form-hint">
          {formData.subject.length}/{MAX_SUBJECT} characters
        </p>
        {errors.subject && (
          <p className="text-sm text-danger" role="alert">
            {errors.subject}
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="feedback-message" className="label">
          Message
        </label>
        <textarea
          id="feedback-message"
          value={formData.message}
          onChange={(e) => handleMessageChange(e.target.value)}
          maxLength={MAX_MESSAGE}
          rows={5}
          className="input mt-1"
          placeholder="Tell us what's on your mind..."
          required
        />
        <p className="form-hint">
          {formData.message.length}/{MAX_MESSAGE} characters
        </p>
        {errors.message && (
          <p className="text-sm text-danger" role="alert">
            {errors.message}
          </p>
        )}
      </div>

      {/* Rating (optional) */}
      <div>
        <span className="label">Rating (optional)</span>
        <div className="mt-2 flex items-center gap-2" role="group" aria-label="Rating out of 5">
          {[1, 2, 3, 4, 5].map((value) => {
            const active = formData.rating != null && value <= formData.rating;
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleRatingChange(value)}
                aria-pressed={formData.rating === value}
                aria-label={`${value} star${value > 1 ? "s" : ""}`}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border text-lg transition-colors ${
                  active
                    ? "border-accent bg-accent/10 text-accent-text"
                    : "border-border bg-surface text-faint hover:border-border-strong hover:bg-surface-2"
                }`}
              >
                ★
              </button>
            );
          })}
          {formData.rating != null && (
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, rating: null }))}
              className="ml-1 text-sm text-muted hover:text-fg"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Submit */}
      {submitError && (
        <p className="text-sm text-danger" role="alert">
          {submitError}
        </p>
      )}
      {submitSuccess && (
        <p className="text-sm text-success" role="status">
          Thanks! Your feedback was submitted.
        </p>
      )}

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
}
