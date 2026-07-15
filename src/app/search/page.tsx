import { SearchView } from "@/components/search";

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-fg">Search</h1>
        <p className="mt-1 text-sm text-muted">
          Find any entry across your symptoms, medications, food, and sleep.
        </p>
      </div>
      <SearchView />
    </div>
  );
}
