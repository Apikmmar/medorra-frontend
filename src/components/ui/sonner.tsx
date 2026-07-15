"use client";

import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * App-wide toast host. Themed to the dark surface tokens via CSS variables so
 * it matches the rest of the UI without a second theme system.
 */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface group-[.toaster]:text-fg group-[.toaster]:border-border group-[.toaster]:shadow-card-hover group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-muted",
          actionButton:
            "group-[.toast]:bg-accent group-[.toast]:text-accent-fg group-[.toast]:rounded-md",
          cancelButton:
            "group-[.toast]:bg-surface-2 group-[.toast]:text-muted group-[.toast]:rounded-md",
          success: "group-[.toaster]:text-success",
          error: "group-[.toaster]:text-danger",
        },
      }}
      style={
        {
          "--normal-bg": "rgb(var(--surface))",
          "--normal-text": "rgb(var(--fg))",
          "--normal-border": "rgb(var(--border))",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster, toast };
