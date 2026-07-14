"use client";

import { useState } from "react";
import { Card, ENTRY_VISUALS, EntryType } from "@/components/ui";
import { voiceService, ProposedEntry } from "@/lib/voice/voice-service";

interface VoiceEntryReviewProps {
  draftId: string;
  transcript?: string;
  proposedEntries: ProposedEntry[];
  onConfirmed: (count: number) => void;
  onCancel: () => void;
}

export function VoiceEntryReview({
  draftId,
  transcript,
  proposedEntries,
  onConfirmed,
  onCancel,
}: VoiceEntryReviewProps) {
  const [entries, setEntries] = useState<ProposedEntry[]>(proposedEntries);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateData(idx: number, key: string, value: unknown) {
    setEntries((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, data: { ...e.data, [key]: value } } : e))
    );
  }

  function removeEntry(idx: number) {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      const payload = entries.map((e) => ({
        clientEntryId: e.clientEntryId,
        entryType: e.entryType,
        data: e.data,
      }));
      const res = await voiceService.confirmDraft(draftId, payload);
      onConfirmed(res.created.length);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "Could not save entries.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (entries.length === 0) {
    return (
      <Card className="p-5">
        <p className="text-sm text-muted">No entries were detected in your recording.</p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 rounded-lg border border-border px-4 py-2 text-sm text-fg hover:bg-surface-2"
        >
          Try again
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {transcript && (
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Transcript</p>
          <p className="mt-1 text-sm text-fg">{transcript}</p>
        </Card>
      )}

      {entries.map((entry, idx) => {
        const visual = ENTRY_VISUALS[entry.entryType as EntryType];
        return (
          <Card key={entry.clientEntryId} className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${visual.avatar}`}
                  aria-hidden
                >
                  {visual.icon}
                </span>
                <span className="text-sm font-medium text-fg">{visual.label}</span>
                <span className="text-xs text-muted">
                  {(entry.confidence * 100).toFixed(0)}% confident
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeEntry(idx)}
                className="text-xs text-danger hover:brightness-110"
              >
                Remove
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <EntryFields entry={entry} idx={idx} onChange={updateData} />
            </div>

            {entry.warnings.length > 0 && (
              <ul className="mt-3 list-disc pl-5 text-xs text-warning">
                {entry.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
            {entry.missingFields.length > 0 && (
              <p className="mt-2 text-xs text-muted">
                Please confirm: {entry.missingFields.join(", ")}
              </p>
            )}
          </Card>
        );
      })}

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting
            ? "Saving..."
            : `Save ${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-border px-4 py-2 text-sm text-fg hover:bg-surface-2"
        >
          Discard
        </button>
      </div>
    </div>
  );
}

function textVal(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function EntryFields({
  entry,
  idx,
  onChange,
}: {
  entry: ProposedEntry;
  idx: number;
  onChange: (idx: number, key: string, value: unknown) => void;
}) {
  const d = entry.data;

  if (entry.entryType === "symptom") {
    return (
      <>
        <Field label="Symptom">
          <input
            className={inputCls}
            value={textVal(d.symptomName)}
            onChange={(e) => onChange(idx, "symptomName", e.target.value)}
          />
        </Field>
        <Field label="Severity (1-10)">
          <input
            type="number"
            min={1}
            max={10}
            className={inputCls}
            value={textVal(d.severity)}
            onChange={(e) =>
              onChange(idx, "severity", e.target.value === "" ? undefined : Number(e.target.value))
            }
          />
        </Field>
        <Field label="Notes">
          <input
            className={inputCls}
            value={textVal(d.notes)}
            onChange={(e) => onChange(idx, "notes", e.target.value)}
          />
        </Field>
      </>
    );
  }

  if (entry.entryType === "medication") {
    return (
      <>
        <Field label="Medication">
          <input
            className={inputCls}
            value={textVal(d.medicationName)}
            onChange={(e) => onChange(idx, "medicationName", e.target.value)}
          />
        </Field>
        <Field label="Dosage amount">
          <input
            type="number"
            step="0.01"
            className={inputCls}
            value={textVal(d.dosageAmount)}
            onChange={(e) =>
              onChange(idx, "dosageAmount", e.target.value === "" ? undefined : Number(e.target.value))
            }
          />
        </Field>
        <Field label="Dosage unit">
          <input
            className={inputCls}
            value={textVal(d.dosageUnit)}
            onChange={(e) => onChange(idx, "dosageUnit", e.target.value)}
          />
        </Field>
        <Field label="Schedule">
          <select
            className={inputCls}
            value={textVal(d.scheduleType)}
            onChange={(e) => onChange(idx, "scheduleType", e.target.value)}
          >
            <option value="">Select...</option>
            <option value="as-needed">As needed</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </Field>
      </>
    );
  }

  if (entry.entryType === "food") {
    const items = Array.isArray(d.items) ? (d.items as { description?: string }[]) : [];
    return (
      <>
        <Field label="Meal type">
          <select
            className={inputCls}
            value={textVal(d.mealType)}
            onChange={(e) => onChange(idx, "mealType", e.target.value)}
          >
            <option value="">Select...</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
            <option value="beverage">Beverage</option>
          </select>
        </Field>
        <Field label="Items (comma separated)">
          <input
            className={inputCls}
            value={items.map((it) => it.description ?? "").join(", ")}
            onChange={(e) =>
              onChange(
                idx,
                "items",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((description) => ({ description, tags: [] }))
              )
            }
          />
        </Field>
      </>
    );
  }

  // sleep
  const segments = Array.isArray(d.segments)
    ? (d.segments as { startTime?: string; endTime?: string }[])
    : [];
  const seg = segments[0] || {};
  return (
    <>
      <Field label="Sleep start (ISO)">
        <input
          className={inputCls}
          value={textVal(seg.startTime)}
          onChange={(e) =>
            onChange(idx, "segments", [{ startTime: e.target.value, endTime: seg.endTime || "" }])
          }
        />
      </Field>
      <Field label="Sleep end (ISO)">
        <input
          className={inputCls}
          value={textVal(seg.endTime)}
          onChange={(e) =>
            onChange(idx, "segments", [{ startTime: seg.startTime || "", endTime: e.target.value }])
          }
        />
      </Field>
      <Field label="Quality (1-10)">
        <input
          type="number"
          min={1}
          max={10}
          className={inputCls}
          value={textVal(d.qualityRating)}
          onChange={(e) =>
            onChange(idx, "qualityRating", e.target.value === "" ? undefined : Number(e.target.value))
          }
        />
      </Field>
    </>
  );
}
