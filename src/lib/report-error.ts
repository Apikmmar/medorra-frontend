/**
 * Central client-side error sink. Today it logs to the console; swap the body
 * for a real reporter (Sentry, LogRocket, etc.) without touching call sites:
 *
 *   import * as Sentry from "@sentry/nextjs";
 *   Sentry.captureException(error, { extra: context });
 */
export function captureClientError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  if (typeof console !== "undefined") {
    // eslint-disable-next-line no-console
    console.error("[medorra] client error", error, context ?? {});
  }
}
