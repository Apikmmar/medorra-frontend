import { cn } from "@/lib/utils";

/**
 * Loading placeholder. Uses a subtle shimmer over surface-2 so it reads on the
 * dark theme without flashing.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-surface-2",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer",
        "after:bg-gradient-to-r after:from-transparent after:via-white/5 after:to-transparent",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
