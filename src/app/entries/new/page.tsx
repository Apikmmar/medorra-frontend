"use client";

import { useState } from "react";
import {
  SymptomEntryForm,
  MedicationEntryForm,
  FoodEntryForm,
  SleepEntryForm,
} from "@/components/entries";

const ENTRY_TYPES = [
  { id: "symptom", label: "Symptom" },
  { id: "medication", label: "Medication" },
  { id: "food", label: "Food" },
  { id: "sleep", label: "Sleep" },
] as const;

type EntryType = (typeof ENTRY_TYPES)[number]["id"];

export default function NewEntryPage() {
  const [selectedType, setSelectedType] = useState<EntryType>("symptom");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleSuccess() {
    setSuccessMessage(`${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} entry logged successfully!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Log Entry</h1>
      <p className="mt-1 text-gray-600">
        Record a new diary entry.
      </p>

      {successMessage && (
        <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700" role="status">
          {successMessage}
        </div>
      )}

      {/* Entry type selector */}
      <div className="mt-6 flex gap-2 flex-wrap">
        {ENTRY_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => setSelectedType(type.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedType === type.id
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Entry form */}
      <div className="mt-6">
        {selectedType === "symptom" && <SymptomEntryForm onSuccess={handleSuccess} />}
        {selectedType === "medication" && <MedicationEntryForm onSuccess={handleSuccess} />}
        {selectedType === "food" && <FoodEntryForm onSuccess={handleSuccess} />}
        {selectedType === "sleep" && <SleepEntryForm onSuccess={handleSuccess} />}
      </div>
    </div>
  );
}
