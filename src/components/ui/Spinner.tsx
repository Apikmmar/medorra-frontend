export interface SpinnerProps {
  className?: string;
  label?: string;
}

export function Spinner({ className = "h-8 w-8", label }: SpinnerProps) {
  return (
    <div
      className="flex items-center justify-center gap-3"
      role="status"
      aria-label={label ?? "Loading"}
    >
      <span
        className={`inline-block animate-spin rounded-full border-2 border-border border-t-accent ${className}`}
      />
      {label && <span className="text-sm text-muted">{label}</span>}
    </div>
  );
}
