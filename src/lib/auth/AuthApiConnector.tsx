"use client";

/**
 * Bridge component that registers AuthProvider's refresh/logout handlers
 * with the API client so it can handle 401s automatically.
 */

import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { registerAuthHandlers, clearAuthHandlers } from "../api/client";

export function AuthApiConnector({ children }: { children: React.ReactNode }) {
  const { refreshToken, logout } = useAuth();

  useEffect(() => {
    registerAuthHandlers(refreshToken, logout);
    return () => clearAuthHandlers();
  }, [refreshToken, logout]);

  return <>{children}</>;
}
