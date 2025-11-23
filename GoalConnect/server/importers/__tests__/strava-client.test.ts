import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Import the client (will be implemented)
import {
  StravaClient,
  StravaError,
  type StravaTokenResponse,
  type StravaAthlete,
  type StravaActivity,
  type StravaAthleteStats,
} from "../strava-client";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Test fixtures
const mockTokenResponse: StravaTokenResponse = {
  access_token: "test-access-token",
  refresh_token: "test-refresh-token",
  expires_at: Math.floor(Date.now() / 1000) + 21600, // 6 hours from now
  expires_in: 21600,
  token_type: "Bearer",
  athlete: {
    id: 12345,
    username: "testathlete",
    firstname: "Test",
    lastname: "Athlete",
  },
};

const mockAthlete: StravaAthlete = {
  id: 12345,
  username: "testathlete",
  firstname: "Test",
  lastname: "Athlete",
  city: "San Francisco",
  state: "CA",
  country: "USA",
  profile: "https://example.com/profile.jpg",
  profile_medium: "https://example.com/profile_medium.jpg",
};

const mockActivity: StravaActivity = {
  id: 98765,
  name: "Morning Run",
  type: "Run",
  sport_type: "Run",
  start_date: "2025-11-20T07:30:00Z",
  start_date_local: "2025-11-19T23:30:00Z",
  timezone: "(GMT-08:00) America/Los_Angeles",
  moving_time: 3600,
  elapsed_time: 3900,
  distance: 10000,
  total_elevation_gain: 150,
  average_speed: 2.78,
  max_speed: 4.2,
  average_heartrate: 145,
  max_heartrate: 175,
  calories: 650,
  suffer_score: 85,
  pr_count: 2,
  achievement_count: 5,
};

const mockAthleteStats: StravaAthleteStats = {
  all_run_totals: {
    count: 250,
    distance: 2500000,
    moving_time: 900000,
    elapsed_time: 950000,
    elevation_gain: 25000,
  },
  all_ride_totals: {
    count: 100,
    distance: 5000000,
    moving_time: 600000,
    elapsed_time: 650000,
    elevation_gain: 50000,
  },
  all_swim_totals: {
    count: 50,
    distance: 75000,
    moving_time: 90000,
    elapsed_time: 95000,
    elevation_gain: 0,
  },
  ytd_run_totals: {
    count: 50,
    distance: 500000,
    moving_time: 180000,
    elapsed_time: 190000,
    elevation_gain: 5000,
  },
  ytd_ride_totals: {
    count: 20,
    distance: 1000000,
    moving_time: 120000,
    elapsed_time: 130000,
    elevation_gain: 10000,
  },
  ytd_swim_totals: {
    count: 10,
    distance: 15000,
    moving_time: 18000,
    elapsed_time: 19000,
    elevation_gain: 0,
  },
  recent_run_totals: {
    count: 10,
    distance: 100000,
    moving_time: 36000,
    elapsed_time: 38000,
    elevation_gain: 1000,
  },
  recent_ride_totals: {
    count: 4,
    distance: 200000,
    moving_time: 24000,
    elapsed_time: 26000,
    elevation_gain: 2000,
  },
  recent_swim_totals: {
    count: 2,
    distance: 3000,
    moving_time: 3600,
    elapsed_time: 3800,
    elevation_gain: 0,
  },
};

describe("StravaClient", () => {
  let client: StravaClient;

  beforeEach(() => {
    client = new StravaClient({
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
      redirectUri: "http://localhost:5001/api/import/strava/callback",
    });
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getAuthorizationUrl", () => {
    it("should generate correct authorization URL", () => {
      const url = client.getAuthorizationUrl("test-state");

      expect(url).toContain("https://www.strava.com/oauth/authorize");
      expect(url).toContain("client_id=test-client-id");
      expect(url).toContain("redirect_uri=");
      expect(url).toContain("response_type=code");
      expect(url).toContain("state=test-state");
    });

    it("should include requested scopes", () => {
      const url = client.getAuthorizationUrl("test-state", ["read", "activity:read_all"]);

      expect(url).toContain("scope=read%2Cactivity%3Aread_all");
    });

    it("should use default scopes if not specified", () => {
      const url = client.getAuthorizationUrl("test-state");

      expect(url).toContain("scope=");
    });
  });

  describe("exchangeCodeForTokens", () => {
    it("should exchange authorization code for tokens", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      const result = await client.exchangeCodeForTokens("test-auth-code");

      expect(result.access_token).toBe(mockTokenResponse.access_token);
      expect(result.refresh_token).toBe(mockTokenResponse.refresh_token);
      expect(result.athlete.id).toBe(mockTokenResponse.athlete.id);
    });

    it("should call token endpoint with correct parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      await client.exchangeCodeForTokens("test-auth-code");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://www.strava.com/oauth/token",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/x-www-form-urlencoded",
          }),
        })
      );
    });

    it("should throw error for invalid authorization code", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({ error: "invalid_grant" }),
      });

      await expect(client.exchangeCodeForTokens("invalid-code")).rejects.toThrow(
        StravaError
      );
    });
  });

  describe("refreshAccessToken", () => {
    it("should refresh expired access token", async () => {
      const newTokenResponse = {
        ...mockTokenResponse,
        access_token: "new-access-token",
        refresh_token: "new-refresh-token",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => newTokenResponse,
      });

      const result = await client.refreshAccessToken("old-refresh-token");

      expect(result.access_token).toBe("new-access-token");
      expect(result.refresh_token).toBe("new-refresh-token");
    });

    it("should call token endpoint with refresh_token grant type", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      await client.refreshAccessToken("test-refresh-token");

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://www.strava.com/oauth/token");
      expect(options.body).toContain("grant_type=refresh_token");
      expect(options.body).toContain("refresh_token=test-refresh-token");
    });

    it("should throw error for invalid refresh token", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ error: "invalid_token" }),
      });

      await expect(client.refreshAccessToken("invalid-token")).rejects.toThrow(
        StravaError
      );
    });
  });

  describe("getAthlete", () => {
    it("should fetch authenticated athlete profile", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAthlete,
      });

      const result = await client.getAthlete("test-access-token");

      expect(result.id).toBe(mockAthlete.id);
      expect(result.username).toBe(mockAthlete.username);
    });

    it("should include authorization header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAthlete,
      });

      await client.getAthlete("test-access-token");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://www.strava.com/api/v3/athlete",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-access-token",
          }),
        })
      );
    });

    it("should throw error for expired token", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ message: "Authorization Error" }),
      });

      await expect(client.getAthlete("expired-token")).rejects.toThrow(StravaError);
    });
  });

  describe("getAthleteStats", () => {
    it("should fetch athlete statistics", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAthleteStats,
      });

      const result = await client.getAthleteStats("test-token", 12345);

      expect(result.all_run_totals.count).toBe(250);
      expect(result.all_ride_totals.distance).toBe(5000000);
    });

    it("should call correct endpoint with athlete ID", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAthleteStats,
      });

      await client.getAthleteStats("test-token", 12345);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://www.strava.com/api/v3/athletes/12345/stats",
        expect.anything()
      );
    });
  });

  describe("getActivities", () => {
    it("should fetch list of activities", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockActivity],
      });

      const result = await client.getActivities("test-token");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockActivity.id);
      expect(result[0].name).toBe("Morning Run");
    });

    it("should support pagination parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockActivity],
      });

      await client.getActivities("test-token", { page: 2, perPage: 50 });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("page=2");
      expect(url).toContain("per_page=50");
    });

    it("should support after timestamp filter", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockActivity],
      });

      const afterDate = new Date("2025-11-01T00:00:00Z");
      await client.getActivities("test-token", { after: afterDate });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("after=");
    });

    it("should return empty array when no activities", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await client.getActivities("test-token");

      expect(result).toEqual([]);
    });
  });

  describe("getActivity", () => {
    it("should fetch single activity details", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockActivity,
      });

      const result = await client.getActivity("test-token", 98765);

      expect(result.id).toBe(98765);
      expect(result.type).toBe("Run");
    });

    it("should throw error for non-existent activity", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ message: "Activity not found" }),
      });

      await expect(client.getActivity("test-token", 99999)).rejects.toThrow(
        StravaError
      );
    });
  });

  describe("revokeAccess", () => {
    it("should deauthorize the application", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "revoked" }),
      });

      await client.revokeAccess("test-access-token");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://www.strava.com/oauth/deauthorize",
        expect.objectContaining({
          method: "POST",
        })
      );
    });
  });

  describe("rate limiting", () => {
    it("should handle rate limit exceeded error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        headers: new Headers({
          "X-RateLimit-Limit": "200,2000",
          "X-RateLimit-Usage": "200,1500",
        }),
        json: async () => ({ message: "Rate Limit Exceeded" }),
      });

      try {
        await client.getActivities("test-token");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(StravaError);
        expect((error as StravaError).statusCode).toBe(429);
      }
    });
  });

  describe("token validation", () => {
    it("should detect expired token from expires_at", () => {
      const expiredToken = {
        ...mockTokenResponse,
        expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };

      expect(client.isTokenExpired(expiredToken.expires_at)).toBe(true);
    });

    it("should detect valid token from expires_at", () => {
      const validToken = {
        ...mockTokenResponse,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };

      expect(client.isTokenExpired(validToken.expires_at)).toBe(false);
    });

    it("should consider token expired with small buffer", () => {
      // Token that expires in 30 seconds should be considered expired (with 60s buffer)
      const almostExpiredToken = {
        ...mockTokenResponse,
        expires_at: Math.floor(Date.now() / 1000) + 30,
      };

      expect(client.isTokenExpired(almostExpiredToken.expires_at, 60)).toBe(true);
    });
  });
});

describe("StravaError", () => {
  it("should be an instance of Error", () => {
    const error = new StravaError("Test error", 401);
    expect(error).toBeInstanceOf(Error);
  });

  it("should have correct name", () => {
    const error = new StravaError("Test error", 401);
    expect(error.name).toBe("StravaError");
  });

  it("should include status code", () => {
    const error = new StravaError("Test error", 403);
    expect(error.statusCode).toBe(403);
  });

  it("should include Strava-specific error details", () => {
    const error = new StravaError("Rate limit exceeded", 429, {
      rateLimitUsage: "200,1500",
      rateLimitLimit: "200,2000",
    });
    expect(error.details).toEqual({
      rateLimitUsage: "200,1500",
      rateLimitLimit: "200,2000",
    });
  });
});
