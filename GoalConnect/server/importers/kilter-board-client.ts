/**
 * Kilter Board API Client
 *
 * Handles authentication and data synchronization with the Kilter Board API.
 * Uses the reverse-engineered API endpoints from the community (BoardLib).
 * @see https://github.com/lemeryfertitta/BoardLib
 */

import type { KilterAscent, KilterAttempt, KilterClimb } from "./kilter-board-parser";

const KILTER_API_BASE = "https://kilterboardapp.com";

// API response types
export interface KilterLoginResponse {
  token: string;
  userId: number;
  username: string;
  expiresAt: Date;
}

export interface KilterSyncResponse {
  climbs: KilterClimb[];
  ascents: KilterAscent[];
  attempts: KilterAttempt[];
}

export interface KilterSyncOptions {
  since?: Date;
  tables?: {
    ascents?: string;
    attempts?: string;
    climbs?: string;
  };
}

/**
 * Custom error class for Kilter Board API errors
 */
export class KilterBoardError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "KilterBoardError";
    this.statusCode = statusCode;
  }
}

/**
 * Kilter Board API client for authentication and data sync
 */
export class KilterBoardClient {
  private baseUrl: string;

  constructor(baseUrl: string = KILTER_API_BASE) {
    this.baseUrl = baseUrl;
  }

  /**
   * Authenticate with Kilter Board and get access token
   */
  async login(username: string, password: string): Promise<KilterLoginResponse> {
    const response = await fetch(`${this.baseUrl}/sessions`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Connection": "keep-alive",
        "Accept-Language": "en-AU,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "User-Agent": "Kilter%20Board/202 CFNetwork/1568.100.1 Darwin/24.0.0",
      },
      body: JSON.stringify({
        username,
        password,
        tou: "accepted", // Terms of use acceptance
        pp: "accepted", // Privacy policy acceptance
        ua: "app", // User agent type
      }),
    });

    if (response.status === 422) {
      throw new KilterBoardError(
        "Invalid username or password. Please check your credentials and try again.",
        response.status
      );
    }

    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      throw new KilterBoardError(
        errorData.message || "Login failed",
        response.status
      );
    }

    const data = await response.json();
    // Handle both "session" (BoardLib style) and "login" (v1 API) response formats
    const session = data.session || data.login;

    if (!session || !session.token) {
      throw new KilterBoardError("Invalid login response - no token received", 500);
    }

    return {
      token: session.token,
      userId: session.user_id,
      username: session.username,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
    };
  }

  /**
   * Sync data from Kilter Board API
   * Uses URL-encoded form data and cookie-based auth as per BoardLib implementation
   */
  async sync(
    token: string,
    options: KilterSyncOptions = {}
  ): Promise<KilterSyncResponse> {
    const BASE_SYNC_DATE = "1970-01-01 00:00:00.000000";
    const tables: Record<string, string> = {};

    if (options.since) {
      const sinceStr = options.since.toISOString().replace("T", " ").replace("Z", "");
      tables.ascents = sinceStr;
      tables.bids = sinceStr; // "bids" is the API name for attempts
      tables.climbs = "2020-01-01 00:00:00.000000"; // Climbs rarely change
    } else if (options.tables) {
      if (options.tables.ascents) tables.ascents = options.tables.ascents;
      if (options.tables.attempts) tables.bids = options.tables.attempts;
      if (options.tables.climbs) tables.climbs = options.tables.climbs;
    } else {
      // Default: sync everything from the beginning
      tables.ascents = BASE_SYNC_DATE;
      tables.bids = BASE_SYNC_DATE;
      tables.climbs = BASE_SYNC_DATE;
    }

    const allClimbs: KilterClimb[] = [];
    const allAscents: KilterAscent[] = [];
    const allAttempts: KilterAttempt[] = [];

    let complete = false;
    let pageCount = 0;
    // Kilter API returns all shared climbs first (can be 200+ pages), then user data last
    // Must paginate through all pages to get user's ascents/bids
    const maxPages = 250;
    const currentTables = { ...tables };

    while (!complete && pageCount < maxPages) {
      // Build URL-encoded form data
      const payload = Object.entries(currentTables)
        .map(([table, syncDate]) =>
          `${encodeURIComponent(table)}=${encodeURIComponent(syncDate)}`
        )
        .join("&");

      const response = await fetch(`${this.baseUrl}/sync`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Kilter%20Board/202 CFNetwork/1568.100.1 Darwin/24.0.0",
          "Cookie": `token=${token}`,
        },
        body: payload,
      });

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new KilterBoardError(
          errorData.message || "Sync failed",
          response.status
        );
      }

      const data = await response.json();
      complete = data._complete === true;

      // Handle both wrapped (PUT) and unwrapped response formats
      const responseData = data.PUT || data;

      // Collect data from this page
      if (responseData.climbs) allClimbs.push(...responseData.climbs);
      if (responseData.ascents) allAscents.push(...responseData.ascents);
      // API calls attempts "bids" or "attempts"
      if (responseData.bids) allAttempts.push(...responseData.bids);
      if (responseData.attempts) allAttempts.push(...responseData.attempts);

      // Update sync dates for pagination
      for (const sync of [...(data.user_syncs || []), ...(data.shared_syncs || [])]) {
        const tableName = sync.table_name;
        const lastSync = sync.last_synchronized_at;
        if (tableName && lastSync && currentTables[tableName]) {
          currentTables[tableName] = lastSync;
        }
      }

      pageCount++;
    }

    return {
      climbs: allClimbs,
      ascents: allAscents,
      attempts: allAttempts,
    };
  }

  /**
   * Get climbing data filtered by user ID
   */
  async getUserClimbingData(
    token: string,
    userId: number,
    options: KilterSyncOptions = {}
  ): Promise<KilterSyncResponse> {
    const syncData = await this.sync(token, options);

    // Filter ascents and attempts to only this user
    const userAscents = syncData.ascents.filter((a) => a.user_id === userId);
    const userAttempts = syncData.attempts.filter((a) => a.user_id === userId);

    // Get climb UUIDs that the user has interacted with
    const climbUuids = new Set<string>();
    for (const ascent of userAscents) {
      climbUuids.add(ascent.climb_uuid);
    }
    for (const attempt of userAttempts) {
      climbUuids.add(attempt.climb_uuid);
    }

    // Filter climbs to only those the user has attempted
    const userClimbs = syncData.climbs.filter((c) => climbUuids.has(c.uuid));

    return {
      climbs: userClimbs,
      ascents: userAscents,
      attempts: userAttempts,
    };
  }

  /**
   * Validate if a token is still valid
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      // Try the explore endpoint to check token validity (lightweight)
      const response = await fetch(`${this.baseUrl}/explore`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "User-Agent": "Kilter%20Board/202 CFNetwork/1568.100.1 Darwin/24.0.0",
          "Cookie": `token=${token}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
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
        message: data.error || data.message || response.statusText,
      };
    } catch {
      return {
        message: response.statusText || "Unknown error",
      };
    }
  }
}

/**
 * Create a new Kilter Board client instance
 */
export function createKilterBoardClient(): KilterBoardClient {
  return new KilterBoardClient();
}
