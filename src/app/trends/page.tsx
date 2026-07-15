import { TrendsPanel } from "@/components/trends";

export default function TrendsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-fg">Trends</h1>
        <p className="mt-1 text-sm text-muted">
          Visualize how your symptoms, sleep, and logged entries have changed over time.
        </p>
      </div>
      <TrendsPanel />
    </div>
  );
}
