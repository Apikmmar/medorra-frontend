import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Brain,
  LineChart,
  Mic,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/theme";
import { Button } from "@/components/ui";

const FEATURES = [
  {
    icon: Activity,
    title: "Log anything, fast",
    description:
      "Symptoms, medications, food, and sleep — captured in seconds so tracking never feels like a chore.",
  },
  {
    icon: Brain,
    title: "AI-detected patterns",
    description:
      "Medorra connects the dots across your entries to surface triggers and trends you'd otherwise miss.",
  },
  {
    icon: LineChart,
    title: "Insights that add up",
    description:
      "The more you log, the sharper your timeline and trends become — a clear picture of your health over time.",
  },
  {
    icon: Mic,
    title: "Voice-first entries",
    description:
      "Too tired to type? Just talk. Speak an entry and Medorra structures it for you automatically.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    description:
      "Your health data is yours. Secure authentication and offline support keep your diary in your hands.",
  },
  {
    icon: Sparkles,
    title: "Built for real life",
    description:
      "Works offline, installs like an app, and stays out of your way until you need it.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Log your day",
    description:
      "Record symptoms, doses, meals, and sleep with a couple of taps or your voice.",
  },
  {
    step: "2",
    title: "Let AI find patterns",
    description:
      "Medorra analyzes your entries and highlights correlations across your data.",
  },
  {
    step: "3",
    title: "Act on insights",
    description:
      "Review your timeline and trends to make better decisions with your care team.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-24 top-40 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-medium text-accent-text">
              <Sparkles className="h-3.5 w-3.5" />
              AI Symptom Diary
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Understand your health,
              <span className="bg-gradient-to-r from-brand-500 to-accent bg-clip-text text-transparent">
                {" "}
                one entry at a time
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
              Medorra turns everyday symptom, medication, food, and sleep logs
              into AI-powered insights — so you can spot patterns and take
              control of your health.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/auth/register">
                  Start your diary
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/auth/login">I already have an account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to track and understand
          </h2>
          <p className="mt-4 text-muted">
            Simple to log. Powerful to review. Designed to fit the way you
            actually live.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-surface p-6 shadow-card"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent-text">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How Medorra works
            </h2>
            <p className="mt-4 text-muted">
              Three steps from scattered notes to real understanding.
            </p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {STEPS.map(({ step, title, description }) => (
              <div key={step} className="text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white shadow-sm">
                  {step}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-brand-800 to-brand-900 p-10 text-center shadow-card sm:p-16">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Start understanding your health today
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-brand-100">
              It's free to begin. Log your first entry in under a minute.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/auth/register">
                Create your free account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-sm text-muted">
            © 2026 Medorra. Track smarter, live better.
          </p>
        </div>
      </footer>
    </div>
  );
}
