import { describe, it, expect, beforeEach } from "vitest";
import { tokenStorage } from "./token-storage";
import { AuthTokens } from "./types";

const mockTokens: AuthTokens = {
  accessToken: "test-access-token",
  idToken: "test-id-token",
  refreshToken: "test-refresh-token",
};

describe("tokenStorage", () => {
  beforeEach(() => {
    tokenStorage.clearTokens();
    sessionStorage.clear();
  });

  describe("setTokens / getTokens", () => {
    it("stores and retrieves tokens", () => {
      tokenStorage.setTokens(mockTokens);
      const result = tokenStorage.getTokens();
      expect(result).toEqual(mockTokens);
    });

    it("returns a copy, not the original reference", () => {
      tokenStorage.setTokens(mockTokens);
      const result = tokenStorage.getTokens();
      expect(result).not.toBe(mockTokens);
    });

    it("persists to sessionStorage for page refresh recovery", () => {
      tokenStorage.setTokens(mockTokens);
      const stored = sessionStorage.getItem("medorra_auth_tokens");
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual(mockTokens);
    });

    it("recovers tokens from sessionStorage when in-memory cache is empty", () => {
      // Simulate: tokens stored, then page refreshed (in-memory cleared)
      sessionStorage.setItem("medorra_auth_tokens", JSON.stringify(mockTokens));
      // Clear in-memory by calling clearTokens then restoring sessionStorage
      tokenStorage.clearTokens();
      sessionStorage.setItem("medorra_auth_tokens", JSON.stringify(mockTokens));

      const result = tokenStorage.getTokens();
      expect(result).toEqual(mockTokens);
    });
  });

  describe("getAccessToken", () => {
    it("returns the access token when tokens are stored", () => {
      tokenStorage.setTokens(mockTokens);
      expect(tokenStorage.getAccessToken()).toBe("test-id-token");
    });

    it("returns null when no tokens are stored", () => {
      expect(tokenStorage.getAccessToken()).toBeNull();
    });
  });

  describe("clearTokens", () => {
    it("removes tokens from memory and sessionStorage", () => {
      tokenStorage.setTokens(mockTokens);
      tokenStorage.clearTokens();

      expect(tokenStorage.getTokens()).toBeNull();
      expect(sessionStorage.getItem("medorra_auth_tokens")).toBeNull();
    });
  });

  describe("activity tracking", () => {
    it("records and retrieves last activity timestamp", () => {
      const before = Date.now();
      tokenStorage.updateLastActivity();
      const after = Date.now();

      const lastActivity = tokenStorage.getLastActivity();
      expect(lastActivity).not.toBeNull();
      expect(lastActivity!).toBeGreaterThanOrEqual(before);
      expect(lastActivity!).toBeLessThanOrEqual(after);
    });

    it("returns null when no activity recorded", () => {
      expect(tokenStorage.getLastActivity()).toBeNull();
    });

    it("clears activity on clearTokens", () => {
      tokenStorage.updateLastActivity();
      tokenStorage.clearTokens();
      expect(tokenStorage.getLastActivity()).toBeNull();
    });
  });
});
