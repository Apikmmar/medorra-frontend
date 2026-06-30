"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api/client";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "beverage"] as const;
type MealType = (typeof MEAL_TYPES)[number];

interface FoodItemData {
  description: string;
  tags: string[];
}

interface FoodEntryFormData {
  mealType: MealType | "";
  items: FoodItemData[];
  timestamp?: string;
}

interface FieldErrors {
  mealType?: string;
  items?: Record<number, { description?: string; tags?: string }>;
}

export function FoodEntryForm() {
  const [formData, setFormData] = useState<FoodEntryFormData>({
    mealType: "",
    items: [{ description: "", tags: [] }],
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [tagInputs, setTagInputs] = useState<Record<number, string>>({ 0: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateMealType = useCallback((value: string): string | undefined => {
    if (!value) return "Meal type is required";
    return undefined;
  }, []);

  const validateDescription = useCallback((value: string): string | undefined => {
    if (!value.trim()) return "Food description is required";
    if (value.length > 500) return "Description must be 500 characters or less";
    return undefined;
  }, []);

  const validateTags = useCallback((tags: string[]): string | undefined => {
    if (tags.length > 10) return "Maximum 10 tags per item";
    if (tags.some((tag) => tag.length > 50)) return "Each tag must be 50 characters or less";
    return undefined;
  }, []);

  const handleMealTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, mealType: value as MealType | "" }));
    const error = validateMealType(value);
    setErrors((prev) => ({ ...prev, mealType: error }));
  };

  const handleDescriptionChange = (index: number, value: string) => {
    setFormData((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], description: value };
      return { ...prev, items };
    });
    const error = validateDescription(value);
    setErrors((prev) => {
      const itemErrors = { ...(prev.items || {}) };
      itemErrors[index] = { ...itemErrors[index], description: error };
      return { ...prev, items: itemErrors };
    });
  };

  const handleTagInputKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const input = tagInputs[index]?.trim();
      if (!input) return;

      const currentTags = formData.items[index].tags;
      if (currentTags.length >= 10) {
        setErrors((prev) => {
          const itemErrors = { ...(prev.items || {}) };
          itemErrors[index] = { ...itemErrors[index], tags: "Maximum 10 tags per item" };
          return { ...prev, items: itemErrors };
        });
        return;
      }
      if (input.length > 50) {
        setErrors((prev) => {
          const itemErrors = { ...(prev.items || {}) };
          itemErrors[index] = { ...itemErrors[index], tags: "Each tag must be 50 characters or less" };
          return { ...prev, items: itemErrors };
        });
        return;
      }

      setFormData((prev) => {
        const items = [...prev.items];
        items[index] = { ...items[index], tags: [...items[index].tags, input] };
        return { ...prev, items };
      });
      setTagInputs((prev) => ({ ...prev, [index]: "" }));
      setErrors((prev) => {
        const itemErrors = { ...(prev.items || {}) };
        if (itemErrors[index]) {
          itemErrors[index] = { ...itemErrors[index], tags: undefined };
        }
        return { ...prev, items: itemErrors };
      });
    }
  };

  const handleTagInputChange = (index: number, value: string) => {
    setTagInputs((prev) => ({ ...prev, [index]: value }));
  };

  const removeTag = (itemIndex: number, tagIndex: number) => {
    setFormData((prev) => {
      const items = [...prev.items];
      const tags = [...items[itemIndex].tags];
      tags.splice(tagIndex, 1);
      items[itemIndex] = { ...items[itemIndex], tags };
      return { ...prev, items };
    });
    // Clear tag errors when removing
    setErrors((prev) => {
      const itemErrors = { ...(prev.items || {}) };
      if (itemErrors[itemIndex]) {
        itemErrors[itemIndex] = { ...itemErrors[itemIndex], tags: undefined };
      }
      return { ...prev, items: itemErrors };
    });
  };

  const addFoodItem = () => {
    if (formData.items.length >= 20) return;
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { description: "", tags: [] }],
    }));
    setTagInputs((prev) => ({ ...prev, [formData.items.length]: "" }));
  };

  const removeFoodItem = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
    // Clean up tag inputs and errors for removed item
    setTagInputs((prev) => {
      const updated: Record<number, string> = {};
      Object.keys(prev).forEach((key) => {
        const k = Number(key);
        if (k < index) updated[k] = prev[k];
        else if (k > index) updated[k - 1] = prev[k];
      });
      return updated;
    });
    setErrors((prev) => {
      const itemErrors = { ...(prev.items || {}) };
      delete itemErrors[index];
      // Re-index remaining errors
      const reindexed: Record<number, { description?: string; tags?: string }> = {};
      Object.keys(itemErrors).forEach((key) => {
        const k = Number(key);
        if (k < index) reindexed[k] = itemErrors[k];
        else if (k > index) reindexed[k - 1] = itemErrors[k];
      });
      return { ...prev, items: reindexed };
    });
  };

  const handleTimestampChange = (value: string) => {
    setFormData((prev) => ({ ...prev, timestamp: value || undefined }));
  };

  const validateAll = (): boolean => {
    const newErrors: FieldErrors = {};
    const mealTypeError = validateMealType(formData.mealType);
    if (mealTypeError) newErrors.mealType = mealTypeError;

    const itemErrors: Record<number, { description?: string; tags?: string }> = {};
    formData.items.forEach((item, index) => {
      const descError = validateDescription(item.description);
      const tagError = validateTags(item.tags);
      if (descError || tagError) {
        itemErrors[index] = { description: descError, tags: tagError };
      }
    });
    if (Object.keys(itemErrors).length > 0) newErrors.items = itemErrors;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess(false);

    if (!validateAll()) return;

    setIsSubmitting(true);
    try {
      await apiClient.post("/entries", {
        entryType: "food",
        mealType: formData.mealType,
        items: formData.items,
        ...(formData.timestamp ? { timestamp: formData.timestamp } : {}),
      });
      setSubmitSuccess(true);
      // Reset form
      setFormData({ mealType: "", items: [{ description: "", tags: [] }] });
      setTagInputs({ 0: "" });
      setErrors({});
    } catch {
      // Error is handled by apiClient (toast notifications, etc.)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Food entry form">
      {submitSuccess && (
        <div className="rounded-md bg-green-50 p-4 text-green-800" role="status">
          Food entry saved successfully!
        </div>
      )}

      {/* Meal Type */}
      <div>
        <label htmlFor="mealType" className="block text-sm font-medium text-gray-700">
          Meal Type <span className="text-red-500">*</span>
        </label>
        <select
          id="mealType"
          value={formData.mealType}
          onChange={(e) => handleMealTypeChange(e.target.value)}
          onBlur={(e) => handleMealTypeChange(e.target.value)}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.mealType ? "border-red-500" : "border-gray-300"
          }`}
          aria-invalid={!!errors.mealType}
          aria-describedby={errors.mealType ? "mealType-error" : undefined}
        >
          <option value="">Select meal type</option>
          {MEAL_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
        {errors.mealType && (
          <p id="mealType-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.mealType}
          </p>
        )}
      </div>

      {/* Timestamp (optional) */}
      <div>
        <label htmlFor="timestamp" className="block text-sm font-medium text-gray-700">
          Timestamp
        </label>
        <input
          type="datetime-local"
          id="timestamp"
          value={formData.timestamp || ""}
          onChange={(e) => handleTimestampChange(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Food Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">
            Food Items <span className="text-red-500">*</span>
          </h3>
          <button
            type="button"
            onClick={addFoodItem}
            disabled={formData.items.length >= 20}
            className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Add food item"
          >
            + Add Item
          </button>
        </div>

        {formData.items.map((item, index) => (
          <div key={index} className="rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Item {index + 1}</span>
              {formData.items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFoodItem(index)}
                  className="text-sm text-red-600 hover:text-red-800"
                  aria-label={`Remove food item ${index + 1}`}
                >
                  Remove
                </button>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor={`description-${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id={`description-${index}`}
                value={item.description}
                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                onBlur={(e) => handleDescriptionChange(index, e.target.value)}
                maxLength={500}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.items?.[index]?.description ? "border-red-500" : "border-gray-300"
                }`}
                aria-invalid={!!errors.items?.[index]?.description}
                aria-describedby={
                  errors.items?.[index]?.description ? `description-${index}-error` : undefined
                }
                placeholder="e.g., Grilled chicken with rice"
              />
              <div className="mt-1 flex justify-between">
                {errors.items?.[index]?.description ? (
                  <p
                    id={`description-${index}-error`}
                    className="text-sm text-red-600"
                    role="alert"
                  >
                    {errors.items[index].description}
                  </p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-gray-400">{item.description.length}/500</span>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label
                htmlFor={`tags-${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Tags (max 10, press Enter or comma to add)
              </label>
              <div className="mt-1 flex flex-wrap gap-1">
                {item.tags.map((tag, tagIdx) => (
                  <span
                    key={tagIdx}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-sm text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index, tagIdx)}
                      className="text-blue-600 hover:text-blue-900"
                      aria-label={`Remove tag ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                id={`tags-${index}`}
                value={tagInputs[index] || ""}
                onChange={(e) => handleTagInputChange(index, e.target.value)}
                onKeyDown={(e) => handleTagInputKeyDown(index, e)}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.items?.[index]?.tags ? "border-red-500" : "border-gray-300"
                }`}
                aria-invalid={!!errors.items?.[index]?.tags}
                aria-describedby={errors.items?.[index]?.tags ? `tags-${index}-error` : undefined}
                placeholder="e.g., gluten, dairy, high-histamine"
              />
              {errors.items?.[index]?.tags && (
                <p id={`tags-${index}-error`} className="mt-1 text-sm text-red-600" role="alert">
                  {errors.items[index].tags}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : "Save Food Entry"}
      </button>
    </form>
  );
}
