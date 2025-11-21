/**
 * Kilter Board API Client
 *
 * Handles authentication and data synchronization with the Kilter Board API.
 * Uses the reverse-engineered API endpoints from the community.
 */

import type { KilterAscent, KilterAttempt, KilterClimb } from "./kilter-board-parser";

const KILTER_API_BASE = "https://api.kilterboardapp.com/v1";

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
    const response = await fetch(`${this.baseUrl}/logins`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
        tou: true, // Terms of use acceptance
        pp: true, // Privacy policy acceptance
      }),
    });

    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      throw new KilterBoardError(
        errorData.message || "Login failed",
        response.status
      );
    }

    const data = await response.json();
    const login = data.login;

    return {
      token: login.token,
      userId: login.user_id,
      username: login.username,
      expiresAt: new Date(login.expires_at),
    };
  }

  /**
   * Sync data from Kilter Board API
   */
  async sync(
    token: string,
    options: KilterSyncOptions = {}
  ): Promise<KilterSyncResponse> {
    const tables: Record<string, string> = {};

    if (options.since) {
      const sinceStr = options.since.toISOString();
      tables.ascents = sinceStr;
      tables.attempts = sinceStr;
      tables.climbs = "2020-01-01T00:00:00Z"; // Climbs rarely change, use older date
    } else if (options.tables) {
      if (options.tables.ascents) tables.ascents = options.tables.ascents;
      if (options.tables.attempts) tables.attempts = options.tables.attempts;
      if (options.tables.climbs) tables.climbs = options.tables.climbs;
    }

    const response = await fetch(`${this.baseUrl}/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        client: {
          enforces_product_passwords: 1,
          enforce_hover_time: 1,
          enforce_minimum_time: 1,
        },
        tables: Object.keys(tables).length > 0 ? tables : undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      throw new KilterBoardError(
        errorData.message || "Sync failed",
        response.status
      );
    }

    const data = await response.json();

    // Extract data from PUT response format
    const put = data.PUT || {};

    return {
      climbs: put.climbs || [],
      ascents: put.ascents || [],
      attempts: put.attempts || [],
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
      // Try a minimal sync request to check token validity
      const response = await fetch(`${this.baseUrl}/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client: {
            enforces_product_passwords: 1,
          },
          tables: {},
        }),
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
