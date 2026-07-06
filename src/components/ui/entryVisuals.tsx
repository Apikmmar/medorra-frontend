import { ReactNode } from "react";

export type EntryType = "symptom" | "medication" | "food" | "sleep";

function SymptomIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M3 12h4l2 5 4-10 2 5h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MedicationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <rect
        x="3"
        y="8"
        width="18"
        height="8"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FoodIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M5 3v7a2 2 0 002 2h0V3M9 3v18M15 3c-1.5 0-2 3-2 5s.5 3 2 3 2-1 2-3-.5-5-2-5zm2 8v10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SleepIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M20 14.5A8 8 0 019.5 4a7 7 0 100 16 8 8 0 0010.5-5.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface EntryVisual {
  label: string;
  icon: ReactNode;
  /** Icon avatar background + text. */
  avatar: string;
  /** Small badge background + text. */
  badge: string;
  /** Solid accent (buttons/dots). */
  accent: string;
}

export const ENTRY_VISUALS: Record<EntryType, EntryVisual> = {
  symptom: {
    label: "Symptom",
    icon: <SymptomIcon />,
    avatar: "bg-rose-500/10 text-rose-400",
    badge: "bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-500/20",
    accent: "bg-rose-500",
  },
  medication: {
    label: "Medication",
    icon: <MedicationIcon />,
    avatar: "bg-sky-500/10 text-sky-400",
    badge: "bg-sky-500/10 text-sky-300 ring-1 ring-inset ring-sky-500/20",
    accent: "bg-sky-500",
  },
  food: {
    label: "Food",
    icon: <FoodIcon />,
    avatar: "bg-emerald-500/10 text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/20",
    accent: "bg-emerald-500",
  },
  sleep: {
    label: "Sleep",
    icon: <SleepIcon />,
    avatar: "bg-violet-500/10 text-violet-400",
    badge: "bg-violet-500/10 text-violet-300 ring-1 ring-inset ring-violet-500/20",
    accent: "bg-violet-500",
  },
};

export function getEntryVisual(type: string): EntryVisual {
  return ENTRY_VISUALS[type as EntryType] ?? ENTRY_VISUALS.symptom;
}
