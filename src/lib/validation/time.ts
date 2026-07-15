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

/** Value for a datetime-local `max` attribute set to the current local time. */
export function nowLocalInputValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
