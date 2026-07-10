import { TrendsPanel } from "@/components/trends";

export default function TrendsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-fg">Trends</h1>
        <p className="mt-2 text-muted">
          Visualize how your symptoms, sleep, and logged entries have changed over time.
        </p>
      </div>
      <TrendsPanel />
    </div>
  );
}
