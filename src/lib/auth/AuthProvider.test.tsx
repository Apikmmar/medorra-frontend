import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { AuthProvider, useAuth } from "./AuthProvider";
import { tokenStorage } from "./token-storage";

// Mock the cognito service
vi.mock("./cognito-service", () => ({
  cognitoService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshSession: vi.fn(),
  },
  AuthError: class extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.code = code;
      this.name = "AuthError";
    }
  },
}));

import { cognitoService } from "./cognito-service";

// Helper component to access auth context in tests
function AuthConsumer({ onAuth }: { onAuth: (auth: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth();
  React.useEffect(() => {
    onAuth(auth);
  });
  return (
    <div>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="loading">{String(auth.isLoading)}</span>
      <span data-testid="expired">{String(auth.isSessionExpired)}</span>
      <span data-testid="email">{auth.user?.email || "none"}</span>
    </div>
  );
}

// Create a valid-looking JWT with email and sub claims
function createMockJwt(claims: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify(claims));
  return `${header}.${payload}.mock-signature`;
}

describe("AuthProvider", () => {
  let authRef: ReturnType<typeof useAuth>;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    tokenStorage.clearTokens();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderAuthProvider() {
    return render(
      <AuthProvider>
        <AuthConsumer onAuth={(auth) => { authRef = auth; }} />
      </AuthProvider>
    );
  }

  describe("initial state", () => {
    it("starts as not authenticated when no tokens stored", () => {
      renderAuthProvider();
      expect(screen.getByTestId("loading").textContent).toBe("false");
      expect(screen.getByTestId("authenticated").textContent).toBe("false");
    });

    it("restores session from stored tokens", () => {
      const idToken = createMockJwt({ sub: "user-123", email: "test@example.com" });
      tokenStorage.setTokens({
        accessToken: "access-token",
        idToken,
        refreshToken: "refresh-token",
      });
      tokenStorage.updateLastActivity();

      renderAuthProvider();
      expect(screen.getByTestId("loading").textContent).toBe("false");
      expect(screen.getByTestId("authenticated").textContent).toBe("true");
      expect(screen.getByTestId("email").textContent).toBe("test@example.com");
    });

    it("marks session expired if inactivity exceeds 15 minutes", () => {
      const idToken = createMockJwt({ sub: "user-123", email: "test@example.com" });
      tokenStorage.setTokens({
        accessToken: "access-token",
        idToken,
        refreshToken: "refresh-token",
      });
      // Set last activity to 16 minutes ago
      const sixteenMinutesAgo = Date.now() - 16 * 60 * 1000;
      sessionStorage.setItem("medorra_last_activity", sixteenMinutesAgo.toString());

      renderAuthProvider();
      expect(screen.getByTestId("loading").textContent).toBe("false");
      expect(screen.getByTestId("authenticated").textContent).toBe("false");
      expect(screen.getByTestId("expired").textContent).toBe("true");
    });
  });

  describe("login", () => {
    it("updates state on successful login", async () => {
      const idToken = createMockJwt({ sub: "user-456", email: "user@test.com" });
      vi.mocked(cognitoService.login).mockResolvedValue({
        tokens: { accessToken: "at", idToken, refreshToken: "rt" },
        user: { userId: "user-456", email: "user@test.com" },
      });

      renderAuthProvider();

      await act(async () => {
        await authRef.login({ email: "user@test.com", password: "Pass123!" });
      });

      expect(screen.getByTestId("authenticated").textContent).toBe("true");
      expect(screen.getByTestId("email").textContent).toBe("user@test.com");
    });

    it("throws error on failed login", async () => {
      vi.mocked(cognitoService.login).mockRejectedValue(
        new Error("Invalid email or password")
      );

      renderAuthProvider();

      let error: Error | undefined;
      await act(async () => {
        try {
          await authRef.login({ email: "bad@email.com", password: "wrong" });
        } catch (e: any) {
          error = e;
        }
      });

      expect(error?.message).toBe("Invalid email or password");
      expect(screen.getByTestId("authenticated").textContent).toBe("false");
    });
  });

  describe("logout", () => {
    it("clears auth state and tokens", async () => {
      const idToken = createMockJwt({ sub: "user-123", email: "test@example.com" });
      vi.mocked(cognitoService.login).mockResolvedValue({
        tokens: { accessToken: "at", idToken, refreshToken: "rt" },
        user: { userId: "user-123", email: "test@example.com" },
      });

      renderAuthProvider();

      await act(async () => {
        await authRef.login({ email: "test@example.com", password: "Pass123!" });
      });

      act(() => {
        authRef.logout();
      });

      expect(screen.getByTestId("authenticated").textContent).toBe("false");
      expect(tokenStorage.getTokens()).toBeNull();
    });
  });

  describe("inactivity timeout", () => {
    it("forces re-authentication after 15 minutes of inactivity", async () => {
      const idToken = createMockJwt({ sub: "user-123", email: "test@example.com" });
      vi.mocked(cognitoService.login).mockResolvedValue({
        tokens: { accessToken: "at", idToken, refreshToken: "rt" },
        user: { userId: "user-123", email: "test@example.com" },
      });

      renderAuthProvider();

      await act(async () => {
        await authRef.login({ email: "test@example.com", password: "Pass123!" });
      });

      expect(screen.getByTestId("authenticated").textContent).toBe("true");

      // Advance time by 15 minutes + 1ms
      act(() => {
        vi.advanceTimersByTime(15 * 60 * 1000 + 1);
      });

      expect(screen.getByTestId("authenticated").textContent).toBe("false");
      expect(screen.getByTestId("expired").textContent).toBe("true");
    });

    it("resets timer on user activity", async () => {
      const idToken = createMockJwt({ sub: "user-123", email: "test@example.com" });
      vi.mocked(cognitoService.login).mockResolvedValue({
        tokens: { accessToken: "at", idToken, refreshToken: "rt" },
        user: { userId: "user-123", email: "test@example.com" },
      });

      renderAuthProvider();

      await act(async () => {
        await authRef.login({ email: "test@example.com", password: "Pass123!" });
      });

      // Advance 10 minutes
      act(() => {
        vi.advanceTimersByTime(10 * 60 * 1000);
      });

      // Simulate user activity
      act(() => {
        document.dispatchEvent(new Event("mousedown"));
      });

      // Advance another 10 minutes (total 20 from login, but only 10 from last activity)
      act(() => {
        vi.advanceTimersByTime(10 * 60 * 1000);
      });

      // Should still be authenticated (only 10 min since last activity)
      expect(screen.getByTestId("authenticated").textContent).toBe("true");

      // Advance to 15 min from last activity
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000 + 1);
      });

      expect(screen.getByTestId("authenticated").textContent).toBe("false");
    });
  });

  describe("useAuth hook", () => {
    it("throws when used outside AuthProvider", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() => {
        render(<AuthConsumer onAuth={() => {}} />);
      }).toThrow("useAuth must be used within an AuthProvider");
      spy.mockRestore();
    });
  });
});
