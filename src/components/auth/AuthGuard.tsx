"use client";

/**
 * Auth guard: redirects unauthenticated users to login page.
 * Shows a loading spinner while auth state is being determined.
 */

import { useAuth } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, isSessionExpired } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) return;

    // Skip guard for auth pages and the public landing page ("/")
    if (pathname?.startsWith("/auth")) return;
    if (pathname === "/") return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // While loading, show spinner
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
      </div>
    );
  }

  // If on an auth page, render without guard
  if (pathname?.startsWith("/auth")) {
    return <>{children}</>;
  }

  // If not authenticated, show nothing (will redirect)
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
      </div>
    );
  }

  // Session expired banner
  if (isSessionExpired) {
    router.replace("/auth/login");
    return null;
  }

  return <>{children}</>;
}
