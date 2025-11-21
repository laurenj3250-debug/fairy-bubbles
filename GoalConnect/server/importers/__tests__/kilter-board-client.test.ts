import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Import the client (will be implemented)
import {
  KilterBoardClient,
  KilterBoardError,
  type KilterLoginResponse,
  type KilterSyncResponse,
} from "../kilter-board-client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturesPath = path.join(__dirname, "fixtures");

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("KilterBoardClient", () => {
  let client: KilterBoardClient;
  let loginResponse: any;
  let syncResponse: any;

  beforeEach(() => {
    client = new KilterBoardClient();
    loginResponse = JSON.parse(
      fs.readFileSync(path.join(fixturesPath, "kilter-login-response.json"), "utf-8")
    );
    syncResponse = JSON.parse(
      fs.readFileSync(path.join(fixturesPath, "kilter-sync-response.json"), "utf-8")
    );
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("should authenticate and return login data", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => loginResponse,
      });

      const result = await client.login("test@example.com", "password123");

      expect(result.token).toBe(loginResponse.login.token);
      expect(result.userId).toBe(loginResponse.login.user_id);
      expect(result.username).toBe(loginResponse.login.username);
    });

    it("should call correct endpoint with credentials", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => loginResponse,
      });

      await client.login("test@example.com", "password123");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.kilterboardapp.com/v1/logins",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            username: "test@example.com",
            password: "password123",
            tou: true,
            pp: true,
          }),
        })
      );
    });

    it("should throw error for invalid credentials", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ error: "Invalid credentials" }),
      });

      await expect(client.login("wrong@example.com", "wrongpass")).rejects.toThrow(
        KilterBoardError
      );
    });

    it("should throw error for network failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(client.login("test@example.com", "password123")).rejects.toThrow(
        "Network error"
      );
    });

    it("should handle rate limiting", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        json: async () => ({ error: "Rate limit exceeded" }),
      });

      await expect(client.login("test@example.com", "password123")).rejects.toThrow(
        KilterBoardError
      );
    });
  });

  describe("sync", () => {
    it("should fetch sync data with token", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => syncResponse,
      });

      const token = "test-token";
      const result = await client.sync(token);

      expect(result.ascents).toBeDefined();
      expect(result.attempts).toBeDefined();
      expect(result.climbs).toBeDefined();
    });

    it("should include authorization header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => syncResponse,
      });

      const token = "test-bearer-token";
      await client.sync(token);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.kilterboardapp.com/v1/sync",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        })
      );
    });

    it("should pass table timestamps for incremental sync", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => syncResponse,
      });

      const token = "test-token";
      const sinceDate = new Date("2025-11-20T00:00:00Z");
      await client.sync(token, { since: sinceDate });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining("2025-11-20"),
        })
      );
    });

    it("should throw error for expired token", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ error: "Token expired" }),
      });

      await expect(client.sync("expired-token")).rejects.toThrow(KilterBoardError);
    });

    it("should extract data from PUT response format", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => syncResponse,
      });

      const result = await client.sync("valid-token");

      expect(result.climbs).toEqual(syncResponse.PUT.climbs);
      expect(result.ascents).toEqual(syncResponse.PUT.ascents);
      expect(result.attempts).toEqual(syncResponse.PUT.attempts);
    });
  });

  describe("getUserClimbingData", () => {
    it("should filter ascents and attempts by user ID", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => syncResponse,
      });

      const result = await client.getUserClimbingData("valid-token", 67890);

      expect(result.ascents.every((a) => a.user_id === 67890)).toBe(true);
      expect(result.attempts.every((a) => a.user_id === 67890)).toBe(true);
    });

    it("should include climb metadata for user's climbs", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => syncResponse,
      });

      const result = await client.getUserClimbingData("valid-token", 67890);

      expect(result.climbs.length).toBeGreaterThan(0);
    });

    it("should return empty arrays for user with no data", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => syncResponse,
      });

      const result = await client.getUserClimbingData("valid-token", 99999);

      expect(result.ascents).toEqual([]);
      expect(result.attempts).toEqual([]);
    });
  });

  describe("validateToken", () => {
    it("should return true for valid token", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true }),
      });

      const isValid = await client.validateToken("valid-token");
      expect(isValid).toBe(true);
    });

    it("should return false for expired token", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const isValid = await client.validateToken("expired-token");
      expect(isValid).toBe(false);
    });
  });

  describe("error handling", () => {
    it("should include status code in error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({ error: "Server error" }),
      });

      try {
        await client.login("test@example.com", "password");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(KilterBoardError);
        expect((error as KilterBoardError).statusCode).toBe(500);
      }
    });

    it("should not expose credentials in error messages", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ error: "Invalid credentials" }),
      });

      try {
        await client.login("secret@email.com", "secretpassword");
        expect.fail("Should have thrown");
      } catch (error) {
        const errorMessage = (error as Error).message;
        expect(errorMessage).not.toContain("secret@email.com");
        expect(errorMessage).not.toContain("secretpassword");
      }
    });
  });

  describe("API response parsing", () => {
    it("should handle missing PUT key gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // Empty response
      });

      const result = await client.sync("valid-token");

      expect(result.climbs).toEqual([]);
      expect(result.ascents).toEqual([]);
      expect(result.attempts).toEqual([]);
    });

    it("should handle partially missing data", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          PUT: {
            climbs: syncResponse.PUT.climbs,
            // Missing ascents and attempts
          },
        }),
      });

      const result = await client.sync("valid-token");

      expect(result.climbs).toEqual(syncResponse.PUT.climbs);
      expect(result.ascents).toEqual([]);
      expect(result.attempts).toEqual([]);
    });
  });
});

describe("KilterBoardError", () => {
  it("should be an instance of Error", () => {
    const error = new KilterBoardError("Test error", 401);
    expect(error).toBeInstanceOf(Error);
  });

  it("should have correct name", () => {
    const error = new KilterBoardError("Test error", 401);
    expect(error.name).toBe("KilterBoardError");
  });

  it("should include status code", () => {
    const error = new KilterBoardError("Test error", 403);
    expect(error.statusCode).toBe(403);
  });
});
