/**
 * API client with automatic JWT token injection and 401 handling.
 *
 * - Injects the access token in the Authorization header for every request.
 * - On 401 responses, attempts a token refresh and retries the request once.
 * - If refresh fails, redirects to login by clearing auth state.
 */

import { config } from "../config";
import { tokenStorage } from "../auth/token-storage";

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  ok: boolean;
}

export interface ApiError {
  error: string;
  message: string;
  field?: string;
  status: number;
}

/** Token refresh function injected at runtime to avoid circular deps */
let refreshTokenFn: (() => Promise<boolean>) | null = null;
/** Logout function injected at runtime */
let logoutFn: (() => void) | null = null;

/**
 * Register the auth functions for the API client to use on 401.
 * Called by AuthProvider on mount.
 */
export function registerAuthHandlers(
  refresh: () => Promise<boolean>,
  logout: () => void
): void {
  refreshTokenFn = refresh;
  logoutFn = logout;
}

/**
 * Clear registered auth handlers (on unmount/logout).
 */
export function clearAuthHandlers(): void {
  refreshTokenFn = null;
  logoutFn = null;
}

async function makeRequest<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false
): Promise<ApiResponse<T>> {
  const url = `${config.api.url}${path}`;
  const accessToken = tokenStorage.getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 - attempt token refresh
  if (response.status === 401 && !isRetry) {
    if (refreshTokenFn) {
      const refreshed = await refreshTokenFn();
      if (refreshed) {
        // Retry with new token
        return makeRequest<T>(path, options, true);
      }
    }
    // Refresh failed or not available — force logout
    if (logoutFn) {
      logoutFn();
    }
    throw new ApiClientError("Session expired, please re-authenticate", "TOKEN_EXPIRED", 401);
  }

  if (!response.ok) {
    let errorBody: any;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = { error: "UNKNOWN_ERROR", message: response.statusText };
    }
    throw new ApiClientError(
      errorBody.message || "Request failed",
      errorBody.error || "UNKNOWN_ERROR",
      response.status,
      errorBody.field
    );
  }

  const body = await response.json();
  // Backend wraps responses in { status, message, data } envelope — unwrap it
  const data = (body.data !== undefined ? body.data : body) as T;
  return { data, status: response.status, ok: true };
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public field?: string
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/**
 * API client methods for the Medorra backend.
 */
export const apiClient = {
  get<T>(path: string): Promise<ApiResponse<T>> {
    return makeRequest<T>(path, { method: "GET" });
  },

  post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return makeRequest<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return makeRequest<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string): Promise<ApiResponse<T>> {
    return makeRequest<T>(path, { method: "DELETE" });
  },
};
