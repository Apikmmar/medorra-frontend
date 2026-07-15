"use client";

import { Toaster } from "@/components/ui";
import { useTheme } from "./ThemeProvider";

/** Sonner toaster that follows the active app theme. */
export function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  // Sonner only understands light/dark/system; banana is light-based chrome
  // (the token CSS vars still tint it yellow).
  const sonnerTheme = resolvedTheme === "dark" ? "dark" : "light";
  return <Toaster theme={sonnerTheme} />;
}
