export interface LogoProps {
  /** Show the "Medorra" wordmark next to the mark. */
  withWordmark?: boolean;
  className?: string;
}

export function Logo({ withWordmark = true, className = "" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M4 13h3l2 5 3-11 2.5 7L18 13h2"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {withWordmark && (
        <span className="text-lg font-bold tracking-tight text-gray-900">
          Medorra
        </span>
      )}
    </span>
  );
}
