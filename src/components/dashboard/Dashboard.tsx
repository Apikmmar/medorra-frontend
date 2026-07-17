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

/** Staggered entrance: each item animates in slightly after the previous one. */
function stagger(index: number, base = 60): React.CSSProperties {
  return { animationDelay: `${index * base}ms`, animationFillMode: "both" };
}

export function Dashboard() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
      {/* Hero */}
      <section
        className="group/hero animate-slide-up relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-brand-800 to-brand-900 p-6 shadow-card transition-shadow duration-300 hover:shadow-card-hover motion-reduce:animate-none sm:p-8"
        style={stagger(0)}
      >
        {/* Decorative glow — drifts gently on hover */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl transition-transform duration-700 ease-out group-hover/hero:translate-x-4 group-hover/hero:translate-y-2 motion-reduce:transition-none"
          aria-hidden="true"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-brand-100 ring-1 ring-inset ring-white/15">
            <Sparkles className="h-3.5 w-3.5 animate-pulse motion-reduce:animate-none" />
            AI Symptom Diary
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-brand-100">
            Keep tracking your symptoms, medications, food, and sleep. The more
            you log, the sharper your insights get.
          </p>
          <Button
            asChild
            className="mt-5 transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transform-none"
          >
            <Link href="/entries/new">
              <Plus className="h-4 w-4 transition-transform duration-200 group-hover/hero:rotate-90 motion-reduce:transform-none" />
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
          {QUICK_LOG.map(({ type, description }, i) => {
            const v = ENTRY_VISUALS[type];
            return (
              <Link
                key={type}
                href={`/entries/new?type=${type}`}
                className="group animate-slide-up rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent/60 motion-reduce:animate-none"
                style={stagger(i + 1)}
              >
                <Card
                  interactive
                  className="flex h-full flex-col gap-3 p-4 motion-reduce:transform-none"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6 motion-reduce:transform-none ${v.avatar}`}
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
          {SHORTCUTS.map((s, i) => (
            <Link
              key={s.href}
              href={s.href}
              className="group animate-slide-up rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent/60 motion-reduce:animate-none"
              style={stagger(i + 1 + QUICK_LOG.length)}
            >
              <Card
                interactive
                className="flex items-center justify-between p-5 motion-reduce:transform-none"
              >
                <div>
                  <p className="text-base font-semibold text-fg">{s.title}</p>
                  <p className="mt-1 text-sm text-muted">{s.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 flex-shrink-0 text-faint transition-all duration-200 group-hover:translate-x-1 group-hover:text-accent-text motion-reduce:transform-none" />
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
