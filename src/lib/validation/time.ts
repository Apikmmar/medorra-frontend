/** Shared future-time guard, matching the backend's 5-minute tolerance. */
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

/**
 * True if the given value (ISO string or datetime-local value) is in the future
 * beyond a small tolerance. Empty/invalid values are treated as not-future.
 */
export function isFutureDateTime(value: string | undefined | null): boolean {
  if (!value) return false;
  const t = new Date(value).getTime();
  return !Number.isNaN(t) && t > Date.now() + FUTURE_TOLERANCE_MS;
}

/**
 * Convert a datetime-local input value (wall-clock local time, no offset) into
 * a UTC ISO-8601 string for the API. datetime-local values like
 * "2026-07-17T11:33" carry no timezone, so sending them raw makes the backend
 * read them as UTC and reject valid times as "in the future". Returns undefined
 * for empty/invalid input.
 */
export function localInputToIso(
  value: string | undefined | null
): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** Value for a datetime-local `max` attribute set to the current local time. */
export function nowLocalInputValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
