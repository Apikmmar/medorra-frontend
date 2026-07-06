import { InsightsPanel } from "@/components/insights";

export default function InsightsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-fg">Insights</h1>
        <p className="mt-2 text-muted">
          AI-detected patterns and correlations in your health data.
        </p>
      </div>
      <InsightsPanel />
    </div>
  );
}
