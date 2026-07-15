import { InsightsPanel } from "@/components/insights";

export default function InsightsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-fg">Insights</h1>
        <p className="mt-1 text-sm text-muted">
          AI-detected patterns and correlations in your health data.
        </p>
      </div>
      <InsightsPanel />
    </div>
  );
}
