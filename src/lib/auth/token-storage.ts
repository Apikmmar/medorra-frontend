/**
 * Secure token storage using in-memory + sessionStorage.
 *
 * Tokens are kept in memory for active use and backed up to sessionStorage
 * so they survive page refreshes within the same browser tab/session.
 * They are NOT stored in localStorage to prevent XSS-based token theft
 * from persisting across sessions.
 */

import { AuthTokens } from "./types";

const SESSION_STORAGE_KEY = "medorra_auth_tokens";
const LAST_ACTIVITY_KEY = "medorra_last_activity";

/** In-memory token cache for fast access */
let inMemoryTokens: AuthTokens | null = null;

export const tokenStorage = {
  /**
   * Store tokens in memory and sessionStorage backup.
   */
  setTokens(tokens: AuthTokens): void {
    inMemoryTokens = { ...tokens };
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(tokens));
      }
    } catch {
      // sessionStorage may be unavailable (e.g., private browsing quota exceeded)
    }
  },

  /**
   * Retrieve tokens from in-memory cache, falling back to sessionStorage.
   */
  getTokens(): AuthTokens | null {
    if (inMemoryTokens) {
      return { ...inMemoryTokens };
    }

    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          const tokens = JSON.parse(stored) as AuthTokens;
          inMemoryTokens = tokens;
          return { ...tokens };
        }
      }
    } catch {
      // Corrupted data or unavailable storage
    }

    return null;
  },

  /**
   * Get just the access token for API calls.
   */
  getAccessToken(): string | null {
    const tokens = this.getTokens();
    return tokens?.idToken ?? null;
  },

  /**
   * Clear all stored tokens.
   */
  clearTokens(): void {
    inMemoryTokens = null;
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        sessionStorage.removeItem(LAST_ACTIVITY_KEY);
      }
    } catch {
      // Ignore storage errors on clear
    }
  },

  /**
   * Record the current timestamp as last activity.
   */
  updateLastActivity(): void {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      }
    } catch {
      // Ignore storage errors
    }
  },

  /**
   * Get the last recorded activity timestamp.
   */
  getLastActivity(): number | null {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        const stored = sessionStorage.getItem(LAST_ACTIVITY_KEY);
        return stored ? parseInt(stored, 10) : null;
      }
    } catch {
      // Ignore storage errors
    }
    return null;
  },
};
