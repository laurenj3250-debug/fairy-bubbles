import { describe, it, expect, vi, beforeEach } from "vitest";

// Import the matcher (will be implemented)
import {
  checkWorkoutMatchCriteria,
  checkSessionMatchCriteria,
  findMatchingMappingsForWorkout,
  findMatchingMappingsForSession,
  processHabitMatches,
  type MatchCriteria,
  type MatchResult,
} from "../habit-matcher";

import type { ExternalWorkout, ClimbingSession, HabitDataMapping } from "@shared/schema";

describe("Habit Matcher", () => {
  describe("checkWorkoutMatchCriteria", () => {
    const baseWorkout: Partial<ExternalWorkout> = {
      id: 1,
      userId: 1,
      sourceType: "apple_watch",
      externalId: "test-123",
      workoutType: "HKWorkoutActivityTypeClimbing",
      startTime: new Date("2025-11-20T09:00:00Z"),
      endTime: new Date("2025-11-20T10:00:00Z"),
      durationMinutes: 60,
      caloriesBurned: 400,
      metadata: { isIndoor: true },
    };

    it("should match workout by type (single type)", () => {
      const criteria: MatchCriteria = {
        workoutType: "HKWorkoutActivityTypeClimbing",
      };

      const result = checkWorkoutMatchCriteria(baseWorkout as ExternalWorkout, criteria);
      expect(result).toBe(true);
    });

    it("should match workout by type (array of types)", () => {
      const criteria: MatchCriteria = {
        workoutType: ["HKWorkoutActivityTypeClimbing", "HKWorkoutActivityTypeRunning"],
      };

      const result = checkWorkoutMatchCriteria(baseWorkout as ExternalWorkout, criteria);
      expect(result).toBe(true);
    });

    it("should not match different workout type", () => {
      const criteria: MatchCriteria = {
        workoutType: "HKWorkoutActivityTypeRunning",
      };

      const result = checkWorkoutMatchCriteria(baseWorkout as ExternalWorkout, criteria);
      expect(result).toBe(false);
    });

    it("should match workout by minimum duration", () => {
      const criteria: MatchCriteria = {
        minDuration: 30,
      };

      const result = checkWorkoutMatchCriteria(baseWorkout as ExternalWorkout, criteria);
      expect(result).toBe(true);
    });

    it("should not match workout below minimum duration", () => {
      const criteria: MatchCriteria = {
        minDuration: 90, // 90 minutes required
      };

      const result = checkWorkoutMatchCriteria(baseWorkout as ExternalWorkout, criteria);
      expect(result).toBe(false);
    });

    it("should match workout by minimum calories", () => {
      const criteria: MatchCriteria = {
        minCalories: 300,
      };

      const result = checkWorkoutMatchCriteria(baseWorkout as ExternalWorkout, criteria);
      expect(result).toBe(true);
    });

    it("should not match workout below minimum calories", () => {
      const criteria: MatchCriteria = {
        minCalories: 500,
      };

      const result = checkWorkoutMatchCriteria(baseWorkout as ExternalWorkout, criteria);
      expect(result).toBe(false);
    });

    it("should match with multiple criteria (all must pass)", () => {
      const criteria: MatchCriteria = {
        workoutType: "HKWorkoutActivityTypeClimbing",
        minDuration: 30,
        minCalories: 300,
      };

      const result = checkWorkoutMatchCriteria(baseWorkout as ExternalWorkout, criteria);
      expect(result).toBe(true);
    });

    it("should not match if any criteria fails", () => {
      const criteria: MatchCriteria = {
        workoutType: "HKWorkoutActivityTypeClimbing",
        minDuration: 30,
        minCalories: 500, // This will fail
      };

      const result = checkWorkoutMatchCriteria(baseWorkout as ExternalWorkout, criteria);
      expect(result).toBe(false);
    });

    it("should match with empty criteria (matches everything)", () => {
      const criteria: MatchCriteria = {};

      const result = checkWorkoutMatchCriteria(baseWorkout as ExternalWorkout, criteria);
      expect(result).toBe(true);
    });

    it("should match by keywords in workout type", () => {
      const criteria: MatchCriteria = {
        keywords: ["Climbing"],
      };

      const result = checkWorkoutMatchCriteria(baseWorkout as ExternalWorkout, criteria);
      expect(result).toBe(true);
    });

    it("should be case-insensitive for keywords", () => {
      const criteria: MatchCriteria = {
        keywords: ["climbing"],
      };

      const result = checkWorkoutMatchCriteria(baseWorkout as ExternalWorkout, criteria);
      expect(result).toBe(true);
    });
  });

  describe("checkSessionMatchCriteria", () => {
    const baseSession: Partial<ClimbingSession> = {
      id: 1,
      userId: 1,
      sourceType: "kilter_board",
      externalId: "session-123",
      sessionDate: "2025-11-20",
      problemsAttempted: 10,
      problemsSent: 6,
      averageGrade: "V4",
      maxGrade: "V6",
      boardAngle: 40,
      climbs: [],
    };

    it("should match session by minimum problems sent", () => {
      const criteria: MatchCriteria = {
        minProblems: 5,
      };

      const result = checkSessionMatchCriteria(baseSession as ClimbingSession, criteria);
      expect(result).toBe(true);
    });

    it("should not match session below minimum problems", () => {
      const criteria: MatchCriteria = {
        minProblems: 10, // 10 required, only 6 sent
      };

      const result = checkSessionMatchCriteria(baseSession as ClimbingSession, criteria);
      expect(result).toBe(false);
    });

    it("should match session by minimum grade", () => {
      const criteria: MatchCriteria = {
        minGrade: "V4", // Session max is V6
      };

      const result = checkSessionMatchCriteria(baseSession as ClimbingSession, criteria);
      expect(result).toBe(true);
    });

    it("should not match session below minimum grade", () => {
      const criteria: MatchCriteria = {
        minGrade: "V8", // Session max is V6
      };

      const result = checkSessionMatchCriteria(baseSession as ClimbingSession, criteria);
      expect(result).toBe(false);
    });

    it("should match session by board angle", () => {
      const criteria: MatchCriteria = {
        boardAngle: 40,
      };

      const result = checkSessionMatchCriteria(baseSession as ClimbingSession, criteria);
      expect(result).toBe(true);
    });

    it("should not match session with different board angle", () => {
      const criteria: MatchCriteria = {
        boardAngle: 45,
      };

      const result = checkSessionMatchCriteria(baseSession as ClimbingSession, criteria);
      expect(result).toBe(false);
    });

    it("should match with multiple criteria", () => {
      const criteria: MatchCriteria = {
        minProblems: 3,
        minGrade: "V3",
      };

      const result = checkSessionMatchCriteria(baseSession as ClimbingSession, criteria);
      expect(result).toBe(true);
    });

    it("should match session with empty criteria", () => {
      const criteria: MatchCriteria = {};

      const result = checkSessionMatchCriteria(baseSession as ClimbingSession, criteria);
      expect(result).toBe(true);
    });
  });

  describe("findMatchingMappingsForWorkout", () => {
    const workout: Partial<ExternalWorkout> = {
      id: 1,
      userId: 1,
      sourceType: "apple_watch",
      workoutType: "HKWorkoutActivityTypeClimbing",
      durationMinutes: 60,
      caloriesBurned: 400,
      startTime: new Date("2025-11-20T09:00:00Z"),
      endTime: new Date("2025-11-20T10:00:00Z"),
    };

    const mappings: Partial<HabitDataMapping>[] = [
      {
        id: 1,
        userId: 1,
        habitId: 101,
        sourceType: "apple_watch",
        matchCriteria: { workoutType: "HKWorkoutActivityTypeClimbing" },
        autoComplete: true,
        autoIncrement: false,
      },
      {
        id: 2,
        userId: 1,
        habitId: 102,
        sourceType: "apple_watch",
        matchCriteria: { workoutType: "HKWorkoutActivityTypeRunning" },
        autoComplete: true,
        autoIncrement: false,
      },
      {
        id: 3,
        userId: 1,
        habitId: 103,
        sourceType: "kilter_board", // Different source
        matchCriteria: { minProblems: 5 },
        autoComplete: true,
        autoIncrement: true,
      },
    ];

    it("should find matching mappings for workout", () => {
      const result = findMatchingMappingsForWorkout(
        workout as ExternalWorkout,
        mappings as HabitDataMapping[]
      );

      expect(result).toHaveLength(1);
      expect(result[0].habitId).toBe(101);
    });

    it("should filter by source type", () => {
      const result = findMatchingMappingsForWorkout(
        workout as ExternalWorkout,
        mappings as HabitDataMapping[]
      );

      // Should not include kilter_board mapping
      expect(result.every((m) => m.sourceType === "apple_watch")).toBe(true);
    });

    it("should return empty array when no mappings match", () => {
      const runningWorkout = {
        ...workout,
        workoutType: "HKWorkoutActivityTypeYoga",
      };

      const result = findMatchingMappingsForWorkout(
        runningWorkout as ExternalWorkout,
        mappings as HabitDataMapping[]
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("findMatchingMappingsForSession", () => {
    const session: Partial<ClimbingSession> = {
      id: 1,
      userId: 1,
      sourceType: "kilter_board",
      sessionDate: "2025-11-20",
      problemsSent: 8,
      maxGrade: "V5",
      boardAngle: 40,
    };

    const mappings: Partial<HabitDataMapping>[] = [
      {
        id: 1,
        userId: 1,
        habitId: 101,
        sourceType: "kilter_board",
        matchCriteria: { minProblems: 5 },
        autoComplete: true,
        autoIncrement: true,
      },
      {
        id: 2,
        userId: 1,
        habitId: 102,
        sourceType: "kilter_board",
        matchCriteria: { minProblems: 10 }, // Won't match
        autoComplete: true,
        autoIncrement: false,
      },
      {
        id: 3,
        userId: 1,
        habitId: 103,
        sourceType: "apple_watch", // Different source
        matchCriteria: { workoutType: "HKWorkoutActivityTypeClimbing" },
        autoComplete: true,
        autoIncrement: false,
      },
    ];

    it("should find matching mappings for session", () => {
      const result = findMatchingMappingsForSession(
        session as ClimbingSession,
        mappings as HabitDataMapping[]
      );

      expect(result).toHaveLength(1);
      expect(result[0].habitId).toBe(101);
    });

    it("should filter by source type", () => {
      const result = findMatchingMappingsForSession(
        session as ClimbingSession,
        mappings as HabitDataMapping[]
      );

      expect(result.every((m) => m.sourceType === "kilter_board")).toBe(true);
    });
  });

  describe("processHabitMatches", () => {
    it("should return match results for binary habits", async () => {
      const workout: Partial<ExternalWorkout> = {
        id: 1,
        userId: 1,
        sourceType: "apple_watch",
        workoutType: "HKWorkoutActivityTypeClimbing",
        durationMinutes: 60,
        startTime: new Date("2025-11-20T09:00:00Z"),
        endTime: new Date("2025-11-20T10:00:00Z"),
      };

      const mappings: Partial<HabitDataMapping>[] = [
        {
          id: 1,
          userId: 1,
          habitId: 101,
          sourceType: "apple_watch",
          matchCriteria: { workoutType: "HKWorkoutActivityTypeClimbing" },
          autoComplete: true,
          autoIncrement: false,
        },
      ];

      const result = processHabitMatches(
        workout as ExternalWorkout,
        mappings as HabitDataMapping[],
        "2025-11-20"
      );

      expect(result).toHaveLength(1);
      expect(result[0].habitId).toBe(101);
      expect(result[0].action).toBe("complete");
      expect(result[0].date).toBe("2025-11-20");
    });

    it("should return increment action for cumulative habits", () => {
      const session: Partial<ClimbingSession> = {
        id: 1,
        userId: 1,
        sourceType: "kilter_board",
        sessionDate: "2025-11-20",
        problemsSent: 8,
        maxGrade: "V5",
      };

      const mappings: Partial<HabitDataMapping>[] = [
        {
          id: 1,
          userId: 1,
          habitId: 101,
          sourceType: "kilter_board",
          matchCriteria: { minProblems: 3 },
          autoComplete: true,
          autoIncrement: true,
        },
      ];

      const result = processHabitMatches(
        session as ClimbingSession,
        mappings as HabitDataMapping[],
        "2025-11-20",
        { incrementValue: 8 } // Problems sent
      );

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe("increment");
      expect(result[0].incrementValue).toBe(8);
    });

    it("should skip mappings with autoComplete disabled", () => {
      const workout: Partial<ExternalWorkout> = {
        id: 1,
        userId: 1,
        sourceType: "apple_watch",
        workoutType: "HKWorkoutActivityTypeClimbing",
        durationMinutes: 60,
        startTime: new Date("2025-11-20T09:00:00Z"),
        endTime: new Date("2025-11-20T10:00:00Z"),
      };

      const mappings: Partial<HabitDataMapping>[] = [
        {
          id: 1,
          userId: 1,
          habitId: 101,
          sourceType: "apple_watch",
          matchCriteria: { workoutType: "HKWorkoutActivityTypeClimbing" },
          autoComplete: false, // Disabled
          autoIncrement: false,
        },
      ];

      const result = processHabitMatches(
        workout as ExternalWorkout,
        mappings as HabitDataMapping[],
        "2025-11-20"
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("Grade comparison", () => {
    it("should correctly compare V-grades", () => {
      const session: Partial<ClimbingSession> = {
        id: 1,
        userId: 1,
        sourceType: "kilter_board",
        maxGrade: "V5",
      };

      // V5 >= V4 should match
      expect(
        checkSessionMatchCriteria(session as ClimbingSession, { minGrade: "V4" })
      ).toBe(true);

      // V5 >= V5 should match
      expect(
        checkSessionMatchCriteria(session as ClimbingSession, { minGrade: "V5" })
      ).toBe(true);

      // V5 >= V6 should not match
      expect(
        checkSessionMatchCriteria(session as ClimbingSession, { minGrade: "V6" })
      ).toBe(false);
    });

    it("should handle V0 correctly", () => {
      const session: Partial<ClimbingSession> = {
        id: 1,
        userId: 1,
        sourceType: "kilter_board",
        maxGrade: "V0",
      };

      expect(
        checkSessionMatchCriteria(session as ClimbingSession, { minGrade: "V0" })
      ).toBe(true);

      expect(
        checkSessionMatchCriteria(session as ClimbingSession, { minGrade: "V1" })
      ).toBe(false);
    });

    it("should handle V12+ correctly", () => {
      const session: Partial<ClimbingSession> = {
        id: 1,
        userId: 1,
        sourceType: "kilter_board",
        maxGrade: "V12+",
      };

      expect(
        checkSessionMatchCriteria(session as ClimbingSession, { minGrade: "V10" })
      ).toBe(true);

      expect(
        checkSessionMatchCriteria(session as ClimbingSession, { minGrade: "V12+" })
      ).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("should handle workout with undefined optional fields", () => {
      const workout: Partial<ExternalWorkout> = {
        id: 1,
        userId: 1,
        sourceType: "apple_watch",
        workoutType: "HKWorkoutActivityTypeClimbing",
        durationMinutes: 60,
        startTime: new Date(),
        endTime: new Date(),
        // caloriesBurned is undefined
      };

      const criteria: MatchCriteria = {
        workoutType: "HKWorkoutActivityTypeClimbing",
        // No calorie requirement
      };

      expect(checkWorkoutMatchCriteria(workout as ExternalWorkout, criteria)).toBe(true);
    });

    it("should handle session with undefined grade", () => {
      const session: Partial<ClimbingSession> = {
        id: 1,
        userId: 1,
        sourceType: "kilter_board",
        problemsSent: 5,
        // maxGrade is undefined
      };

      // Should not match if minGrade is required
      expect(
        checkSessionMatchCriteria(session as ClimbingSession, { minGrade: "V3" })
      ).toBe(false);

      // Should match if no grade requirement
      expect(
        checkSessionMatchCriteria(session as ClimbingSession, { minProblems: 3 })
      ).toBe(true);
    });

    it("should handle empty mappings array", () => {
      const workout: Partial<ExternalWorkout> = {
        id: 1,
        userId: 1,
        sourceType: "apple_watch",
        workoutType: "HKWorkoutActivityTypeClimbing",
      };

      const result = findMatchingMappingsForWorkout(workout as ExternalWorkout, []);
      expect(result).toHaveLength(0);
    });
  });
});
