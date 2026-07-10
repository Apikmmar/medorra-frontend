/** Formats an ISO date (YYYY-MM-DD) as a short local label, e.g. "Mar 4". */
export function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
