"use client";

/**
 * Root providers wrapper for all client-side context providers.
 * Used in the root layout to wrap the application.
 */

import { AuthProvider, AuthApiConnector } from "@/lib/auth";
import { OfflineProvider } from "@/lib/offline";
import { ThemeProvider } from "@/components/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthApiConnector>
          <OfflineProvider>{children}</OfflineProvider>
        </AuthApiConnector>
      </AuthProvider>
    </ThemeProvider>
  );
}
