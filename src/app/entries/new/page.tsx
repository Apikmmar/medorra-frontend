"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  SymptomEntryForm,
  MedicationEntryForm,
  FoodEntryForm,
  SleepEntryForm,
} from "@/components/entries";
import { VoiceRecorder, VoiceEntryReview } from "@/components/voice";
import type { VoiceDraft } from "@/lib/voice/voice-service";
import { Card, ENTRY_VISUALS, EntryType } from "@/components/ui";

const ENTRY_TYPES: EntryType[] = ["symptom", "medication", "food", "sleep"];

function isEntryType(value: string | null): value is EntryType {
  return value != null && (ENTRY_TYPES as string[]).includes(value);
}

function NewEntryContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type");

  const [selectedType, setSelectedType] = useState<EntryType>(
    isEntryType(initialType) ? initialType : "symptom"
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [voiceDraft, setVoiceDraft] = useState<VoiceDraft | null>(null);

  function handleSuccess() {
    const label = ENTRY_VISUALS[selectedType].label;
    setSuccessMessage(`${label} entry logged successfully!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  }

  function handleVoiceConfirmed(count: number) {
    setVoiceDraft(null);
    setSuccessMessage(`${count} ${count === 1 ? "entry" : "entries"} logged from voice!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-fg">Log Entry</h1>
      <p className="mt-1 text-sm text-muted">Record a new diary entry.</p>

      {successMessage && (
        <div
          className="mt-4 flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 p-3 text-sm text-success animate-fade-in"
          role="status"
        >
          <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.58l-1.3-1.3a1 1 0 10-1.4 1.42l2 2a1 1 0 001.4 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          {successMessage}
        </div>
      )}

      {voiceDraft ? (
        <div className="mt-6">
          <VoiceEntryReview
            draftId={voiceDraft.draftId}
            transcript={voiceDraft.transcript}
            proposedEntries={voiceDraft.proposedEntries}
            onConfirmed={handleVoiceConfirmed}
            onCancel={() => setVoiceDraft(null)}
          />
        </div>
      ) : (
        <>
          <div className="mt-6">
            <VoiceRecorder onDraftReady={setVoiceDraft} />
          </div>

          {/* Type selector */}
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ENTRY_TYPES.map((type) => {
              const v = ENTRY_VISUALS[type];
              const active = selectedType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  aria-pressed={active}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? "border-accent bg-accent/10 text-accent-text"
                      : "border-border bg-surface text-muted hover:border-border-strong hover:bg-surface-2"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${
                      active ? v.avatar : "bg-surface-2 text-faint"
                    }`}
                    aria-hidden="true"
                  >
                    {v.icon}
                  </span>
                  {v.label}
                </button>
              );
            })}
          </div>

          {/* Form */}
          <Card className="mt-6 p-5 sm:p-6 animate-fade-in">
            {selectedType === "symptom" && <SymptomEntryForm onSuccess={handleSuccess} />}
            {selectedType === "medication" && <MedicationEntryForm onSuccess={handleSuccess} />}
            {selectedType === "food" && <FoodEntryForm onSuccess={handleSuccess} />}
            {selectedType === "sleep" && <SleepEntryForm onSuccess={handleSuccess} />}
          </Card>
        </>
      )}
    </div>
  );
}

export default function NewEntryPage() {
  return (
    <Suspense fallback={null}>
      <NewEntryContent />
    </Suspense>
  );
}
