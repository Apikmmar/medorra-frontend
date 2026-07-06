import { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a subtle hover elevation. Useful for clickable cards. */
  interactive?: boolean;
}

function cx(...classes: (string | false | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function Card({ interactive, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-gray-200/80 bg-white shadow-card",
        interactive &&
          "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
