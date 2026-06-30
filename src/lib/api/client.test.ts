import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { apiClient, registerAuthHandlers, clearAuthHandlers, ApiClientError } from "./client";
import { tokenStorage } from "../auth/token-storage";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("apiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStorage.clearTokens();
    clearAuthHandlers();
  });

  afterEach(() => {
    clearAuthHandlers();
  });

  describe("token injection", () => {
    it("injects Authorization header when token is available", async () => {
      tokenStorage.setTokens({
        accessToken: "my-access-token",
        idToken: "my-id-token",
        refreshToken: "my-refresh-token",
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ entries: [] }),
      });

      await apiClient.get("/entries");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer my-id-token",
          }),
        })
      );
    });

    it("makes requests without Authorization when no token stored", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await apiClient.post("/auth/login", { email: "a@b.com", password: "pass" });

      const [, requestInit] = mockFetch.mock.calls[0];
      expect(requestInit.headers["Authorization"]).toBeUndefined();
    });
  });

  describe("HTTP methods", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });
    });

    it("GET uses correct method", async () => {
      await apiClient.get("/entries");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/entries"),
        expect.objectContaining({ method: "GET" })
      );
    });

    it("POST sends JSON body", async () => {
      const body = { symptomName: "headache", severity: 7 };
      await apiClient.post("/entries", body);

      const [, requestInit] = mockFetch.mock.calls[0];
      expect(requestInit.method).toBe("POST");
      expect(requestInit.body).toBe(JSON.stringify(body));
    });

    it("PUT sends JSON body", async () => {
      const body = { severity: 8 };
      await apiClient.put("/entries/123", body);

      const [, requestInit] = mockFetch.mock.calls[0];
      expect(requestInit.method).toBe("PUT");
      expect(requestInit.body).toBe(JSON.stringify(body));
    });

    it("DELETE uses correct method", async () => {
      await apiClient.delete("/entries/123");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/entries/123"),
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("error handling", () => {
    it("throws ApiClientError on non-2xx responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: "VALIDATION_ERROR",
            field: "severity",
            message: "Must be integer 1-10",
          }),
      });

      await expect(apiClient.post("/entries", {})).rejects.toThrow(ApiClientError);

      try {
        await apiClient.post("/entries", {});
      } catch (err) {
        // Second call also mocked
      }
    });

    it("includes error code, status, and field in ApiClientError", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: "VALIDATION_ERROR",
            field: "severity",
            message: "Must be integer 1-10",
          }),
      });

      try {
        await apiClient.post("/entries", {});
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApiClientError);
        expect(err.code).toBe("VALIDATION_ERROR");
        expect(err.status).toBe(400);
        expect(err.field).toBe("severity");
        expect(err.message).toBe("Must be integer 1-10");
      }
    });
  });

  describe("401 handling with token refresh", () => {
    it("attempts token refresh on 401 and retries the request", async () => {
      tokenStorage.setTokens({
        accessToken: "expired-token",
        idToken: "id-token",
        refreshToken: "refresh-token",
      });

      const mockRefresh = vi.fn().mockResolvedValue(true);
      const mockLogout = vi.fn();
      registerAuthHandlers(mockRefresh, mockLogout);

      // First call returns 401, second succeeds (after refresh)
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({ error: "TOKEN_EXPIRED" }) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ data: "success" }) });

      // Update token after refresh is called
      mockRefresh.mockImplementation(async () => {
        tokenStorage.setTokens({
          accessToken: "new-access-token",
          idToken: "id-token",
          refreshToken: "refresh-token",
        });
        return true;
      });

      const result = await apiClient.get("/entries");
      expect(result.data).toEqual("success");
      expect(mockRefresh).toHaveBeenCalledOnce();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("calls logout when refresh fails", async () => {
      tokenStorage.setTokens({
        accessToken: "expired-token",
        idToken: "id-token",
        refreshToken: "refresh-token",
      });

      const mockRefresh = vi.fn().mockResolvedValue(false);
      const mockLogout = vi.fn();
      registerAuthHandlers(mockRefresh, mockLogout);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "TOKEN_EXPIRED" }),
      });

      await expect(apiClient.get("/entries")).rejects.toThrow(ApiClientError);
      expect(mockLogout).toHaveBeenCalledOnce();
    });

    it("does not retry more than once on 401", async () => {
      tokenStorage.setTokens({
        accessToken: "expired-token",
        idToken: "id-token",
        refreshToken: "refresh-token",
      });

      const mockRefresh = vi.fn().mockResolvedValue(true);
      const mockLogout = vi.fn();
      registerAuthHandlers(mockRefresh, mockLogout);

      // Both calls return 401 (refresh succeeds but new token is also expired)
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({}) })
        .mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({}) });

      await expect(apiClient.get("/entries")).rejects.toThrow(ApiClientError);
      expect(mockRefresh).toHaveBeenCalledOnce();
      // Only retried once
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
