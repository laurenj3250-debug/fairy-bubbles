/**
 * Strava API Client
 *
 * Handles OAuth authentication and data synchronization with the Strava API v3.
 * @see https://developers.strava.com/docs/reference/
 */

const STRAVA_AUTH_BASE = "https://www.strava.com/oauth";
const STRAVA_API_BASE = "https://www.strava.com/api/v3";

// Default scopes for Strava OAuth - activity:read_all includes private activities
const DEFAULT_SCOPES = ["read", "activity:read_all", "profile:read_all"];

// ============================================================================
// Types
// ============================================================================

export interface StravaClientConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp in seconds
  expires_in: number; // Seconds until expiration
  token_type: string;
  athlete: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
  };
}

export interface StravaAthlete {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  city?: string;
  state?: string;
  country?: string;
  profile?: string;
  profile_medium?: string;
}

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  timezone: string;
  moving_time: number;
  elapsed_time: number;
  distance: number;
  total_elevation_gain?: number;
  average_speed?: number;
  max_speed?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
  suffer_score?: number;
  pr_count?: number;
  achievement_count?: number;
}

export interface StravaActivityTotals {
  count: number;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  elevation_gain: number;
}

export interface StravaAthleteStats {
  all_run_totals: StravaActivityTotals;
  all_ride_totals: StravaActivityTotals;
  all_swim_totals: StravaActivityTotals;
  ytd_run_totals: StravaActivityTotals;
  ytd_ride_totals: StravaActivityTotals;
  ytd_swim_totals: StravaActivityTotals;
  recent_run_totals: StravaActivityTotals;
  recent_ride_totals: StravaActivityTotals;
  recent_swim_totals: StravaActivityTotals;
}

export interface GetActivitiesOptions {
  page?: number;
  perPage?: number;
  before?: Date;
  after?: Date;
}

// ============================================================================
// Error Class
// ============================================================================

export class StravaError extends Error {
  public statusCode: number;
  public details?: Record<string, string>;

  constructor(
    message: string,
    statusCode: number,
    details?: Record<string, string>
  ) {
    super(message);
    this.name = "StravaError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ============================================================================
// Client Class
// ============================================================================

export class StravaClient {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(config: StravaClientConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
  }

  /**
   * Generate the Strava OAuth authorization URL
   */
  getAuthorizationUrl(state: string, scopes: string[] = DEFAULT_SCOPES): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      state: state,
      scope: scopes.join(","),
    });

    return `${STRAVA_AUTH_BASE}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  async exchangeCodeForTokens(code: string): Promise<StravaTokenResponse> {
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: code,
      grant_type: "authorization_code",
    });

    const response = await fetch(`${STRAVA_AUTH_BASE}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      throw new StravaError(
        errorData.message || "Failed to exchange authorization code",
        response.status
      );
    }

    return await response.json();
  }

  /**
   * Refresh an expired access token
   */
  async refreshAccessToken(
    refreshToken: string
  ): Promise<StravaTokenResponse> {
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    const response = await fetch(`${STRAVA_AUTH_BASE}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      throw new StravaError(
        errorData.message || "Failed to refresh access token",
        response.status
      );
    }

    return await response.json();
  }

  /**
   * Get the authenticated athlete's profile
   */
  async getAthlete(accessToken: string): Promise<StravaAthlete> {
    const response = await fetch(`${STRAVA_API_BASE}/athlete`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      throw new StravaError(
        errorData.message || "Failed to fetch athlete profile",
        response.status
      );
    }

    return await response.json();
  }

  /**
   * Get athlete statistics (totals for runs, rides, swims)
   */
  async getAthleteStats(
    accessToken: string,
    athleteId: number
  ): Promise<StravaAthleteStats> {
    const response = await fetch(
      `${STRAVA_API_BASE}/athletes/${athleteId}/stats`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      throw new StravaError(
        errorData.message || "Failed to fetch athlete stats",
        response.status
      );
    }

    return await response.json();
  }

  /**
   * Get list of activities for the authenticated athlete
   */
  async getActivities(
    accessToken: string,
    options: GetActivitiesOptions = {}
  ): Promise<StravaActivity[]> {
    const params = new URLSearchParams();

    if (options.page) {
      params.set("page", options.page.toString());
    }
    if (options.perPage) {
      params.set("per_page", options.perPage.toString());
    }
    if (options.before) {
      params.set("before", Math.floor(options.before.getTime() / 1000).toString());
    }
    if (options.after) {
      params.set("after", Math.floor(options.after.getTime() / 1000).toString());
    }

    const url = `${STRAVA_API_BASE}/athlete/activities${params.toString() ? `?${params.toString()}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      await this.handleApiError(response);
    }

    return await response.json();
  }

  /**
   * Get detailed information about a specific activity
   */
  async getActivity(
    accessToken: string,
    activityId: number
  ): Promise<StravaActivity> {
    const response = await fetch(
      `${STRAVA_API_BASE}/activities/${activityId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      throw new StravaError(
        errorData.message || "Failed to fetch activity",
        response.status
      );
    }

    return await response.json();
  }

  /**
   * Revoke access (deauthorize the application)
   */
  async revokeAccess(accessToken: string): Promise<void> {
    const response = await fetch(`${STRAVA_AUTH_BASE}/deauthorize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      throw new StravaError(
        errorData.message || "Failed to revoke access",
        response.status
      );
    }
  }

  /**
   * Check if a token is expired (with optional buffer)
   * @param expiresAt Unix timestamp in seconds
   * @param bufferSeconds Number of seconds before actual expiration to consider expired
   */
  isTokenExpired(expiresAt: number, bufferSeconds: number = 0): boolean {
    const now = Math.floor(Date.now() / 1000);
    return now >= expiresAt - bufferSeconds;
  }

  /**
   * Parse error response from API
   */
  private async parseErrorResponse(
    response: Response
  ): Promise<{ message: string }> {
    try {
      const data = await response.json();
      return {
        message: data.message || data.error || response.statusText,
      };
    } catch {
      return {
        message: response.statusText || "Unknown error",
      };
    }
  }

  /**
   * Handle API errors including rate limiting
   */
  private async handleApiError(response: Response): Promise<never> {
    const errorData = await this.parseErrorResponse(response);

    // Extract rate limit headers if present
    const rateLimitUsage = response.headers.get("X-RateLimit-Usage");
    const rateLimitLimit = response.headers.get("X-RateLimit-Limit");

    const details: Record<string, string> = {};
    if (rateLimitUsage) details.rateLimitUsage = rateLimitUsage;
    if (rateLimitLimit) details.rateLimitLimit = rateLimitLimit;

    throw new StravaError(
      errorData.message || "API request failed",
      response.status,
      Object.keys(details).length > 0 ? details : undefined
    );
  }
}

/**
 * Create a new Strava client instance
 */
export function createStravaClient(config: StravaClientConfig): StravaClient {
  return new StravaClient(config);
}
