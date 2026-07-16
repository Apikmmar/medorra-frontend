"use client";

import { useEffect, useState } from "react";
import { Sparkles, Mic, LineChart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  ENTRY_VISUALS,
  type EntryType,
} from "@/components/ui";

/** Bump the suffix to re-show onboarding after a material change. */
const STORAGE_KEY = "medorra-onboarding-v1";

const ENTRY_ORDER: EntryType[] = ["symptom", "medication", "food", "sleep"];

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  body?: React.ReactNode;
}

const STEPS: Step[] = [
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "Welcome to Medorra",
    description:
      "Your private diary for symptoms, medications, food, and sleep — all in one place.",
  },
  {
    icon: <Mic className="h-6 w-6" />,
    title: "Logging takes seconds",
    description:
      "Tap Log, pick a type, and jot it down — or just speak and let voice capture do the rest.",
    body: (
      <div className="mt-4 grid grid-cols-2 gap-2">
        {ENTRY_ORDER.map((type) => {
          const v = ENTRY_VISUALS[type];
          return (
            <div
              key={type}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2"
            >
              <span
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${v.avatar}`}
                aria-hidden="true"
              >
                {v.icon}
              </span>
              <span className="text-sm font-medium text-fg">{v.label}</span>
            </div>
          );
        })}
      </div>
    ),
  },
  {
    icon: <LineChart className="h-6 w-6" />,
    title: "Insights unlock as you log",
    description:
      "After about two weeks of logging, Medorra's AI starts detecting patterns between your entries and symptoms. The more you log, the sharper they get.",
  },
];

function readCompleted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return true; // storage blocked — don't nag on every load
  }
}

function markCompleted() {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    /* ignore */
  }
}

/**
 * First-run guided tour. Shows once per device (localStorage-gated) for
 * authenticated users. Renders nothing after completion.
 */
export function OnboardingDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!readCompleted()) setOpen(true);
  }, []);

  const finish = () => {
    markCompleted();
    setOpen(false);
  };

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Closing by any means (X, Esc, backdrop) counts as done.
        if (!next) finish();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <span
            className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent-text"
            aria-hidden="true"
          >
            {current.icon}
          </span>
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription>{current.description}</DialogDescription>
        </DialogHeader>

        {current.body}

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-5 bg-accent" : "w-1.5 bg-border-strong"
              }`}
              aria-hidden="true"
            />
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={finish}>
              Skip
            </Button>
          )}

          {isLast ? (
            <Button onClick={finish}>Get started</Button>
          ) : (
            <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
