import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Import the parser (will be implemented)
import {
  groupIntoSessions,
  difficultyToGrade,
  calculateSessionStats,
  toClimbingSessionInsert,
  generateSessionExternalId,
  type KilterAscent,
  type KilterAttempt,
  type KilterClimb,
  type ParsedClimbingSession,
} from "../kilter-board-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturesPath = path.join(__dirname, "fixtures");

describe("Kilter Board Parser", () => {
  let syncData: any;

  beforeAll(() => {
    syncData = JSON.parse(
      fs.readFileSync(path.join(fixturesPath, "kilter-sync-response.json"), "utf-8")
    );
  });

  describe("difficultyToGrade", () => {
    it("should convert low difficulty (1-12) to V0", () => {
      expect(difficultyToGrade(1)).toBe("V0");
      expect(difficultyToGrade(10)).toBe("V0");
      expect(difficultyToGrade(12)).toBe("V0");
    });

    it("should convert mid-range difficulties correctly", () => {
      // V1 = 13-14, V2 = 15, V3 = 16-17, V4 = 18-19
      expect(difficultyToGrade(13)).toBe("V1");
      expect(difficultyToGrade(15)).toBe("V2");
      expect(difficultyToGrade(16)).toBe("V3");
      expect(difficultyToGrade(18)).toBe("V4");
      expect(difficultyToGrade(20)).toBe("V5");
      expect(difficultyToGrade(22)).toBe("V6");
    });

    it("should convert high difficulties to hard grades", () => {
      // V7 = 23, V8 = 24-25, V9 = 26, V10 = 27, V11 = 28, V12 = 29
      expect(difficultyToGrade(23)).toBe("V7");
      expect(difficultyToGrade(24)).toBe("V8");
      expect(difficultyToGrade(26)).toBe("V9");
      expect(difficultyToGrade(27)).toBe("V10");
      expect(difficultyToGrade(29)).toBe("V12");
    });

    it("should handle edge cases", () => {
      expect(difficultyToGrade(0)).toBe("V0");
      expect(difficultyToGrade(-1)).toBe("V0");
      expect(difficultyToGrade(35)).toBe("V16+");
    });

    it("should round decimal difficulty values", () => {
      expect(difficultyToGrade(16.4)).toBe("V3");
      expect(difficultyToGrade(16.6)).toBe("V3"); // rounds to 17
      expect(difficultyToGrade(18.5)).toBe("V4"); // rounds to 19
    });
  });

  describe("generateSessionExternalId", () => {
    it("should generate consistent ID for same session data", () => {
      const session1 = {
        userId: 67890,
        sessionDate: "2025-11-20",
        sourceType: "kilter_board" as const,
      };

      const id1 = generateSessionExternalId(session1);
      const id2 = generateSessionExternalId(session1);

      expect(id1).toBe(id2);
    });

    it("should generate different IDs for different sessions", () => {
      const session1 = {
        userId: 67890,
        sessionDate: "2025-11-20",
        sourceType: "kilter_board" as const,
      };

      const session2 = {
        userId: 67890,
        sessionDate: "2025-11-19",
        sourceType: "kilter_board" as const,
      };

      expect(generateSessionExternalId(session1)).not.toBe(
        generateSessionExternalId(session2)
      );
    });

    it("should generate different IDs for different users on same day", () => {
      const session1 = {
        userId: 67890,
        sessionDate: "2025-11-20",
        sourceType: "kilter_board" as const,
      };

      const session2 = {
        userId: 12345,
        sessionDate: "2025-11-20",
        sourceType: "kilter_board" as const,
      };

      expect(generateSessionExternalId(session1)).not.toBe(
        generateSessionExternalId(session2)
      );
    });
  });

  describe("groupIntoSessions", () => {
    it("should group ascents from the same day into one session", () => {
      const ascents: KilterAscent[] = syncData.PUT.ascents.filter(
        (a: KilterAscent) => a.climbed_at.startsWith("2025-11-20")
      );
      const attempts: KilterAttempt[] = syncData.PUT.attempts.filter(
        (a: KilterAttempt) => a.created_at.startsWith("2025-11-20")
      );
      const climbs: KilterClimb[] = syncData.PUT.climbs;

      const sessions = groupIntoSessions(ascents, attempts, climbs, 67890);

      expect(sessions.length).toBe(1);
      expect(sessions[0].sessionDate).toBe("2025-11-20");
      expect(sessions[0].problemsSent).toBe(3); // 3 ascents on Nov 20
    });

    it("should create separate sessions for different days", () => {
      const ascents: KilterAscent[] = syncData.PUT.ascents;
      const attempts: KilterAttempt[] = syncData.PUT.attempts;
      const climbs: KilterClimb[] = syncData.PUT.climbs;

      const sessions = groupIntoSessions(ascents, attempts, climbs, 67890);

      expect(sessions.length).toBe(2); // Nov 19 and Nov 20

      const sessionDates = sessions.map((s) => s.sessionDate).sort();
      expect(sessionDates).toEqual(["2025-11-19", "2025-11-20"]);
    });

    it("should count both attempts and sends", () => {
      const ascents: KilterAscent[] = syncData.PUT.ascents.filter(
        (a: KilterAscent) => a.climbed_at.startsWith("2025-11-20")
      );
      const attempts: KilterAttempt[] = syncData.PUT.attempts.filter(
        (a: KilterAttempt) => a.created_at.startsWith("2025-11-20")
      );
      const climbs: KilterClimb[] = syncData.PUT.climbs;

      const sessions = groupIntoSessions(ascents, attempts, climbs, 67890);

      expect(sessions[0].problemsSent).toBe(3);
      expect(sessions[0].problemsAttempted).toBeGreaterThanOrEqual(3); // At least the sends
    });

    it("should include climb details in session", () => {
      const ascents: KilterAscent[] = syncData.PUT.ascents.filter(
        (a: KilterAscent) => a.climbed_at.startsWith("2025-11-20")
      );
      const climbs: KilterClimb[] = syncData.PUT.climbs;

      const sessions = groupIntoSessions(ascents, [], climbs, 67890);

      expect(sessions[0].climbs.length).toBeGreaterThan(0);
      expect(sessions[0].climbs[0]).toHaveProperty("climbId");
      expect(sessions[0].climbs[0]).toHaveProperty("name");
      expect(sessions[0].climbs[0]).toHaveProperty("grade");
      expect(sessions[0].climbs[0]).toHaveProperty("sent");
    });

    it("should handle empty input gracefully", () => {
      const sessions = groupIntoSessions([], [], [], 67890);
      expect(sessions).toEqual([]);
    });

    it("should handle ascents without matching climbs", () => {
      const ascents: KilterAscent[] = [
        {
          uuid: "orphan-ascent",
          climb_uuid: "non-existent-climb",
          user_id: 67890,
          angle: 40,
          is_mirror: false,
          attempt_id: null,
          bid_count: 1,
          quality: 3,
          difficulty: 5,
          is_benchmark: false,
          comment: "",
          climbed_at: "2025-11-20T10:00:00Z",
          created_at: "2025-11-20T10:05:00Z",
        },
      ];

      const sessions = groupIntoSessions(ascents, [], [], 67890);

      expect(sessions.length).toBe(1);
      expect(sessions[0].climbs[0].name).toBe("Unknown Climb");
    });
  });

  describe("calculateSessionStats", () => {
    it("should calculate average grade from climbs", () => {
      const climbs = [
        { grade: "V3", sent: true },
        { grade: "V5", sent: true },
        { grade: "V4", sent: true },
      ];

      const stats = calculateSessionStats(climbs as any);

      expect(stats.averageGrade).toBe("V4"); // Average of V3, V4, V5
    });

    it("should find max grade from sent climbs", () => {
      const climbs = [
        { grade: "V3", sent: true },
        { grade: "V6", sent: true },
        { grade: "V4", sent: true },
        { grade: "V8", sent: false }, // Not sent, shouldn't count
      ];

      const stats = calculateSessionStats(climbs as any);

      expect(stats.maxGrade).toBe("V6");
    });

    it("should handle empty climbs array", () => {
      const stats = calculateSessionStats([]);

      expect(stats.averageGrade).toBeUndefined();
      expect(stats.maxGrade).toBeUndefined();
    });

    it("should only count sent climbs for max grade", () => {
      const climbs = [
        { grade: "V3", sent: false },
        { grade: "V5", sent: false },
      ];

      const stats = calculateSessionStats(climbs as any);

      expect(stats.maxGrade).toBeUndefined();
    });
  });

  describe("toClimbingSessionInsert", () => {
    it("should convert parsed session to database insert format", () => {
      const session: ParsedClimbingSession = {
        userId: 67890,
        sourceType: "kilter_board",
        sessionDate: "2025-11-20",
        sessionStartTime: new Date("2025-11-20T14:00:00Z"),
        problemsAttempted: 5,
        problemsSent: 3,
        averageGrade: "V4",
        maxGrade: "V5",
        boardAngle: 40,
        climbs: [
          {
            climbId: "climb-001",
            name: "Test Climb",
            grade: "V4",
            angle: 40,
            attempts: 2,
            sent: true,
            sentAt: new Date("2025-11-20T14:30:00Z"),
            quality: 4,
          },
        ],
      };

      const insert = toClimbingSessionInsert(session, 1);

      expect(insert.userId).toBe(1);
      expect(insert.sourceType).toBe("kilter_board");
      expect(insert.sessionDate).toBe("2025-11-20");
      expect(insert.problemsAttempted).toBe(5);
      expect(insert.problemsSent).toBe(3);
      expect(insert.averageGrade).toBe("V4");
      expect(insert.maxGrade).toBe("V5");
      expect(insert.boardAngle).toBe(40);
      expect(insert.climbs).toHaveLength(1);
      expect(insert.externalId).toBeDefined();
    });

    it("should generate unique external ID", () => {
      const session: ParsedClimbingSession = {
        userId: 67890,
        sourceType: "kilter_board",
        sessionDate: "2025-11-20",
        problemsAttempted: 3,
        problemsSent: 2,
        climbs: [],
      };

      const insert = toClimbingSessionInsert(session, 1);

      expect(insert.externalId).toBeDefined();
      expect(typeof insert.externalId).toBe("string");
      expect(insert.externalId.length).toBeGreaterThan(0);
    });
  });

  describe("Session time calculations", () => {
    it("should calculate session duration from first to last activity", () => {
      const ascents: KilterAscent[] = [
        {
          uuid: "a1",
          climb_uuid: "c1",
          user_id: 67890,
          angle: 40,
          is_mirror: false,
          attempt_id: null,
          bid_count: 1,
          quality: 4,
          difficulty: 5,
          is_benchmark: false,
          comment: "",
          climbed_at: "2025-11-20T14:00:00Z",
          created_at: "2025-11-20T14:05:00Z",
        },
        {
          uuid: "a2",
          climb_uuid: "c2",
          user_id: 67890,
          angle: 40,
          is_mirror: false,
          attempt_id: null,
          bid_count: 1,
          quality: 4,
          difficulty: 5,
          is_benchmark: false,
          comment: "",
          climbed_at: "2025-11-20T15:30:00Z",
          created_at: "2025-11-20T15:35:00Z",
        },
      ];

      const sessions = groupIntoSessions(ascents, [], [], 67890);

      expect(sessions[0].durationMinutes).toBe(90); // 1.5 hours
    });

    it("should set session start time to earliest activity", () => {
      const ascents: KilterAscent[] = [
        {
          uuid: "a1",
          climb_uuid: "c1",
          user_id: 67890,
          angle: 40,
          is_mirror: false,
          attempt_id: null,
          bid_count: 1,
          quality: 4,
          difficulty: 5,
          is_benchmark: false,
          comment: "",
          climbed_at: "2025-11-20T15:00:00Z",
          created_at: "2025-11-20T15:05:00Z",
        },
        {
          uuid: "a2",
          climb_uuid: "c2",
          user_id: 67890,
          angle: 40,
          is_mirror: false,
          attempt_id: null,
          bid_count: 1,
          quality: 4,
          difficulty: 5,
          is_benchmark: false,
          comment: "",
          climbed_at: "2025-11-20T14:00:00Z",
          created_at: "2025-11-20T14:05:00Z",
        },
      ];

      const sessions = groupIntoSessions(ascents, [], [], 67890);

      expect(sessions[0].sessionStartTime?.toISOString()).toBe(
        "2025-11-20T14:00:00.000Z"
      );
    });
  });

  describe("Board angle handling", () => {
    it("should use most common angle for session", () => {
      const ascents: KilterAscent[] = [
        {
          uuid: "a1",
          climb_uuid: "c1",
          user_id: 67890,
          angle: 40,
          is_mirror: false,
          attempt_id: null,
          bid_count: 1,
          quality: 4,
          difficulty: 5,
          is_benchmark: false,
          comment: "",
          climbed_at: "2025-11-20T14:00:00Z",
          created_at: "2025-11-20T14:05:00Z",
        },
        {
          uuid: "a2",
          climb_uuid: "c2",
          user_id: 67890,
          angle: 40,
          is_mirror: false,
          attempt_id: null,
          bid_count: 1,
          quality: 4,
          difficulty: 5,
          is_benchmark: false,
          comment: "",
          climbed_at: "2025-11-20T14:30:00Z",
          created_at: "2025-11-20T14:35:00Z",
        },
        {
          uuid: "a3",
          climb_uuid: "c3",
          user_id: 67890,
          angle: 45,
          is_mirror: false,
          attempt_id: null,
          bid_count: 1,
          quality: 4,
          difficulty: 5,
          is_benchmark: false,
          comment: "",
          climbed_at: "2025-11-20T15:00:00Z",
          created_at: "2025-11-20T15:05:00Z",
        },
      ];

      const sessions = groupIntoSessions(ascents, [], [], 67890);

      expect(sessions[0].boardAngle).toBe(40); // Most common
    });
  });

  describe("Edge cases", () => {
    it("should handle sessions with only attempts (no sends)", () => {
      const attempts: KilterAttempt[] = [
        {
          uuid: "attempt-only",
          climb_uuid: "climb-001",
          user_id: 67890,
          angle: 40,
          is_mirror: false,
          bid_count: 3,
          created_at: "2025-11-20T14:00:00Z",
        },
      ];
      const climbs: KilterClimb[] = [
        {
          uuid: "climb-001",
          layout_id: 1,
          setter_id: 1234,
          setter_username: "setter",
          name: "Hard Problem",
          description: "",
          frames: "",
          angle: 40,
          quality_average: 4,
          difficulty_average: 18, // V4 in new scale
          benchmark_difficulty: "V4",
          is_draft: false,
          created_at: "2025-11-01T00:00:00Z",
        },
      ];

      const sessions = groupIntoSessions([], attempts, climbs, 67890);

      expect(sessions.length).toBe(1);
      expect(sessions[0].problemsSent).toBe(0);
      expect(sessions[0].problemsAttempted).toBe(1);
    });

    it("should filter out other users' data", () => {
      const ascents: KilterAscent[] = [
        {
          uuid: "a1",
          climb_uuid: "c1",
          user_id: 67890,
          angle: 40,
          is_mirror: false,
          attempt_id: null,
          bid_count: 1,
          quality: 4,
          difficulty: 5,
          is_benchmark: false,
          comment: "",
          climbed_at: "2025-11-20T14:00:00Z",
          created_at: "2025-11-20T14:05:00Z",
        },
        {
          uuid: "a2",
          climb_uuid: "c2",
          user_id: 99999, // Different user
          angle: 40,
          is_mirror: false,
          attempt_id: null,
          bid_count: 1,
          quality: 4,
          difficulty: 5,
          is_benchmark: false,
          comment: "",
          climbed_at: "2025-11-20T14:30:00Z",
          created_at: "2025-11-20T14:35:00Z",
        },
      ];

      const sessions = groupIntoSessions(ascents, [], [], 67890);

      expect(sessions.length).toBe(1);
      expect(sessions[0].problemsSent).toBe(1); // Only user 67890's ascent
    });
  });
});
