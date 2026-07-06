import Link from "next/link";
import { Card, ENTRY_VISUALS, EntryType } from "@/components/ui";

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
      <section className="animate-fade-in overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-brand-800 to-brand-900 p-6 shadow-card sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Welcome back
        </h1>
        <p className="mt-2 max-w-lg text-sm text-brand-100">
          Keep tracking your symptoms, medications, food, and sleep. The more you
          log, the sharper your insights get.
        </p>
        <Link
          href="/entries/new"
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg shadow-sm transition-colors hover:bg-accent-hover"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 5a.75.75 0 01.75.75v3.5h3.5a.75.75 0 010 1.5h-3.5v3.5a.75.75 0 01-1.5 0v-3.5h-3.5a.75.75 0 010-1.5h3.5v-3.5A.75.75 0 0110 5z" />
          </svg>
          Log an entry
        </Link>
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
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${v.avatar}`}
                    aria-hidden="true"
                  >
                    {v.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-fg">
                      {v.label}
                    </p>
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
                  <p className="text-base font-semibold text-fg">
                    {s.title}
                  </p>
                  <p className="mt-1 text-sm text-muted">{s.description}</p>
                </div>
                <svg
                  className="h-5 w-5 flex-shrink-0 text-faint transition-colors group-hover:text-accent-text"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 5.23a.75.75 0 011.06 0l4.25 4.24a.75.75 0 010 1.06l-4.25 4.24a.75.75 0 11-1.06-1.06L10.94 10 7.21 6.29a.75.75 0 010-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
