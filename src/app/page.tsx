"use client";

import { useAuth } from "@/lib/auth";
import { Dashboard } from "@/components/dashboard";
import { LandingPage } from "@/components/landing";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  // While auth state resolves, show a spinner to avoid flashing the
  // landing page at a user who is actually logged in.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
      </div>
    );
  }

  // Logged-in users get the dashboard; guests get the marketing landing page.
  return isAuthenticated ? <Dashboard /> : <LandingPage />;
}
