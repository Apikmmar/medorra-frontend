import Link from "next/link";
import { ArrowRight, Plus, Sparkles } from "lucide-react";
import { Card, ENTRY_VISUALS, EntryType, Button } from "@/components/ui";

const QUICK_LOG: { type: EntryType; description: string }[] = [
  { type: "symptom", description: "Log how you're feeling" },
  { type: "medication", description: "Record a dose taken" },
  { type: "food", description: "Track a meal or snack" },
  { type: "sleep", description: "Log last night's sleep" },
];

const SHORTCUTS = [
  {
    href: "/timeline",
    title: "Timeline",
    description: "Browse and filter every entry you've logged.",
  },
  {
    href: "/insights",
    title: "Insights",
    description: "See AI-detected patterns across your health data.",
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Hero */}
      <section className="animate-fade-in relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-brand-800 to-brand-900 p-6 shadow-card sm:p-8">
        {/* Decorative glow */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-brand-100 ring-1 ring-inset ring-white/15">
            <Sparkles className="h-3.5 w-3.5" />
            AI Symptom Diary
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-2 max-w-lg text-sm text-brand-100">
            Keep tracking your symptoms, medications, food, and sleep. The more
            you log, the sharper your insights get.
          </p>
          <Button asChild className="mt-5">
            <Link href="/entries/new">
              <Plus className="h-4 w-4" />
              Log an entry
            </Link>
          </Button>
        </div>
      </section>

      {/* Quick log */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-faint">
          Quick log
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_LOG.map(({ type, description }) => {
            const v = ENTRY_VISUALS[type];
            return (
              <Link
                key={type}
                href={`/entries/new?type=${type}`}
                className="group"
              >
                <Card interactive className="flex h-full flex-col gap-3 p-4">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${v.avatar}`}
                    aria-hidden="true"
                  >
                    {v.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-fg">{v.label}</p>
                    <p className="mt-0.5 text-xs text-muted">{description}</p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Shortcuts */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-faint">
          Explore
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {SHORTCUTS.map((s) => (
            <Link key={s.href} href={s.href} className="group">
              <Card interactive className="flex items-center justify-between p-5">
                <div>
                  <p className="text-base font-semibold text-fg">{s.title}</p>
                  <p className="mt-1 text-sm text-muted">{s.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 flex-shrink-0 text-faint transition-all group-hover:translate-x-0.5 group-hover:text-accent-text" />
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
