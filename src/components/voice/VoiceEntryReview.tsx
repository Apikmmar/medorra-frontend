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

  function addEntry(entryType: EntryType) {
    setEntries((prev) => [
      ...prev,
      {
        clientEntryId: newId(),
        entryType,
        data: {},
        confidence: 1,
        missingFields: [],
        warnings: [],
      },
    ]);
  }

  async function handleConfirm() {
    if (entries.some(hasFutureEventTime)) {
      setError("One or more entries have a future date/time. Please correct it before saving.");
      return;
    }

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

  return (
    <div className="space-y-4">
      {transcript && (
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Transcript</p>
          <p className="mt-1 text-sm text-fg">{transcript}</p>
        </Card>
      )}

      {entries.length === 0 && (
        <Card className="p-5">
          <p className="text-sm text-muted">
            No entries were detected. You can add one manually below.
          </p>
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

      <div className="rounded-xl border border-dashed border-border p-4">
        <p className="mb-2 text-xs font-medium text-muted">Add an entry</p>
        <div className="flex flex-wrap gap-2">
          {(["symptom", "medication", "food", "sleep"] as EntryType[]).map((type) => {
            const v = ENTRY_VISUALS[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => addEntry(type)}
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-fg transition-colors hover:border-border-strong hover:bg-surface-2 disabled:opacity-50"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md ${v.avatar}`}
                  aria-hidden
                >
                  {v.icon}
                </span>
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting || entries.length === 0}
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

/** True if the entry's event time is in the future (5-minute tolerance). */
function hasFutureEventTime(entry: ProposedEntry): boolean {
  const tolerance = 5 * 60 * 1000;
  const now = Date.now();

  const candidates: unknown[] = [];
  if (entry.entryType === "sleep") {
    const segments = Array.isArray(entry.data.segments)
      ? (entry.data.segments as { startTime?: string; endTime?: string }[])
      : [];
    for (const seg of segments) {
      candidates.push(seg.startTime, seg.endTime);
    }
  } else {
    candidates.push(entry.data.timestamp);
  }

  return candidates.some((c) => {
    if (typeof c !== "string" || !c) return false;
    const t = new Date(c).getTime();
    return !Number.isNaN(t) && t > now + tolerance;
  });
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function textVal(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

/** Clamp a raw input string to an integer within [min, max]; empty stays undefined. */
function clampInt(raw: string, min: number, max: number): number | undefined {
  if (raw === "") return undefined;
  const n = Math.round(Number(raw));
  if (Number.isNaN(n)) return undefined;
  return Math.min(max, Math.max(min, n));
}

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none";

/** ISO8601 (with offset) -> value for a datetime-local input, in the browser's local time. */
function isoToLocalInput(iso: unknown): string {
  if (typeof iso !== "string" || !iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/** datetime-local value -> ISO8601 string; empty stays undefined. */
function localInputToIso(local: string): string | undefined {
  if (!local) return undefined;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function WhenField({
  idx,
  value,
  onChange,
}: {
  idx: number;
  value: unknown;
  onChange: (idx: number, key: string, value: unknown) => void;
}) {
  return (
    <Field label="Date & time">
      <input
        type="datetime-local"
        className={inputCls}
        value={isoToLocalInput(value)}
        onChange={(e) => onChange(idx, "timestamp", localInputToIso(e.target.value))}
      />
    </Field>
  );
}

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
            step={1}
            className={inputCls}
            value={textVal(d.severity)}
            onChange={(e) => onChange(idx, "severity", clampInt(e.target.value, 1, 10))}
          />
        </Field>
        <WhenField idx={idx} value={d.timestamp} onChange={onChange} />
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
        <WhenField idx={idx} value={d.timestamp} onChange={onChange} />
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
        <WhenField idx={idx} value={d.timestamp} onChange={onChange} />
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
          step={1}
          className={inputCls}
          value={textVal(d.qualityRating)}
          onChange={(e) => onChange(idx, "qualityRating", clampInt(e.target.value, 1, 10))}
        />
      </Field>
    </>
  );
}
