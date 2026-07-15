import { Fragment, type ReactNode } from "react";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Wraps case-insensitive matches of `query` within `text` in a <mark>.
 * Returns the plain string when there's no query or no match.
 */
export function highlightMatch(text: string, query?: string): ReactNode {
  const q = query?.trim();
  if (!q) return text;

  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, "ig"));
  if (parts.length === 1) return text;

  const lower = q.toLowerCase();
  return parts.map((part, i) =>
    part.toLowerCase() === lower ? (
      <mark
        key={i}
        className="rounded bg-accent/25 px-0.5 text-fg"
      >
        {part}
      </mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}
