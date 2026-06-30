"use client";

/**
 * AuthProvider React context.
 *
 * Manages JWT tokens (access, id, refresh), tracks user activity,
 * and automatically detects 15-minute inactivity to force re-authentication.
 *
 * Validates: Requirements 1.1 (registration), 9.7 (session timeout)
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { config } from "../config";
import { cognitoService } from "./cognito-service";
import { tokenStorage } from "./token-storage";
import {
  AuthContextValue,
  AuthState,
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
} from "./types";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"] as const;

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isSessionExpired: false,
  });

  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef<AuthUser | null>(null);

  // Keep userRef in sync with state
  useEffect(() => {
    userRef.current = state.user;
  }, [state.user]);

  /**
   * Reset the inactivity timer on user activity.
   */
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    tokenStorage.updateLastActivity();

    inactivityTimerRef.current = setTimeout(() => {
      // Session expired due to inactivity
      tokenStorage.clearTokens();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isSessionExpired: true,
      });
    }, config.session.inactivityTimeoutMs);
  }, []);

  /**
   * Start listening for user activity events.
   */
  const startActivityTracking = useCallback(() => {
    const handler = () => resetInactivityTimer();
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handler, { passive: true });
    });
    resetInactivityTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handler);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [resetInactivityTimer]);

  /**
   * Initialize auth state from stored tokens on mount.
   */
  useEffect(() => {
    const tokens = tokenStorage.getTokens();
    if (!tokens) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    // Check if the session has been inactive too long
    const lastActivity = tokenStorage.getLastActivity();
    if (lastActivity) {
      const elapsed = Date.now() - lastActivity;
      if (elapsed > config.session.inactivityTimeoutMs) {
        tokenStorage.clearTokens();
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isSessionExpired: true,
        });
        return;
      }
    }

    // Decode the ID token to get user info
    try {
      const payload = JSON.parse(atob(tokens.idToken.split(".")[1]));
      const user: AuthUser = {
        userId: payload.sub,
        email: payload.email,
      };
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        isSessionExpired: false,
      });
    } catch {
      // Token corrupted, clear it
      tokenStorage.clearTokens();
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  /**
   * Start/stop activity tracking when auth state changes.
   */
  useEffect(() => {
    if (state.isAuthenticated) {
      const cleanup = startActivityTracking();
      return cleanup;
    }
  }, [state.isAuthenticated, startActivityTracking]);

  /**
   * Log in with email and password.
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    const result = await cognitoService.login(credentials);
    tokenStorage.setTokens(result.tokens);
    tokenStorage.updateLastActivity();
    setState({
      user: result.user,
      isAuthenticated: true,
      isLoading: false,
      isSessionExpired: false,
    });
  }, []);

  /**
   * Register a new account.
   */
  const register = useCallback(async (credentials: RegisterCredentials): Promise<void> => {
    await cognitoService.register(credentials);
  }, []);

  /**
   * Log out the current user.
   */
  const logout = useCallback(() => {
    cognitoService.logout(userRef.current?.email);
    tokenStorage.clearTokens();
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isSessionExpired: false,
    });
  }, []);

  /**
   * Refresh the access token using the stored refresh token.
   * Returns true if refresh succeeded, false otherwise.
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    const tokens = tokenStorage.getTokens();
    const email = userRef.current?.email;
    if (!tokens || !email) return false;

    const newTokens = await cognitoService.refreshSession(
      tokens.refreshToken,
      email
    );

    if (newTokens) {
      // Preserve the existing refresh token (Cognito may not return a new one)
      tokenStorage.setTokens({
        ...newTokens,
        refreshToken: newTokens.refreshToken || tokens.refreshToken,
      });
      tokenStorage.updateLastActivity();
      return true;
    }

    // Refresh failed — force re-authentication
    tokenStorage.clearTokens();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isSessionExpired: true,
    });
    return false;
  }, []);

  const contextValue: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

/**
 * Hook to access auth context. Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
