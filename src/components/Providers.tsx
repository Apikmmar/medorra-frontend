"use client";

/**
 * Root providers wrapper for all client-side context providers.
 * Used in the root layout to wrap the application.
 */

import { AuthProvider, AuthApiConnector } from "@/lib/auth";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthApiConnector>{children}</AuthApiConnector>
    </AuthProvider>
  );
}
